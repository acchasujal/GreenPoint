import { Landmark, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { LABELS, type LanguageKey } from "./constants";

type HeaderBarProps = {
  language: LanguageKey;
  onLanguageChange: (language: LanguageKey) => void;
};

export function HeaderBar({ language, onLanguageChange }: HeaderBarProps) {
  return (
    <header className="border-b border-blue-900/30 bg-[#1E3A8A] text-white shadow-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/12 p-3 backdrop-blur">
            <Landmark className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue-100">
              Brihanmumbai Municipal Corporation
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">GreenPoint Mumbai</h1>
            <p className="mt-1 text-sm text-blue-100">
              Unified reward and penalty ledger for civic waste compliance
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav className="flex items-center rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur">
            <NavLink
              to="/citizen"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-white text-[#1E3A8A]" : "text-white hover:bg-white/10"
                }`
              }
            >
              {LABELS[language].citizen}
            </NavLink>
            <NavLink
              to="/collector"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-white text-[#1E3A8A]" : "text-white hover:bg-white/10"
                }`
              }
            >
              {LABELS[language].collector}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-50">
              <ShieldCheck className="h-4 w-4" />
              Live BMC prototype
            </span>
            <div className="rounded-full bg-white/12 p-1">
              {(Object.keys(LABELS) as LanguageKey[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    language === lang ? "bg-white text-[#1E3A8A]" : "text-white hover:bg-white/10"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
