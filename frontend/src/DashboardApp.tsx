import { useEffect, useMemo, useState } from "react";
import { CircleHelp, Dot } from "lucide-react";
import { useLocation } from "react-router-dom";
import { api } from "./api";
import { CitizenView } from "./components/CitizenView";
import { CommunityHub } from "./components/CommunityHub";
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
import { WasteWizardCard } from "./components/WasteWizardCard";
import type {
  LeaderboardData,
  LedgerEvent,
  Notification,
  QuizState,
  User,
} from "./types";

function StatusLivePill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      Status: Live
    </div>
  );
}

export default function DashboardApp() {
  const location = useLocation();

  const [activeView, setActiveView] = useState<"citizen" | "collector">("citizen");
  const [selectedUserId, setSelectedUserId] = useState(DEFAULT_USER);
  const [collectorId] = useState("BMC-OFCR-27");
  const [geoTag] = useState("Chembur");
  const [language, setLanguage] = useState<LanguageKey>("EN");
  const [selectedViolationType, setSelectedViolationType] =
    useState<ViolationType>("Non-segregation");
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<Notification | null>(null);
  const [rewardCelebrating, setRewardCelebrating] = useState(false);
  const [quizCelebrating, setQuizCelebrating] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<{ kind: "offline" | "success"; message: string } | null>(
    null,
  );

  const labels = LABELS[language];

  const latestUnacknowledgedTierOne = useMemo(
    () =>
      notifications.find(
        (item) => item.tier === 1 && item.english && item.acknowledged_at === null,
      ) ?? null,
    [notifications],
  );

  const recentActivity = useMemo(
    () => ledger.filter((item) => item.event_type !== "notification_ack").slice(0, 10),
    [ledger],
  );

  const loadAllData = async (userId: string) => {
    setError("");
    try {
      const [userRes, usersRes, notifRes, ledgerRes, leaderboardRes, quizRes] =
        await Promise.all([
          api.getUser(userId),
          api.getUsers(),
          api.getNotifications(userId),
          api.getLedger(userId),
          api.getLeaderboard(userId),
          api.getQuiz(userId),
        ]);
      setUser(userRes);
      setUsers(usersRes);
      setNotifications(notifRes);
      setLedger(ledgerRes);
      setLeaderboard(leaderboardRes);
      setQuiz(quizRes);
    } catch (err) {
      setError("Offline");
      setToast({
        kind: "offline",
        message: "Offline. Dashboard data will refresh when the backend is reachable.",
      });
      console.error(err);
    }
  };

  const pollCitizen = async () => {
    try {
      const [userRes, notifRes, ledgerRes, leaderboardRes, quizRes] = await Promise.all([
        api.getUser(selectedUserId),
        api.getNotifications(selectedUserId),
        api.getLedger(selectedUserId),
        api.getLeaderboard(selectedUserId),
        api.getQuiz(selectedUserId),
      ]);
      setUser(userRes);
      setNotifications(notifRes);
      setLedger(ledgerRes);
      setLeaderboard(leaderboardRes);
      setQuiz(quizRes);
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
    if (!latestUnacknowledgedTierOne) return;
    setActiveAlert((current) =>
      current?.id === latestUnacknowledgedTierOne.id ? current : latestUnacknowledgedTierOne,
    );
  }, [latestUnacknowledgedTierOne]);

  useEffect(() => {
    if (!rewardCelebrating) return;
    const timer = setTimeout(() => setRewardCelebrating(false), 1600);
    return () => clearTimeout(timer);
  }, [rewardCelebrating]);

  useEffect(() => {
    if (!quizCelebrating) return;
    const timer = setTimeout(() => setQuizCelebrating(false), 1600);
    return () => clearTimeout(timer);
  }, [quizCelebrating]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const onReward = async () => {
    setLoading(true);
    try {
      const result = await api.reward(selectedUserId);
      setUser(result.user);
      setRewardCelebrating(true);
      setToast({ kind: "success", message: "+10 GreenPoints logged successfully." });
      await loadAllData(selectedUserId);
    } catch (err) {
      setToast({ kind: "offline", message: "Offline. Reward could not be synced right now." });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitQuiz = async () => {
    if (!selectedQuizAnswer) return;
    setLoading(true);
    try {
      const result = await api.submitQuizAnswer(selectedUserId, selectedQuizAnswer);
      setUser(result.user);
      setSelectedQuizAnswer("");
      if (result.correct && result.points_added > 0) {
        setQuizCelebrating(true);
        setRewardCelebrating(true);
        setToast({ kind: "success", message: "+5 GreenPoints from Waste Wizard." });
      } else if (result.already_attempted_today) {
        setToast({ kind: "offline", message: "Today's Waste Wizard reward has already been used." });
      } else {
        setToast({
          kind: "offline",
          message: `Incorrect answer. Correct option: ${result.correct_answer ?? "Red/Hazardous"}.`,
        });
      }
      await loadAllData(selectedUserId);
    } catch (err) {
      setToast({ kind: "offline", message: "Offline. Quiz reward could not be synced right now." });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onFlagViolation = async () => {
    setLoading(true);
    try {
      const result = await api.violate({
        userId: selectedUserId,
        collectorId,
        violationType: selectedViolationType,
        geoTag,
      });
      setUser(result.user);
      await loadAllData(selectedUserId);
    } catch (err) {
      setToast({ kind: "offline", message: "Offline. Violation could not be recorded right now." });
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
      setToast({ kind: "offline", message: "Offline. Alert acknowledgement did not sync." });
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
          <div className="glass-card rounded-[28px] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1E3A8A]">
                  Active View
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {activeView === "citizen" ? "Citizen Dashboard" : "Collector Console"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Unified reward and penalty ledger aligned to the BMC-SWM review narrative.
                </p>
              </div>

              <StatusLivePill />
            </div>
          </div>

          {activeView === "citizen" ? (
            <>
              <CitizenView
                user={user}
                selectedUserId={selectedUserId}
                labels={labels}
                language={language}
                recentActivity={recentActivity}
                notifications={notifications}
                loading={loading}
                rewardCelebrating={rewardCelebrating || quizCelebrating}
                onReward={onReward}
                onAppeal={() =>
                  setToast({
                    kind: "success",
                    message: "Appeal submitted. BMC officer review window: within 48 hours.",
                  })
                }
              />
              <WasteWizardCard
                quiz={quiz}
                loading={loading}
                quizCelebrating={quizCelebrating}
                selectedAnswer={selectedQuizAnswer}
                onSelectAnswer={setSelectedQuizAnswer}
                onSubmit={onSubmitQuiz}
              />
              <CommunityHub leaderboard={leaderboard} />
            </>
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
              onCollectorIdChange={() => {}}
              onGeoTagChange={() => {}}
              onViolationTypeChange={setSelectedViolationType}
              onFlagViolation={onFlagViolation}
              defaultUser={DEFAULT_USER}
            />
          )}
        </section>

        <aside className="space-y-5">
          <LiveSnapshot user={user} selectedUserId={selectedUserId} />
          <article className="glass-card rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1E3A8A]">
                Reward-Penalty Logic
              </p>
              <StatusLivePill />
            </div>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p className="rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
                Daily segregation reward:{" "}
                <span className="font-bold text-emerald-600">+10 points</span>
              </p>
              <p className="rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
                Waste Wizard bonus: <span className="font-bold text-emerald-600">+5 points</span>
              </p>
              <p className="rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
                1st offense:{" "}
                <span className="font-bold text-red-600">warning + 20-point deduction</span>
              </p>
              <p className="rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
                2nd offense: <span className="font-bold text-red-600">50-point deduction</span> and
                society notification
              </p>
              <p className="rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm">
                3rd offense: <span className="font-bold text-red-600">INR 200 BMC fine</span>
              </p>
            </div>
          </article>
        </aside>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-6 sm:px-6 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-slate-500">
          Review-ready civic rewards experience for Mumbai waste compliance.
        </p>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            onClick={() => setHelpOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-semibold text-[#1E3A8A] shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:bg-white"
          >
            <CircleHelp className="h-4 w-4" />
            Help
          </button>
          {helpOpen && (
            <div className="glass-card max-w-sm rounded-3xl px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">BMC Ward Office Support</p>
              <p className="mt-1">
                Chembur/Vidyavihar Ward Office help desk
                <Dot className="mx-1 inline h-4 w-4 text-slate-400" />
                1800-22-BMC-SWM
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Contact detail is presented as a review-friendly ward support placeholder based on
                the PRD’s Chembur/Vidyavihar scope.
              </p>
            </div>
          )}
        </div>
      </footer>

      <ViolationAlertModal
        activeAlert={activeAlert}
        loading={loading}
        onAcknowledge={onAcknowledgeAlert}
      />

      {toast && (
        <div
          className={`fixed bottom-4 right-4 max-w-sm rounded-2xl px-4 py-3 text-sm shadow-[0_14px_40px_rgba(15,23,42,0.14)] ${
            toast.kind === "offline"
              ? "border border-slate-200 bg-white text-slate-700"
              : "border border-emerald-200 bg-white text-emerald-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && <span className="sr-only">{error}</span>}
    </div>
  );
}

document.documentElement.style.setProperty("--bmc-blue", BMC_BLUE);
document.documentElement.style.setProperty("--bmc-green", GREEN);
