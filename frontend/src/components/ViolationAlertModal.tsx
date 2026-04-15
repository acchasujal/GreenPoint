import { ShieldAlert } from "lucide-react";
import type { Notification } from "../types";
import { WARNING_COPY } from "./constants";

type ViolationAlertModalProps = {
  activeAlert: Notification | null;
  loading: boolean;
  onAcknowledge: () => Promise<void>;
};

export function ViolationAlertModal({
  activeAlert,
  loading,
  onAcknowledge,
}: ViolationAlertModalProps) {
  if (!activeAlert) return null;

  const english = activeAlert.english || WARNING_COPY.english;
  const hindi = activeAlert.hindi || WARNING_COPY.hindi;
  const marathi = activeAlert.marathi || WARNING_COPY.marathi;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border-4 border-red-600 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-100 p-3 text-red-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600">
              High Priority
            </p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">Violation Alert</h3>
            <p className="mt-2 text-sm text-slate-600">
              The PRD-required warning is displayed below in English, Hindi, and Marathi.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">English</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{english}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Hindi</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{hindi}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Marathi</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{marathi}</p>
          </div>
        </div>

        <button
          disabled={loading}
          onClick={() => void onAcknowledge()}
          className="mt-6 w-full rounded-2xl bg-[#1E3A8A] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-60"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
