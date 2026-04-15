import { Building2, Trophy } from "lucide-react";
import type { LeaderboardData } from "../types";

type CommunityHubProps = {
  leaderboard: LeaderboardData | null;
};

export function CommunityHub({ leaderboard }: CommunityHubProps) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="glass-card rounded-[28px] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50/80 p-3 text-[#1E3A8A] backdrop-blur-sm">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E3A8A]">
              Community
            </p>
            <h3 className="text-lg font-black text-slate-950">Ward Standings</h3>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-white/80 bg-white/65 backdrop-blur-sm">
          <div className="grid grid-cols-[0.6fr_1.5fr_1fr] border-b border-slate-200/70 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            <span>Rank</span>
            <span>Ward</span>
            <span className="text-right">Points</span>
          </div>
          {leaderboard?.standings.map((standing) => (
            <div
              key={standing.ward}
              className="grid grid-cols-[0.6fr_1.5fr_1fr] items-center px-4 py-4 text-sm text-slate-700 not-last:border-b not-last:border-slate-100/80"
            >
              <span className="text-base font-black text-[#1E3A8A]">#{standing.rank}</span>
              <span className="font-semibold text-slate-900">{standing.ward}</span>
              <span className="text-right font-black text-emerald-600">
                {standing.points.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-card rounded-[28px] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50/80 p-3 text-[#10B981] backdrop-blur-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E3A8A]">
              My Society
            </p>
            <h3 className="text-lg font-black text-slate-950">
              {leaderboard?.my_society.society_name ?? "Green Heights"}
            </h3>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-3xl bg-white/65 px-4 py-4 backdrop-blur-sm">
            <p className="text-sm text-slate-500">Building Rank</p>
            <p className="mt-1 text-3xl font-black text-[#1E3A8A]">
              #{leaderboard?.my_society.rank ?? 2}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              out of {leaderboard?.my_society.total_societies ?? 11} societies in{" "}
              {leaderboard?.my_society.ward ?? "Chembur"}
            </p>
          </div>
          <p className="rounded-2xl bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
            Community rankings help reinforce ward-level participation and local accountability.
          </p>
        </div>
      </article>
    </section>
  );
}
