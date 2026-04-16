from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4
from enum import Enum

import bcrypt
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).resolve().parent / "greenpoint.db"
UTC = timezone.utc

WARNING_MESSAGES = {
    "en": "Warning: Non-segregated waste detected. 20 points deducted.",
    "hi": "चेतावनी: कचरा अलग नहीं किया गया है। 20 अंक काटे गए।",
    "mr": "सूचना: कचरा वर्गीकरण आढळले नाही. 20 गुण वजा केले आहेत.",
}

WARD_STANDINGS = {
    "Chembur": 4250,
    "Vidyavihar": 3890,
}

SOCIETY_RANKS = {
    "Green Heights": {"rank": 2, "total_societies": 11},
    "Vidyavihar Residency": {"rank": 4, "total_societies": 9},
}

DEFAULT_USER_PROFILES = {
    "citizen-1001": {"ward": "Chembur", "society_name": "Green Heights"},
    "citizen-1002": {"ward": "Vidyavihar", "society_name": "Vidyavihar Residency"},
}

QUIZ_QUESTION = {
    "question_id": "waste-wizard-001",
    "question": "Where do expired medicine strips go?",
    "options": ["Green/Wet", "Blue/Dry", "Red/Hazardous"],
    "correct_answer": "Red/Hazardous",
}

COLLECTOR_ACCESS_CODE = "BMC2026"


class UserRole(str, Enum):
    CITIZEN = "citizen"
    COLLECTOR = "collector"


