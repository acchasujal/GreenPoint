import { MapPin, ShieldAlert, UserRound } from "lucide-react";
import type { LedgerEvent, User } from "../types";
import { VIOLATION_TYPES, type ViolationType } from "./constants";
import { extractLocation, formatDate } from "./utils";

type CollectorViewProps = {
  users: User[];
  selectedUserId: string;
  collectorId: string;
  geoTag: string;
  selectedViolationType: ViolationType;
  ledger: LedgerEvent[];
  loading: boolean;
  onUserChange: (value: string) => void;
  onCollectorIdChange: (value: string) => void;
  onGeoTagChange: (value: string) => void;
  onViolationTypeChange: (value: ViolationType) => void;
  onFlagViolation: () => Promise<void>;
  defaultUser: string;
};

export function CollectorView({
  users,
  selectedUserId,
  collectorId,
  geoTag,
  selectedViolationType,
  ledger,
  loading,
  onUserChange,
  onCollectorIdChange,
  onGeoTagChange,
  onViolationTypeChange,
  onFlagViolation,
  defaultUser,
}: CollectorViewProps) {
  return (
    <section className="space-y-5">
      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1E3A8A]">
            Collector Workflow
          </p>
          <h2 className="text-2xl font-black text-slate-900">Compliance Console</h2>
          <p className="text-sm text-slate-600">
            Timestamped, geo-tagged, collector-linked enforcement actions for the 30-day rolling
            violation model.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-semibold text-slate-600">
              <UserRound className="h-4 w-4" />
              Citizen
            </span>
            <select
              value={selectedUserId}
              onChange={(e) => onUserChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
            >
              {users.length === 0 && <option value={defaultUser}>{defaultUser}</option>}
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-semibold text-slate-600">
              <ShieldAlert className="h-4 w-4" />
              Collector ID
            </span>
            <input
              value={collectorId}
              onChange={(e) => onCollectorIdChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
            />
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1.5 flex items-center gap-2 font-semibold text-slate-600">
              <MapPin className="h-4 w-4" />
              Geo-tagged Location
            </span>
            <select
              value={geoTag}
              onChange={(e) => onGeoTagChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1E3A8A] focus:bg-white"
            >
              <option value="Chembur">Chembur</option>
              <option value="Vidyavihar">Vidyavihar</option>
              <option value="BMC Ward G-South">BMC Ward G-South</option>
            </select>
          </label>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">Violation Actions</h3>
            <p className="text-sm text-slate-600">
              Select the observed violation type and apply the graduated enforcement rule.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {VIOLATION_TYPES.map((card) => {
            const Icon = card.icon;
            const selected = selectedViolationType === card.key;
            return (
              <button
                key={card.key}
                onClick={() => onViolationTypeChange(card.key)}
                className={`rounded-3xl border px-4 py-5 text-left transition ${card.tone} ${
                  selected ? "ring-2 ring-[#1E3A8A] ring-offset-2" : ""
                }`}
              >
                <Icon className="mb-3 h-6 w-6" />
                <p className="text-base font-bold">{card.key}</p>
              </button>
            );
          })}
        </div>

        <button
          disabled={loading}
          onClick={() => void onFlagViolation()}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-red-700 bg-red-600 px-4 py-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(220,38,38,0.25)] transition hover:bg-red-700 disabled:opacity-60"
        >
          Flag Violation
        </button>
      </article>

      <footer className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#1E3A8A]">
          Audit Log
        </h4>
        <div className="space-y-3 text-sm">
          {ledger.slice(0, 5).map((event) => (
            <div key={event.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
              <p className="font-semibold text-slate-900">
                {event.user_id} | {event.violation_type || "Reward event"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(event.created_at)} | Collector: {event.collector_id} | Location:{" "}
                {extractLocation(event.geo_tag)}
              </p>
            </div>
          ))}
          {ledger.length === 0 && (
            <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No audit activity recorded yet.
            </p>
          )}
        </div>
      </footer>
    </section>
  );
}
