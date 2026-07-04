import { type ExperienceMode, useAppStore } from "@/store/appStore";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useLocation } from "@tanstack/react-router";

/**
 * Top navigation.
 *
 * Apple-inspired minimal bar: app name on the left, current section label in
 * the center, experience mode selector + account identity indicator on the
 * right. Nav tabs live in the sidebar. Pure monochrome tokens, hairline
 * border, subtle shadow. The mode selector drives progressive disclosure
 * across pages and persists via the Zustand store.
 */

const SECTION_LABELS: Record<string, string> = {
  "/overview": "Overview",
  "/dashboard": "Dashboard",
  "/predictions": "Predictions",
  "/terminal": "Terminal",
  "/indian-market": "Indian Market",
  "/arbitrage": "Arbitrage",
  "/practice-arena": "Practice Arena",
  "/backtest": "Backtest",
  "/risk": "Risk",
  "/dollar-program": "$1 Program",
};

const MODES: { value: ExperienceMode; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "optional", label: "Optional" },
];

function shortPrincipal(principal: string): string {
  if (!principal || principal.length < 12) return principal;
  return `${principal.slice(0, 6)}…${principal.slice(-4)}`;
}

function ModeSelector() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);

  return (
    <fieldset
      aria-label="Experience mode"
      className="flex items-center rounded-full bg-muted/60 border border-border p-0.5"
      data-ocid="nav.mode_selector"
    >
      {MODES.map((m) => {
        const active = mode === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            aria-pressed={active}
            data-ocid={`nav.mode.${m.value}`}
            className={[
              "px-2.5 h-7 rounded-full text-[11px] font-medium tracking-tight",
              "transition-smooth focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
              active
                ? "bg-primary text-primary-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {m.label}
          </button>
        );
      })}
    </fieldset>
  );
}

export function TopNav() {
  const location = useLocation();
  const { identity } = useInternetIdentity();

  const sectionLabel = SECTION_LABELS[location.pathname] ?? "Overview";
  const principal = identity?.getPrincipal().toString();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-card border-b border-border shadow-subtle"
      data-ocid="top_nav"
    >
      {/* App name */}
      <Link
        to="/overview"
        className="flex items-center gap-2 transition-smooth rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        data-ocid="nav.logo_link"
      >
        <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-[11px] font-semibold tracking-tight">
            A
          </span>
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Aegis Quantum
        </span>
      </Link>

      {/* Current section label — centered */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span
          className="text-[13px] font-medium text-muted-foreground tracking-tight"
          data-ocid="nav.section_label"
        >
          {sectionLabel}
        </span>
      </div>

      {/* Right cluster: mode selector + account identity indicator */}
      <div className="flex items-center gap-4">
        <ModeSelector />
        <div
          className="flex items-center gap-2"
          data-ocid="nav.account_indicator"
        >
          <span
            className="w-2 h-2 rounded-full bg-foreground/70"
            aria-hidden="true"
          />
          <span
            className="text-[12px] font-mono text-muted-foreground tracking-tight"
            title={principal}
          >
            {principal ? shortPrincipal(principal) : "—"}
          </span>
        </div>
      </div>
    </header>
  );
}
