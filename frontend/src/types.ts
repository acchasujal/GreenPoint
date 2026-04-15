export type User = {
  id: string;
  points: number;
  violation_count: number;
};

export type Notification = {
  id: string;
  user_id: string;
  tier: number;
  created_at: string;
  english: string | null;
  hindi: string | null;
  marathi: string | null;
  message: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
};

export type LedgerEvent = {
  id: string;
  user_id: string;
  event_type: "reward" | "violation" | "notification_ack";
  points_delta: number;
  offense_tier: number | null;
  violation_type: string | null;
  collector_id: string;
  geo_tag: string;
  details: string | null;
  created_at: string;
};
