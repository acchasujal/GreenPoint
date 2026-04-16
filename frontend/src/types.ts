export type User = {
  id: string;
  points: number;
  violation_count: number;
  xp_points: number;
  landfill_saved_kg: number;
  co2_saved_kg: number;
  last_quiz_date: string | null;
  ward: string;
  society_name: string;
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
  event_type: "reward" | "violation" | "notification_ack" | "quiz_reward";
  points_delta: number;
  offense_tier: number | null;
  violation_type: string | null;
  collector_id: string;
  geo_tag: string;
  details: string | null;
  created_at: string;
  transaction_id: string;
  timestamp: string;
  status: string;
  location: string;
};

export type WardStanding = {
  ward: string;
  points: number;
  rank: number;
};

export type SocietyRank = {
  society_name: string;
  rank: number;
  total_societies: number;
  ward: string;
};

export type LeaderboardData = {
  standings: WardStanding[];
  my_society: SocietyRank;
};

export type QuizState = {
  available: boolean;
  question: string | null;
  question_id: string | null;
  options: string[];
  reward_points: number;
};

export type QuizResult = {
  correct: boolean;
  already_attempted_today: boolean;
  points_added: number;
  xp_points_added?: number;
  correct_answer?: string;
  user: User;
};
