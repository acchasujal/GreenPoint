import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "./api";
import { CitizenView } from "./components/CitizenView";
import {
  BMC_BLUE,
  DEFAULT_USER,
  GREEN,
  LABELS,
  type LanguageKey,
  type ViolationType,
} from "./components/constants";
import { CollectorView } from "./components/CollectorView";
import { HeaderBar } from "./components/HeaderBar";
import { LiveSnapshot } from "./components/LiveSnapshot";
import { ViolationAlertModal } from "./components/ViolationAlertModal";
import type { LedgerEvent, Notification, User } from "./types";

export default function DashboardApp() {
  const location = useLocation();

  const [activeView, setActiveView] = useState<"citizen" | "collector">("citizen");
  const [selectedUserId, setSelectedUserId] = useState(DEFAULT_USER);
  const [collectorId, setCollectorId] = useState("BMC-OFCR-27");
  const [geoTag, setGeoTag] = useState("Chembur");
  const [language, setLanguage] = useState<LanguageKey>("EN");
  const [selectedViolationType, setSelectedViolationType] =
    useState<ViolationType>("Non-segregation");
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<Notification | null>(null);

  const labels = LABELS[language];

  const latestUnacknowledgedTierOne = useMemo(
    () =>
      notifications.find(
        (item) => item.tier === 1 && item.english && item.acknowledged_at === null,
      ) ?? null,
    [notifications],
  );

  const recentActivity = useMemo(
    () => ledger.filter((item) => item.event_type !== "notification_ack").slice(0, 8),
    [ledger],
  );

  const loadAllData = async (userId: string) => {
    setError("");
    try {
      const [userRes, usersRes, notifRes, ledgerRes] = await Promise.all([
        api.getUser(userId),
        api.getUsers(),
        api.getNotifications(userId),
        api.getLedger(userId),
      ]);
      setUser(userRes);
      setUsers(usersRes);
      setNotifications(notifRes);
      setLedger(ledgerRes);
    } catch (err) {
      setError("Unable to load GreenPoint data. Please check that FastAPI is running on http://127.0.0.1:8000.");
      console.error(err);
    }
  };

  const pollCitizen = async () => {
    try {
      const [userRes, notifRes, ledgerRes] = await Promise.all([
        api.getUser(selectedUserId),
        api.getNotifications(selectedUserId),
        api.getLedger(selectedUserId),
      ]);
      setUser(userRes);
      setNotifications(notifRes);
      setLedger(ledgerRes);
    } catch (err) {
      console.error("Citizen polling failed", err);
    }
  };

  useEffect(() => {
    setActiveView(location.pathname === "/collector" ? "collector" : "citizen");
  }, [location.pathname]);

  useEffect(() => {
    void loadAllData(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (activeView !== "citizen") return;
    const timer = setInterval(() => {
      void pollCitizen();
    }, 3000);
    return () => clearInterval(timer);
  }, [activeView, selectedUserId]);

  useEffect(() => {
    if (activeView !== "citizen") return;
    if (!latestUnacknowledgedTierOne) return;
    setActiveAlert((current) => current ?? latestUnacknowledgedTierOne);
  }, [activeView, latestUnacknowledgedTierOne]);

  const onReward = async () => {
    setLoading(true);
    try {
      await api.reward(selectedUserId);
      await loadAllData(selectedUserId);
    } catch (err) {
      setError("Unable to reward right now. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onFlagViolation = async () => {
    setLoading(true);
    try {
      await api.violate({
        userId: selectedUserId,
        collectorId,
        violationType: selectedViolationType,
        geoTag,
      });
      await loadAllData(selectedUserId);
    } catch (err) {
      setError("Unable to flag violation right now. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onAcknowledgeAlert = async () => {
    if (!activeAlert) return;
    setLoading(true);
    try {
      await api.acknowledgeNotification(activeAlert.id, selectedUserId);
      setActiveAlert(null);
      await loadAllData(selectedUserId);
    } catch (err) {
      setError("Unable to acknowledge alert right now. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <HeaderBar language={language} onLanguageChange={setLanguage} />

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1.55fr_0.7fr]">
        <section className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1E3A8A]">
                  Active View
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {activeView === "citizen" ? "Citizen Dashboard" : "Collector Console"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Connected to FastAPI at <span className="font-semibold">http://127.0.0.1:8000</span>
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                Selected citizen: {selectedUserId}
              </div>
            </div>
          </div>

          {activeView === "citizen" ? (
            <CitizenView
              user={user}
              selectedUserId={selectedUserId}
              labels={labels}
              language={language}
              recentActivity={recentActivity}
              notifications={notifications}
              loading={loading}
              onReward={onReward}
              onAppeal={() =>
                setError("Appeal submitted (demo). BMC officer review window: within 48 hours.")
              }
            />
          ) : (
            <CollectorView
              users={users}
              selectedUserId={selectedUserId}
              collectorId={collectorId}
              geoTag={geoTag}
              selectedViolationType={selectedViolationType}
              ledger={ledger}
              loading={loading}
              onUserChange={setSelectedUserId}
              onCollectorIdChange={setCollectorId}
              onGeoTagChange={setGeoTag}
              onViolationTypeChange={setSelectedViolationType}
              onFlagViolation={onFlagViolation}
              defaultUser={DEFAULT_USER}
            />
          )}
        </section>

        <aside className="space-y-5">
          <LiveSnapshot user={user} selectedUserId={selectedUserId} />
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1E3A8A]">
              Reward-Penalty Logic
            </p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p className="rounded-2xl bg-slate-50 px-4 py-3">
                Daily segregation reward: <span className="font-bold text-emerald-600">+10 points</span>
              </p>
              <p className="rounded-2xl bg-slate-50 px-4 py-3">
                1st offense: <span className="font-bold text-red-600">warning + 20-point deduction</span>
              </p>
              <p className="rounded-2xl bg-slate-50 px-4 py-3">
                2nd offense: <span className="font-bold text-red-600">50-point deduction</span> and
                society notification
              </p>
              <p className="rounded-2xl bg-slate-50 px-4 py-3">
                3rd offense: <span className="font-bold text-red-600">INR 200 BMC fine</span>
              </p>
            </div>
          </article>
        </aside>
      </main>

      <ViolationAlertModal
        activeAlert={activeAlert}
        loading={loading}
        onAcknowledge={onAcknowledgeAlert}
      />

      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-[0_14px_40px_rgba(220,38,38,0.18)]">
          {error}
        </div>
      )}
    </div>
  );
}

document.documentElement.style.setProperty("--bmc-blue", BMC_BLUE);
document.documentElement.style.setProperty("--bmc-green", GREEN);
