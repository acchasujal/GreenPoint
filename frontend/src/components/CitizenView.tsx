import { ArrowUpRight, History, ShieldAlert, Trash2, Wallet } from "lucide-react";
import type { LedgerEvent, Notification, User } from "../types";
import type { Labels, LanguageKey } from "./constants";
import { formatDate, formatDelta } from "./utils";

type CitizenViewProps = {
  user: User | null;
  selectedUserId: string;
  labels: Labels;
  language: LanguageKey;
  recentActivity: LedgerEvent[];
  notifications: Notification[];
  loading: boolean;
  onReward: () => Promise<void>;
  onAppeal: () => void;
};

export function CitizenView({
  user,
  selectedUserId,
  labels,
  language,
  recentActivity,
  notifications,
  loading,
  onReward,
  onAppeal,
}: CitizenViewProps) {
  const latestViolation = notifications.find((note) => note.tier >= 1);
  const canAppeal =
    !!latestViolation &&
    Date.now() - new Date(latestViolation.created_at).getTime() <= 48 * 60 * 60 * 1000;

  return (
    <div className="space-y-5">
      <article className="overflow-hidden rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-[#10B981] via-[#34D399] to-[#059669] p-6 text-white shadow-[0_24px_60px_rgba(16,185,129,0.28)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-50/90">
              {labels.wallet}
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Citizen Rewards Wallet
            </h2>
            <p className="text-sm text-emerald-50/90">
              Live balance updates reflect the reward and penalty ledger immediately after
              collection events.
            </p>
            <p className="text-xs font-medium text-emerald-50/85">User ID: {selectedUserId}</p>
          </div>

          <div className="mx-auto w-full max-w-sm rounded-[30px] bg-white px-8 py-10 text-center text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-[#10B981]">
              <Wallet className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.32em] text-slate-500">
              {labels.points}
            </p>
            <p className="mt-2 text-6xl font-black tracking-tight text-[#1E3A8A]">
              {user?.points ?? 0}
            </p>
            <p className="mt-3 text-sm text-slate-500">Minimum redemption threshold: 100 points</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
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
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1E3A8A]">
              <History className="h-5 w-5" />
              {labels.activity}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {labels.language}: {language}
            </span>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.event_type === "reward" ? "Segregation Reward" : "Violation Penalty"}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                </div>
                <p
                  className={`text-base font-black ${
                    item.points_delta >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {formatDelta(item.points_delta)}
                </p>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No reward or penalty activity has been recorded yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
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
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-slate-50"
                }`}
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
              <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No violation alerts have been issued for this account.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
