from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).resolve().parent / "greenpoint.db"
UTC = timezone.utc

WARNING_MESSAGES = {
    "en": "Warning: Non-segregated waste detected. 20 points deducted.",
    "hi": "चेतावनी: कचरा अलग नहीं किया गया है। 20 अंक काटे गए।",
    "mr": "सूचना: कचरा वर्गीकरण आढळले नाही. 20 गुण वजा केले आहेत.",
}

app = FastAPI(title="GreenPoint Mumbai Prototype API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserOut(BaseModel):
    id: str
    points: int
    violation_count: int


class RewardRequest(BaseModel):
    user_id: str
    collector_id: str = "system-qr"
    geo_tag: str = "mumbai-ward-unknown"


class ViolationRequest(BaseModel):
    user_id: str
    collector_id: str
    violation_type: str = Field(
        default="Non-segregation",
        description="Non-segregation, Littering, Waste Burning",
    )
    geo_tag: str = "mumbai-ward-unknown"


class NotificationOut(BaseModel):
    id: str
    user_id: str
    tier: int
    created_at: str
    english: str | None = None
    hindi: str | None = None
    marathi: str | None = None
    message: str
    acknowledged_at: str | None = None
    acknowledged_by: str | None = None


class NotificationAckRequest(BaseModel):
    acknowledged_by: str = "citizen"


@contextmanager
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                points INTEGER NOT NULL DEFAULT 0,
                violation_count INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ledger (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                points_delta INTEGER NOT NULL,
                offense_tier INTEGER,
                violation_type TEXT,
                collector_id TEXT NOT NULL,
                geo_tag TEXT NOT NULL,
                details TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                tier INTEGER NOT NULL,
                english TEXT,
                hindi TEXT,
                marathi TEXT,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                acknowledged_at TEXT,
                acknowledged_by TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        existing_notification_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(notifications)").fetchall()
        }
        if "acknowledged_at" not in existing_notification_columns:
            conn.execute("ALTER TABLE notifications ADD COLUMN acknowledged_at TEXT")
        if "acknowledged_by" not in existing_notification_columns:
            conn.execute("ALTER TABLE notifications ADD COLUMN acknowledged_by TEXT")


def ensure_user(conn: sqlite3.Connection, user_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row:
        return row
    conn.execute(
        "INSERT INTO users (id, points, violation_count) VALUES (?, 0, 0)",
        (user_id,),
    )
    return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def user_to_out(row: sqlite3.Row) -> UserOut:
    return UserOut(
        id=row["id"],
        points=row["points"],
        violation_count=row["violation_count"],
    )


# Ensure local sqlite tables exist even when startup event is bypassed in tests.
init_db()


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "name": "GreenPoint Mumbai Prototype API",
        "status": "ok",
        "active_routes": [
            "/health",
            "/user/{user_id}",
            "/users",
            "/reward",
            "/violation",
            "/notifications/{user_id}",
            "/notifications/{notification_id}/acknowledge",
            "/ledger/{user_id}",
        ],
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/user/{user_id}", response_model=UserOut)
def get_user(user_id: str) -> UserOut:
    with get_db() as conn:
        row = ensure_user(conn, user_id)
        return user_to_out(row)


@app.post("/reward")
def reward(req: RewardRequest) -> dict[str, Any]:
    event_id = str(uuid4())
    created_at = utc_now_iso()
    with get_db() as conn:
        user = ensure_user(conn, req.user_id)
        new_points = user["points"] + 10
        conn.execute(
            "UPDATE users SET points = ? WHERE id = ?",
            (new_points, req.user_id),
        )
        conn.execute(
            """
            INSERT INTO ledger
                (id, user_id, event_type, points_delta, offense_tier, violation_type,
                 collector_id, geo_tag, details, created_at)
            VALUES (?, ?, 'reward', 10, NULL, NULL, ?, ?, ?, ?)
            """,
            (
                event_id,
                req.user_id,
                req.collector_id,
                req.geo_tag,
                "Daily segregation reward",
                created_at,
            ),
        )
        updated = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (req.user_id,),
        ).fetchone()
        return {
            "event_id": event_id,
            "timestamp": created_at,
            "user": user_to_out(updated).model_dump(),
            "points_added": 10,
        }


@app.post("/violation")
def violation(req: ViolationRequest) -> dict[str, Any]:
    event_id = str(uuid4())
    created_at = utc_now_iso()
    now = datetime.now(UTC)
    window_start = (now - timedelta(days=30)).isoformat()

    with get_db() as conn:
        user = ensure_user(conn, req.user_id)
        prior_violations = conn.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM ledger
            WHERE user_id = ?
              AND event_type = 'violation'
              AND created_at >= ?
            """,
            (req.user_id, window_start),
        ).fetchone()["cnt"]
        tier = min(prior_violations + 1, 3)

        points_delta = 0
        message = ""
        english = None
        hindi = None
        marathi = None
        monetary_fine_inr = 0

        if tier == 1:
            points_delta = -20
            english = WARNING_MESSAGES["en"]
            hindi = WARNING_MESSAGES["hi"]
            marathi = WARNING_MESSAGES["mr"]
            message = "Tier 1 warning issued with 20-point deduction."
        elif tier == 2:
            points_delta = -50
            message = "Tier 2 offense: 50 points deducted and society notification issued."
        else:
            points_delta = 0
            monetary_fine_inr = 200
            message = "Tier 3 offense: INR 200 BMC monetary fine issued."

        new_points = max(user["points"] + points_delta, 0)
        new_violation_count = user["violation_count"] + 1

        conn.execute(
            "UPDATE users SET points = ?, violation_count = ? WHERE id = ?",
            (new_points, new_violation_count, req.user_id),
        )

        conn.execute(
            """
            INSERT INTO ledger
                (id, user_id, event_type, points_delta, offense_tier, violation_type,
                 collector_id, geo_tag, details, created_at)
            VALUES (?, ?, 'violation', ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                req.user_id,
                points_delta,
                tier,
                req.violation_type,
                req.collector_id,
                req.geo_tag,
                message,
                created_at,
            ),
        )

        notif_id = str(uuid4())
        conn.execute(
            """
            INSERT INTO notifications
                (id, user_id, tier, english, hindi, marathi, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                notif_id,
                req.user_id,
                tier,
                english,
                hindi,
                marathi,
                message,
                created_at,
            ),
        )

        updated = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (req.user_id,),
        ).fetchone()

        return {
            "event_id": event_id,
            "notification_id": notif_id,
            "timestamp": created_at,
            "offense_tier": tier,
            "points_deducted": abs(points_delta),
            "monetary_fine_inr": monetary_fine_inr,
            "warning_messages": {
                "english": english,
                "hindi": hindi,
                "marathi": marathi,
            },
            "user": user_to_out(updated).model_dump(),
        }


@app.get("/notifications/{user_id}", response_model=list[NotificationOut])
def notifications(user_id: str) -> list[NotificationOut]:
    with get_db() as conn:
        ensure_user(conn, user_id)
        rows = conn.execute(
            """
            SELECT *
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()
        return [NotificationOut(**dict(row)) for row in rows]


@app.post("/notifications/{notification_id}/acknowledge")
def acknowledge_notification(
    notification_id: str, req: NotificationAckRequest
) -> dict[str, str]:
    acknowledged_at = utc_now_iso()
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, user_id FROM notifications WHERE id = ?",
            (notification_id,),
        ).fetchone()
        if not row:
            return {"status": "not_found"}

        conn.execute(
            """
            UPDATE notifications
            SET acknowledged_at = ?, acknowledged_by = ?
            WHERE id = ?
            """,
            (acknowledged_at, req.acknowledged_by, notification_id),
        )

        conn.execute(
            """
            INSERT INTO ledger
                (id, user_id, event_type, points_delta, offense_tier, violation_type,
                 collector_id, geo_tag, details, created_at)
            VALUES (?, ?, 'notification_ack', 0, NULL, NULL, ?, ?, ?, ?)
            """,
            (
                str(uuid4()),
                row["user_id"],
                req.acknowledged_by,
                "citizen-app",
                f"Citizen acknowledged notification {notification_id}",
                acknowledged_at,
            ),
        )

    return {"status": "acknowledged", "acknowledged_at": acknowledged_at}


@app.get("/ledger/{user_id}")
def ledger(user_id: str) -> list[dict[str, Any]]:
    with get_db() as conn:
        ensure_user(conn, user_id)
        rows = conn.execute(
            """
            SELECT *
            FROM ledger
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()
        return [dict(row) for row in rows]


@app.get("/users")
def users() -> list[UserOut]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM users ORDER BY id").fetchall()
        return [user_to_out(row) for row in rows]
