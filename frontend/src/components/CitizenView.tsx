import {
  ArrowUpRight,
  History,
  type LucideIcon,
  Mountain,
  ShieldAlert,
  Trash2,
  TreePine,
  Wallet,
} from "lucide-react";
import type { LedgerEvent, Notification, User } from "../types";
import type { Labels, LanguageKey } from "./constants";
import { extractLocation, formatDate, formatDelta } from "./utils";

type CitizenViewProps = {
  user: User | null;
  selectedUserId: string;
  labels: Labels;
  language: LanguageKey;
  recentActivity: LedgerEvent[];
  notifications: Notification[];
  loading: boolean;
  rewardCelebrating: boolean;
  onReward: () => Promise<void>;
  onAppeal: () => void;
};

function ImpactBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-emerald-50/80 px-4 py-3 text-slate-900 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-emerald-700">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-black text-[#1E3A8A]">{value}</p>
    </div>
  );
}

export function CitizenView({
  user,
  selectedUserId,
  labels,
  language,
  recentActivity,
  notifications,
  loading,
  rewardCelebrating,
  onReward,
  onAppeal,
}: CitizenViewProps) {
  const latestViolation = notifications.find((note) => note.tier >= 1);
  const canAppeal =
    !!latestViolation &&
    Date.now() - new Date(latestViolation.created_at).getTime() <= 48 * 60 * 60 * 1000;

  const points = user?.points ?? 0;
  const landfillSaved = user?.landfill_saved_kg ?? points * 0.5;
  const co2Saved = points * 0.2;
  const redemptionProgress = Math.min((points / 100) * 100, 100);

  return (
    <div className="space-y-5">
      <article className="relative overflow-hidden rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-[#10B981] via-[#34D399] to-[#059669] p-6 text-white shadow-[0_24px_60px_rgba(16,185,129,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.14),transparent_45%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-50/90">
              {labels.wallet}
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Citizen Rewards Wallet
            </h2>
            <p className="text-sm text-emerald-50/90">
              Live balance updates reflect the reward, quiz, and penalty ledger immediately after
              each civic action.
            </p>
            <p className="text-xs font-medium text-emerald-50/85">User ID: {selectedUserId}</p>
          </div>

          <div
            className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-[30px] border border-white/70 bg-white/88 px-8 py-10 text-center text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl ${
              rewardCelebrating ? "wallet-celebrate" : ""
            }`}
          >
            {rewardCelebrating && (
              <div className="pointer-events-none absolute inset-0">
                <span className="confetti-piece left-[10%] top-[14%]" />
                <span className="confetti-piece delay-1 left-[25%] top-[8%]" />
                <span className="confetti-piece delay-2 left-[42%] top-[12%]" />
                <span className="confetti-piece delay-3 left-[62%] top-[10%]" />
                <span className="confetti-piece delay-4 left-[78%] top-[16%]" />
              </div>
            )}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-[#10B981] shadow-inner">
              <Wallet className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">
              {labels.points}
            </p>
            <p className="mt-2 text-6xl font-black tracking-tight text-[#1E3A8A]">{points}</p>
            <p className="mt-3 text-sm text-slate-500">Minimum redemption threshold: 100 points</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Redemption Progress</span>
                <span>₹20 Goal</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] transition-[width] duration-700 ease-out"
                  style={{ width: `${redemptionProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {Math.round(redemptionProgress)}% toward redemption
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ImpactBadge
                icon={TreePine}
                label="Landfill Diverted"
                value={`${landfillSaved.toFixed(1)} kg`}
              />
              <ImpactBadge
                icon={Mountain}
                label="CO2 Saved"
                value={`${co2Saved.toFixed(1)} kg`}
              />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">
              Verified by BMC-SWM Audit Logs
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 md:grid-cols-2">
          <button
            disabled={loading}
            onClick={() => void onReward()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#1E3A8A] transition hover:bg-emerald-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {labels.logSegregation}
          </button>
          <button
            onClick={onAppeal}
            disabled={!canAppeal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            {labels.appeal} (48-hour window)
          </button>
        </div>
      </article>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-card rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1E3A8A]">
              <History className="h-5 w-5" />
              {labels.activity}
            </h2>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500 backdrop-blur-sm">
              {labels.language}: {language}
            </span>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/70 bg-white/65 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.event_type === "reward"
                        ? "Segregation Reward"
                        : item.event_type === "quiz_reward"
                          ? "Waste Wizard Reward"
                          : "Violation Penalty"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                  <p
                    className={`text-base font-black ${
                      item.points_delta >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatDelta(item.points_delta)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Collector: {item.collector_id} | Location: {extractLocation(item.location)} |
                  Status: Verified
                </p>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="rounded-2xl bg-white/60 px-4 py-5 text-sm text-slate-500 backdrop-blur-sm">
                No reward or penalty activity has been recorded yet.
              </p>
            )}
          </div>
        </article>

        <article className="glass-card rounded-[28px] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1E3A8A]">
            <ShieldAlert className="h-5 w-5" />
            {labels.notifications}
          </h2>
          <div className="space-y-3">
            {notifications.slice(0, 4).map((note) => (
              <div
                key={note.id}
                className={`rounded-2xl border px-4 py-3 ${
                  note.tier === 1
                    ? "border-red-200 bg-red-50/88"
                    : "border-white/70 bg-white/65"
                } backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-800">Tier {note.tier} Alert</p>
                  <span className="text-[11px] font-medium text-slate-500">
                    {note.acknowledged_at ? "Acknowledged" : "Pending"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{note.message}</p>
                <p className="mt-2 text-[11px] text-slate-500">{formatDate(note.created_at)}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="rounded-2xl bg-white/60 px-4 py-5 text-sm text-slate-500 backdrop-blur-sm">
                No violation alerts have been issued for this account.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