app = FastAPI(title="GreenPoint Mumbai Prototype API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserOut(BaseModel):
    id: str
    points: int
    violation_count: int
    xp_points: int
    landfill_saved_kg: float
    last_quiz_date: str | None = None
    ward: str
    society_name: str


class RewardRequest(BaseModel):
    user_id: str
    collector_id: str = "system-qr"
    geo_tag: str = "Chembur"


class ViolationRequest(BaseModel):
    user_id: str
    collector_id: str
    violation_type: str = Field(
        default="Non-segregation",
        description="Non-segregation, Littering, Waste Burning",
    )
    geo_tag: str = "Chembur"


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


class QuizAnswerRequest(BaseModel):
    user_id: str
    answer: str


class SignupRequest(BaseModel):
    email: str
    password: str
    role: UserRole = UserRole.CITIZEN
    access_code: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    user_id: str
    email: str
    role: str
    session_token: str


class UserProfileResponse(BaseModel):
    user_id: str
    points: int
    violation_count: int
    xp_points: int
    landfill_saved_kg: float
    ward: str
    society_name: str
    violation_history: list[dict[str, Any]]
    pending_notifications: list[dict[str, Any]]


class UserSearchResult(BaseModel):
    user_id: str
    email: str | None = None  # Don't expose to collector
    violation_count: int
    last_violation_date: str | None = None


@contextmanager
def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def utc_now() -> datetime:
    return datetime.now(UTC)


def utc_now_iso() -> str:
    return utc_now().isoformat()


def today_iso_date() -> str:
    return utc_now().date().isoformat()


def audit_response(data: Any, transaction_id: str | None = None) -> dict[str, Any]:
    return {
        "transaction_id": transaction_id or str(uuid4()),
        "timestamp": utc_now_iso(),
        "data": data,
    }


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def generate_session_token(user_id: str, role: str) -> str:
    """Generate a simple session token (simulated JWT for demo purposes)."""
    import base64
    token_data = f"{user_id}:{role}:{utc_now_iso()}"
    return base64.b64encode(token_data.encode()).decode()


def extract_user_from_token(authorization: str | None = Header(None)) -> tuple[str, str]:
    """
    Extract user_id and role from Authorization header.
    Expected format: "Bearer {session_token}"
    Returns: (user_id, role)
    Raises: HTTPException if token is invalid
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise ValueError("Invalid scheme")

        import base64
        decoded = base64.b64decode(token).decode()
        parts = decoded.split(":")
        if len(parts) < 2:
            raise ValueError("Invalid token format")

        user_id, role = parts[0], parts[1]
        return user_id, role
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authorization token: {str(e)}")


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                points INTEGER NOT NULL DEFAULT 0,
                violation_count INTEGER NOT NULL DEFAULT 0,
                xp_points INTEGER NOT NULL DEFAULT 0,
                landfill_saved_kg REAL NOT NULL DEFAULT 0,
                last_quiz_date TEXT,
                ward TEXT NOT NULL DEFAULT 'Chembur',
                society_name TEXT NOT NULL DEFAULT 'Green Heights'
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'citizen',
                created_at TEXT NOT NULL
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

        existing_user_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()
        }
        if "xp_points" not in existing_user_columns:
            conn.execute("ALTER TABLE users ADD COLUMN xp_points INTEGER NOT NULL DEFAULT 0")
        if "landfill_saved_kg" not in existing_user_columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN landfill_saved_kg REAL NOT NULL DEFAULT 0"
            )
        if "last_quiz_date" not in existing_user_columns:
            conn.execute("ALTER TABLE users ADD COLUMN last_quiz_date TEXT")
        if "ward" not in existing_user_columns:
            conn.execute("ALTER TABLE users ADD COLUMN ward TEXT NOT NULL DEFAULT 'Chembur'")
        if "society_name" not in existing_user_columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN society_name TEXT NOT NULL DEFAULT 'Green Heights'"
            )

        existing_notification_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(notifications)").fetchall()
        }
        if "acknowledged_at" not in existing_notification_columns:
            conn.execute("ALTER TABLE notifications ADD COLUMN acknowledged_at TEXT")
        if "acknowledged_by" not in existing_notification_columns:
            conn.execute("ALTER TABLE notifications ADD COLUMN acknowledged_by TEXT")


def default_profile_for_user(user_id: str) -> dict[str, str]:
    if user_id in DEFAULT_USER_PROFILES:
        return DEFAULT_USER_PROFILES[user_id]
    if user_id.endswith("2"):
        return {"ward": "Vidyavihar", "society_name": "Vidyavihar Residency"}
    return {"ward": "Chembur", "society_name": "Green Heights"}


def refresh_user_metrics(conn: sqlite3.Connection, user_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    landfill_saved_kg = round(row["points"] * 0.5, 2)
    conn.execute(
        "UPDATE users SET landfill_saved_kg = ? WHERE id = ?",
        (landfill_saved_kg, user_id),
    )
    return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def ensure_user(conn: sqlite3.Connection, user_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row:
        return refresh_user_metrics(conn, user_id)

    profile = default_profile_for_user(user_id)
    conn.execute(
        """
        INSERT INTO users (
            id, points, violation_count, xp_points, landfill_saved_kg, last_quiz_date, ward, society_name
        ) VALUES (?, 0, 0, 0, 0, NULL, ?, ?)
        """,
        (user_id, profile["ward"], profile["society_name"]),
    )
    return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def user_to_out(row: sqlite3.Row) -> UserOut:
    return UserOut(
        id=row["id"],
        points=row["points"],
        violation_count=row["violation_count"],
        xp_points=row["xp_points"],
        landfill_saved_kg=round(row["landfill_saved_kg"], 2),
        last_quiz_date=row["last_quiz_date"],
        ward=row["ward"],
        society_name=row["society_name"],
    )


def build_society_rank(user: sqlite3.Row) -> dict[str, Any]:
    ranking = SOCIETY_RANKS.get(
        user["society_name"], {"rank": 3, "total_societies": 10}
    )
    return {
        "society_name": user["society_name"],
        "rank": ranking["rank"],
        "total_societies": ranking["total_societies"],
        "ward": user["ward"],
    }


def build_leaderboard() -> list[dict[str, Any]]:
    standings = []
    for idx, (ward, points) in enumerate(
        sorted(WARD_STANDINGS.items(), key=lambda item: item[1], reverse=True), start=1
    ):
        standings.append({"ward": ward, "points": points, "rank": idx})
    return standings


def build_ledger_entry(row: sqlite3.Row) -> dict[str, Any]:
    return {
        **dict(row),
        "transaction_id": row["id"],
        "timestamp": row["created_at"],
        "status": "Verified",
        "location": row["geo_tag"],
    }


# Ensure local sqlite tables exist even when startup event is bypassed in tests.
init_db()


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, Any]:
    return audit_response(
        {
            "name": "GreenPoint Mumbai Prototype API",
            "status": "ok",
            "active_routes": [
                "/health",
                "/signup",
                "/login",
                "/user/{user_id}",
                "/users",
                "/reward",
                "/violation",
                "/notifications/{user_id}",
                "/notifications/{notification_id}/acknowledge",
                "/ledger/{user_id}",
                "/leaderboard/{user_id}",
                "/quiz/{user_id}",
                "/quiz/answer",
            ],
        }
    )


@app.get("/health")
def health() -> dict[str, Any]:
    return audit_response({"status": "ok"})


@app.post("/signup")
def signup(req: SignupRequest) -> dict[str, Any]:
    """Create a new user account."""
    try:
        # Validate collector access code if signing up as collector
        if req.role == UserRole.COLLECTOR:
            if not req.access_code or req.access_code != COLLECTOR_ACCESS_CODE:
                raise HTTPException(status_code=400, detail="Invalid Collector Access Code")

        with get_db() as conn:
            # Check if email already exists
            existing = conn.execute(
                "SELECT id FROM auth_users WHERE email = ?",
                (req.email,),
            ).fetchone()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")

            # Create auth user
            user_id = str(uuid4())
            password_hash = hash_password(req.password)
            created_at = utc_now_iso()

            conn.execute(
                """
                INSERT INTO auth_users (id, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, req.email, password_hash, req.role.value, created_at),
            )

            # Create associated user profile
            profile = {"ward": "Chembur", "society_name": "Green Heights"}
            conn.execute(
                """
                INSERT INTO users (id, points, violation_count, xp_points, landfill_saved_kg, ward, society_name)
                VALUES (?, 0, 0, 0, 0, ?, ?)
                """,
                (user_id, profile["ward"], profile["society_name"]),
            )

            return audit_response(
                {
                    "message": "Signup successful",
                    "user_id": user_id,
                    "email": req.email,
                    "role": req.role.value,
                },
                transaction_id=user_id,
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/login")
def login(req: LoginRequest) -> dict[str, Any]:
    """Authenticate user and return session token."""
    try:
        with get_db() as conn:
            auth_user = conn.execute(
                "SELECT * FROM auth_users WHERE email = ?",
                (req.email,),
            ).fetchone()

            if not auth_user or not verify_password(req.password, auth_user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")

            session_token = generate_session_token(auth_user["id"], auth_user["role"])

            return audit_response(
                {
                    "user_id": auth_user["id"],
                    "email": auth_user["email"],
                    "role": auth_user["role"],
                    "session_token": session_token,
                },
                transaction_id=auth_user["id"],
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/user/{user_id}")
def get_user(user_id: str) -> dict[str, Any]:
    with get_db() as conn:
        row = ensure_user(conn, user_id)
        return audit_response(user_to_out(row).model_dump(), transaction_id=f"user-{user_id}")


@app.get("/user/profile/private")
def get_user_profile_private(
    auth_header: str = Header(None, alias="Authorization"),
) -> dict[str, Any]:
    """
    PRIVATE ENDPOINT: Returns only the current authenticated user's data.
    Prevents data leakage by enforcing authentication and checking user_id.
    """
    user_id, role = extract_user_from_token(auth_header)

    with get_db() as conn:
        # Get user data
        user_row = ensure_user(conn, user_id)

        # Get violation history (last 30 days)
        window_start = (utc_now() - timedelta(days=30)).isoformat()
        violation_rows = conn.execute(
            """
            SELECT id, offense_tier, violation_type, points_delta, geo_tag, details, created_at
            FROM ledger
            WHERE user_id = ? AND event_type = 'violation' AND created_at >= ?
            ORDER BY created_at DESC
            """,
            (user_id, window_start),
        ).fetchall()
        violation_history = [dict(row) for row in violation_rows]

        # Get pending notifications (unacknowledged)
        notif_rows = conn.execute(
            """
            SELECT id, tier, english, hindi, marathi, message, created_at, acknowledged_at
            FROM notifications
            WHERE user_id = ? AND acknowledged_at IS NULL
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()
        pending_notifications = [dict(row) for row in notif_rows]

        profile_data = {
            "user_id": user_row["id"],
            "points": user_row["points"],
            "violation_count": user_row["violation_count"],
            "xp_points": user_row["xp_points"],
            "landfill_saved_kg": round(user_row["landfill_saved_kg"], 2),
            "ward": user_row["ward"],
            "society_name": user_row["society_name"],
            "violation_history": violation_history,
            "pending_notifications": pending_notifications,
        }

        return audit_response(
            profile_data,
            transaction_id=f"profile-{user_id}",
        )


@app.post("/reward")
def reward(req: RewardRequest) -> dict[str, Any]:
    event_id = str(uuid4())
    created_at = utc_now_iso()
    with get_db() as conn:
        user = ensure_user(conn, req.user_id)
        new_points = user["points"] + 10
        new_xp = user["xp_points"] + 10
        conn.execute(
            "UPDATE users SET points = ?, xp_points = ? WHERE id = ?",
            (new_points, new_xp, req.user_id),
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
        updated = refresh_user_metrics(conn, req.user_id)
        return audit_response(
            {
                "user": user_to_out(updated).model_dump(),
                "points_added": 10,
                "xp_points_added": 10,
            },
            transaction_id=event_id,
        )


@app.post("/violation")
def violation(req: ViolationRequest) -> dict[str, Any]:
    event_id = str(uuid4())
    created_at = utc_now_iso()
    window_start = (utc_now() - timedelta(days=30)).isoformat()

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
        
        # DEBUG: Log tier calculation
        print(f"[VIOLATION_DEBUG] User: {req.user_id}, Prior violations: {prior_violations}, Calculated tier: {tier}, Window start: {window_start}")

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

        updated = refresh_user_metrics(conn, req.user_id)

        return audit_response(
            {
                "notification_id": notif_id,
                "offense_tier": tier,
                "points_deducted": abs(points_delta),
                "monetary_fine_inr": monetary_fine_inr,
                "warning_messages": {
                    "english": english,
                    "hindi": hindi,
                    "marathi": marathi,
                },
                "user": user_to_out(updated).model_dump(),
            },
            transaction_id=event_id,
        )


@app.get("/notifications/{user_id}")
def notifications(user_id: str) -> dict[str, Any]:
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
        data = [NotificationOut(**dict(row)).model_dump() for row in rows]
        return audit_response(data, transaction_id=f"notifications-{user_id}")


@app.get("/collector/search-users")
def collector_search_users(
    auth_header: str = Header(None, alias="Authorization"),
    search_query: str = "",
) -> dict[str, Any]:
    """
    Collector endpoint: Search for users to flag violations.
    Returns minimal data (NO personal info, NO points).
    """
    user_id, role = extract_user_from_token(auth_header)

    # Ensure requester is a collector
    if role != UserRole.COLLECTOR.value:
        raise HTTPException(status_code=403, detail="Only collectors can search users")

    with get_db() as conn:
        # Get all users (simple search by user_id prefix)
        if search_query:
            users = conn.execute(
                "SELECT id, violation_count FROM users WHERE id LIKE ? LIMIT 20",
                (f"%{search_query}%",),
            ).fetchall()
        else:
            users = conn.execute(
                "SELECT id, violation_count FROM users LIMIT 20"
            ).fetchall()

        results = []
        for user_row in users:
            # Get last violation date for this user
            last_violation = conn.execute(
                """
                SELECT created_at FROM ledger
                WHERE user_id = ? AND event_type = 'violation'
                ORDER BY created_at DESC LIMIT 1
                """,
                (user_row["id"],),
            ).fetchone()

            results.append({
                "user_id": user_row["id"],
                "violation_count": user_row["violation_count"],
                "last_violation_date": last_violation["created_at"] if last_violation else None,
                # INTENTIONALLY NOT SENDING: points, personal data, email
            })

        return audit_response(
            {
                "results": results,
                "count": len(results),
            },
            transaction_id=f"search-{user_id}",
        )


@app.post("/notifications/{notification_id}/acknowledge")
def acknowledge_notification(
    notification_id: str, req: NotificationAckRequest
) -> dict[str, Any]:
    acknowledged_at = utc_now_iso()
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, user_id FROM notifications WHERE id = ?",
            (notification_id,),
        ).fetchone()
        if not row:
            return audit_response({"status": "not_found"}, transaction_id=notification_id)

        conn.execute(
            """
            UPDATE notifications
            SET acknowledged_at = ?, acknowledged_by = ?
            WHERE id = ?
            """,
            (acknowledged_at, req.acknowledged_by, notification_id),
        )

        ledger_id = str(uuid4())
        conn.execute(
            """
            INSERT INTO ledger
                (id, user_id, event_type, points_delta, offense_tier, violation_type,
                 collector_id, geo_tag, details, created_at)
            VALUES (?, ?, 'notification_ack', 0, NULL, NULL, ?, ?, ?, ?)
            """,
            (
                ledger_id,
                row["user_id"],
                req.acknowledged_by,
                "citizen-app",
                f"Citizen acknowledged notification {notification_id}",
                acknowledged_at,
            ),
        )

    return audit_response(
        {"status": "acknowledged", "acknowledged_at": acknowledged_at},
        transaction_id=notification_id,
    )


@app.get("/ledger/{user_id}")
def ledger(user_id: str) -> dict[str, Any]:
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
        return audit_response(
            [build_ledger_entry(row) for row in rows],
            transaction_id=f"ledger-{user_id}",
        )


@app.get("/users")
def users() -> dict[str, Any]:
    with get_db() as conn:
        for user_id in DEFAULT_USER_PROFILES:
            ensure_user(conn, user_id)
        rows = conn.execute("SELECT * FROM users ORDER BY id").fetchall()
        data = [user_to_out(refresh_user_metrics(conn, row["id"])).model_dump() for row in rows]
        return audit_response(data, transaction_id="users-all")


@app.get("/leaderboard/{user_id}")
def leaderboard(user_id: str) -> dict[str, Any]:
    with get_db() as conn:
        user = ensure_user(conn, user_id)
        return audit_response(
            {
                "standings": build_leaderboard(),
                "my_society": build_society_rank(user),
            },
            transaction_id=f"leaderboard-{user_id}",
        )


@app.get("/quiz/{user_id}")
def get_quiz(user_id: str) -> dict[str, Any]:
    with get_db() as conn:
        user = ensure_user(conn, user_id)
        is_available = user["last_quiz_date"] != today_iso_date()
        return audit_response(
            {
                "available": is_available,
                "question": QUIZ_QUESTION["question"] if is_available else None,
                "question_id": QUIZ_QUESTION["question_id"] if is_available else None,
                "options": QUIZ_QUESTION["options"] if is_available else [],
                "reward_points": 5,
            },
            transaction_id=f"quiz-{user_id}",
        )


@app.post("/quiz/answer")
def submit_quiz_answer(req: QuizAnswerRequest) -> dict[str, Any]:
    event_id = str(uuid4())
    with get_db() as conn:
        user = ensure_user(conn, req.user_id)
        already_played = user["last_quiz_date"] == today_iso_date()
        is_correct = req.answer == QUIZ_QUESTION["correct_answer"]

        if already_played:
            updated = refresh_user_metrics(conn, req.user_id)
            return audit_response(
                {
                    "correct": False,
                    "already_attempted_today": True,
                    "points_added": 0,
                    "user": user_to_out(updated).model_dump(),
                },
                transaction_id=event_id,
            )

        points_added = 5 if is_correct else 0
        xp_added = 5 if is_correct else 0
        details = (
            "Waste Wizard reward for correct hazardous disposal answer"
            if is_correct
            else "Waste Wizard attempted with incorrect answer"
        )

        conn.execute(
            """
            UPDATE users
            SET points = ?, xp_points = ?, last_quiz_date = ?
            WHERE id = ?
            """,
            (
                user["points"] + points_added,
                user["xp_points"] + xp_added,
                today_iso_date(),
                req.user_id,
            ),
        )
        conn.execute(
            """
            INSERT INTO ledger
                (id, user_id, event_type, points_delta, offense_tier, violation_type,
                 collector_id, geo_tag, details, created_at)
            VALUES (?, ?, 'quiz_reward', ?, NULL, NULL, ?, ?, ?, ?)
            """,
            (
                event_id,
                req.user_id,
                points_added,
                "waste-wizard",
                user["ward"],
                details,
                utc_now_iso(),
            ),
        )
        updated = refresh_user_metrics(conn, req.user_id)
        return audit_response(
            {
                "correct": is_correct,
                "already_attempted_today": False,
                "points_added": points_added,
                "xp_points_added": xp_added,
                "correct_answer": QUIZ_QUESTION["correct_answer"],
                "user": user_to_out(updated).model_dump(),
            },
            transaction_id=event_id,
        )
