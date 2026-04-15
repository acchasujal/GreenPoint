import type { LedgerEvent, Notification, User } from "./types";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  getUser: (userId: string) => call<User>(`/user/${userId}`),
  getUsers: () => call<User[]>("/users"),
  reward: (userId: string) =>
    call("/reward", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        collector_id: "system-qr",
        geo_tag: "BMC Ward G-South",
      }),
    }),
  violate: (payload: {
    userId: string;
    collectorId: string;
    violationType: string;
    geoTag: string;
  }) =>
    call("/violation", {
      method: "POST",
      body: JSON.stringify({
        user_id: payload.userId,
        collector_id: payload.collectorId,
        violation_type: payload.violationType,
        geo_tag: payload.geoTag,
      }),
    }),
  getNotifications: (userId: string) =>
    call<Notification[]>(`/notifications/${userId}`),
  getLedger: (userId: string) => call<LedgerEvent[]>(`/ledger/${userId}`),
  acknowledgeNotification: (notificationId: string, acknowledgedBy: string) =>
    call(`/notifications/${notificationId}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
    }),
};
