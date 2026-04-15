import { BellRing, Coins, ShieldCheck } from "lucide-react";
import type { User } from "../types";

type LiveSnapshotProps = {
  user: User | null;
  selectedUserId: string;
};

export function LiveSnapshot({ user, selectedUserId }: LiveSnapshotProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-[#1E3A8A]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1E3A8A]">Live Compliance Snapshot</h3>
          <p className="text-sm text-slate-500">Real-time citizen ledger summary</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <p className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-slate-600">
            <Coins className="h-4 w-4 text-emerald-600" />
            Wallet Balance
          </span>
          <strong className="text-[#1E3A8A]">{user?.points ?? 0}</strong>
        </p>
        <p className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-slate-600">
            <BellRing className="h-4 w-4 text-red-500" />
            Violations
          </span>
          <strong className="text-slate-900">{user?.violation_count ?? 0}</strong>
        </p>
        <p className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-slate-600">Current User</span>
          <strong className="text-slate-900">{selectedUserId}</strong>
        </p>
      </div>
    </article>
  );
}
