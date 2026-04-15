import { Sparkles, Wand2 } from "lucide-react";
import type { QuizState } from "../types";

type WasteWizardCardProps = {
  quiz: QuizState | null;
  loading: boolean;
  quizCelebrating: boolean;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => Promise<void>;
};

export function WasteWizardCard({
  quiz,
  loading,
  quizCelebrating,
  selectedAnswer,
  onSelectAnswer,
  onSubmit,
}: WasteWizardCardProps) {
  return (
    <article className="glass-card relative overflow-hidden rounded-[28px] p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%)]" />
      <div className="relative flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50/90 p-3 text-[#10B981] backdrop-blur-sm">
          <Wand2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E3A8A]">
            Waste Wizard
          </p>
          <h3 className="text-lg font-black text-slate-950">Daily Civic Quiz</h3>
        </div>
      </div>

      {quiz?.available ? (
        <div className="mt-4">
          <p className="text-base font-semibold text-slate-900">{quiz.question}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {quiz.options.map((option) => (
              <button
                key={option}
                onClick={() => onSelectAnswer(option)}
                className={`rounded-3xl border px-4 py-4 text-sm font-semibold transition ${
                  selectedAnswer === option
                    ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]"
                    : "border-white/70 bg-white/70 text-slate-700 hover:bg-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            disabled={!selectedAnswer || loading}
            onClick={() => void onSubmit()}
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition ${
              quizCelebrating ? "bg-emerald-500" : "bg-[#1E3A8A] hover:bg-blue-900"
            } disabled:opacity-50`}
          >
            {quizCelebrating ? <Sparkles className="h-4 w-4" /> : null}
            {quizCelebrating ? "+5 GreenPoints Awarded" : "Submit Answer"}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl bg-white/65 px-4 py-5 text-sm text-slate-600 backdrop-blur-sm">
          Today’s Waste Wizard reward has already been claimed. Come back tomorrow for the next
          civic knowledge question.
        </div>
      )}
    </article>
  );
}
