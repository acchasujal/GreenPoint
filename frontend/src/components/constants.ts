import { Flame, ShieldAlert, Trash2 } from "lucide-react";

export const DEFAULT_USER = "citizen-1001";
export const BMC_BLUE = "#1E3A8A";
export const GREEN = "#10B981";
export const ALERT_RED = "#DC2626";

export const VIOLATION_TYPES = [
  { key: "Non-segregation", icon: ShieldAlert, tone: "border-red-200 bg-red-50 text-red-700" },
  { key: "Littering", icon: Trash2, tone: "border-amber-200 bg-amber-50 text-amber-700" },
  { key: "Waste Burning", icon: Flame, tone: "border-orange-200 bg-orange-50 text-orange-700" },
] as const;

export const WARNING_COPY = {
  english: "Warning: Non-segregated waste detected. 20 points deducted.",
  hindi: "चेतावनी: कचरा अलग नहीं किया गया है। 20 अंक काटे गए।",
  marathi: "सूचना: कचरा वर्गीकरण आढळले नाही. 20 गुण वजा केले आहेत.",
} as const;

export const LABELS = {
  EN: {
    citizen: "Citizen",
    collector: "Collector",
    wallet: "Wallet Balance",
    points: "Points",
    activity: "Recent Activity",
    notifications: "Violation Alerts",
    language: "Language",
    logSegregation: "Log Segregation (+10)",
    appeal: "Appeal Violation",
  },
  HI: {
    citizen: "नागरिक",
    collector: "कलेक्टर",
    wallet: "वॉलेट बैलेंस",
    points: "अंक",
    activity: "हाल की गतिविधि",
    notifications: "उल्लंघन अलर्ट",
    language: "भाषा",
    logSegregation: "सेग्रिगेशन लॉग करें (+10)",
    appeal: "उल्लंघन पर अपील करें",
  },
  MR: {
    citizen: "नागरिक",
    collector: "संकलक",
    wallet: "वॉलेट शिल्लक",
    points: "गुण",
    activity: "अलीकडील कृती",
    notifications: "उल्लंघन सूचना",
    language: "भाषा",
    logSegregation: "वर्गीकरण नोंदवा (+10)",
    appeal: "उल्लंघनावर अपील करा",
  },
} as const;

export type LanguageKey = keyof typeof LABELS;
export type Labels = (typeof LABELS)[LanguageKey];
export type ViolationType = (typeof VIOLATION_TYPES)[number]["key"];
