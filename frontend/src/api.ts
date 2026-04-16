import type {
  LeaderboardData,
  LedgerEvent,
  Notification,
  QuizResult,
  QuizState,
  User,
} from "./types";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

type ApiEnvelope<T> = {
  transaction_id: string;
  timestamp: string;
  data: T;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  const payload = (await res.json()) as ApiEnvelope<T>;
  return payload.data;
}

async function callWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const currentUser = localStorage.getItem('current_user');
  const sessionToken = currentUser ? JSON.parse(currentUser).session_token : null;

  if (!sessionToken) {
    throw new Error('No session token found');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const payload = (await res.json()) as ApiEnvelope<T>;
  return payload.data;
}

export const api = {
  getUser: (userId: string) => call<User>(`/user/${userId}`),
  getUsers: () => call<User[]>("/users"),
  reward: (userId: string) =>
    call<{ user: User; points_added: number; xp_points_added: number }>("/reward", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        collector_id: "system-qr",
        geo_tag: "Chembur",
      }),
    }),
  violate: (payload: {
    userId: string;
    collectorId: string;
    violationType: string;
    geoTag: string;
  }) =>
    call<{
      notification_id: string;
      offense_tier: number;
      points_deducted: number;
      monetary_fine_inr: number;
      warning_messages: {
        english: string | null;
        hindi: string | null;
        marathi: string | null;
      };
      user: User;
    }>("/violation", {
      method: "POST",
      body: JSON.stringify({
        user_id: payload.userId,
        collector_id: payload.collectorId,
        violation_type: payload.violationType,
        geo_tag: payload.geoTag,
      }),
    }),
  getNotifications: (userId: string) => call<Notification[]>(`/notifications/${userId}`),
  getLedger: (userId: string) => call<LedgerEvent[]>(`/ledger/${userId}`),
  acknowledgeNotification: (notificationId: string, acknowledgedBy: string) =>
    call<{ status: string; acknowledged_at: string }>(
      `/notifications/${notificationId}/acknowledge`,
      {
        method: "POST",
        body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
      },
    ),
  getLeaderboard: (userId: string) =>
    call<LeaderboardData>(`/leaderboard/${userId}`),
  getQuiz: (userId: string) => call<QuizState>(`/quiz/${userId}`),
  submitQuizAnswer: (userId: string, answer: string) =>
    call<QuizResult>("/quiz/answer", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, answer }),
    }),
  getUserProfile: () =>
    callWithAuth<{
      user_id: string;
      points: number;
      violation_count: number;
      xp_points: number;
      landfill_saved_kg: number;
      co2_saved_kg: number;
      ward: string;
      society_name: string;
      violation_history: Array<{
        id: string;
        offense_tier: number;
        violation_type: string;
        points_delta: number;
        geo_tag: string;
        details: string;
        created_at: string;
      }>;
      pending_notifications: Array<{
        id: string;
        tier: number;
        english: string;
        hindi: string;
        marathi: string;
        message: string;
        created_at: string;
        acknowledged_at: string | null;
      }>;
    }>('/user/profile/private'),
  searchCollectorUsers: (searchQuery: string = '') =>
    callWithAuth<{
      results: Array<{
        user_id: string;
        violation_count: number;
        last_violation_date: string | null;
      }>;
      count: number;
    }>(`/collector/search-users?search_query=${encodeURIComponent(searchQuery)}`),
};
