import { ActiveModules } from "@/components/dashboard/ActiveModules";
import { CriticalLogFeed } from "@/components/dashboard/CriticalLogFeed";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { OrderBook } from "@/components/dashboard/OrderBook";
import { PositionsTable } from "@/components/dashboard/PositionsTable";
import { SystemHeatmap } from "@/components/dashboard/SystemHeatmap";
import { type ExperienceMode, useAppStore } from "@/store/appStore";
import { useEffect, useState } from "react";

function useLivePnL() {
  const [sessionPnL, setSessionPnL] = useState(42890.12);
  const [dailyPnL, setDailyPnL] = useState(12842.1);
  const [unrealized, setUnrealized] = useState(429102.55);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionPnL((v) => v + (Math.random() - 0.4) * 120);
      setDailyPnL((v) => v + (Math.random() - 0.4) * 80);
      setUnrealized((v) => v + (Math.random() - 0.45) * 450);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return { sessionPnL, dailyPnL, unrealized };
}

function fmt(n: number, prefix = "$") {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${prefix}${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Per-mode label sets. Beginner uses plain-language phrasing; Intermediate
 * keeps professional labels but trims jargon; Advanced/Optional use the
 * full institutional vocabulary.
 */
const LABELS: Record<
  ExperienceMode,
  {
    session: string;
    daily: string;
    unrealized: string;
    subtitle: string;
    title: string;
  }
> = {
  beginner: {
    title: "Your Trading Dashboard",
    subtitle: "A simple view of how your trading is doing right now.",
    session: "How much you've earned today",
    daily: "Today's change",
    unrealized: "Open trades value",
  },
  intermediate: {
    title: "Dashboard",
    subtitle: "Live P&L, positions, and system activity at a glance.",
    session: "Session P&L",
    daily: "Daily P&L",
    unrealized: "Unrealized P&L",
  },
  advanced: {
    title: "Dashboard",
    subtitle: "Live P&L, order book, and system health at a glance.",
    session: "Session P&L",
    daily: "Daily P&L",
    unrealized: "Total Unrealized",
  },
  optional: {
    title: "Dashboard",
    subtitle:
      "Full institutional board — live P&L, depth, system telemetry, and experimental metrics.",
    session: "Session P&L",
    daily: "Daily P&L",
    unrealized: "Total Unrealized",
  },
};

/**
 * Beginner summary cards — plain-language metrics with helper captions.
 * Replaces the dense P&L row + stats bar shown in higher modes.
 */
function BeginnerSummaryCards({
  sessionPnL,
  dailyPnL,
  unrealized,
}: {
  sessionPnL: number;
  dailyPnL: number;
  unrealized: number;
}) {
  const cards = [
    {
      label: "How much you've earned",
      value: fmt(sessionPnL),
      hint: "Total profit since you started this session.",
      marker: "dashboard.summary_total_return",
    },
    {
      label: "Win rate",
      value: "74.2%",
      hint: "Share of trades that closed in profit.",
      marker: "dashboard.summary_win_rate",
    },
    {
      label: "Active positions",
      value: "4",
      hint: "Trades currently open across all markets.",
      marker: "dashboard.summary_active_positions",
    },
    {
      label: "Sharpe ratio",
      value: "3.82",
      hint: "Risk-adjusted return — higher is better.",
      marker: "dashboard.summary_sharpe",
    },
    {
      label: "Today's change",
      value: fmt(dailyPnL),
      hint: "Profit or loss over the last 24 hours.",
      marker: "dashboard.summary_daily",
    },
    {
      label: "Open trades value",
      value: fmt(unrealized),
      hint: "Unrealized value of positions still running.",
      marker: "dashboard.summary_unrealized",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-ocid="dashboard.summary_cards"
    >
      {cards.map((c) => (
        <div
          key={c.label}
          className="metric-card rounded-2xl p-5 bg-card"
          data-ocid={c.marker}
        >
          <span className="label-apple">{c.label}</span>
          <div className="text-2xl font-semibold tracking-tight mt-1">
            {c.value}
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {c.hint}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard section — standalone page at /dashboard.
 *
 * Widget density and label verbosity adapt to the active experience mode
 * from the Zustand store (progressive disclosure). Advanced and Optional
 * keep the full institutional board intact; Beginner and Intermediate
 * progressively hide denser widgets and use friendlier labels.
 */
export default function DashboardPage() {
  const mode = useAppStore((s) => s.mode);
  const { sessionPnL, dailyPnL, unrealized } = useLivePnL();
  const labels = LABELS[mode];

  const isBeginner = mode === "beginner";
  const isIntermediate = mode === "intermediate";
  const isAdvanced = mode === "advanced";
  const isOptional = mode === "optional";

  // Beginner: hide order book, system heatmap, critical log feed.
  // Intermediate: hide order book and system heatmap (keep log feed).
  // Advanced/Optional: show everything.
  const showOrderBook = isAdvanced || isOptional;
  const showHeatmap = isAdvanced || isOptional;
  const showLogFeed = isIntermediate || isAdvanced || isOptional;
  const showPositions = !isBeginner;
  const showStatsBar = !isBeginner;
  const showPnLRow = !isBeginner;

  // Optional mode: expanded system heatmap + detailed order book depth are
  // surfaced via additional widgets below the main grid.
  const showExperimental = isOptional;

  const stats = [
    { label: "Sharpe Ratio", value: "3.82" },
    { label: "Max Drawdown", value: "-2.1%" },
    { label: "Volatility", value: "12.4%" },
    { label: "Win Rate", value: "74.2%" },
  ];

  return (
    <div className="flex flex-col gap-6" data-ocid="dashboard.page">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {labels.title}
        </h1>
        <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
      </header>

      {isBeginner && (
        <BeginnerSummaryCards
          sessionPnL={sessionPnL}
          dailyPnL={dailyPnL}
          unrealized={unrealized}
        />
      )}

      {showPnLRow && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          data-ocid="dashboard.pnl_header"
        >
          <div className="metric-card rounded-2xl p-5 bg-card">
            <span className="label-apple">{labels.session}</span>
            <div
              className="text-2xl font-semibold tracking-tight mt-1"
              data-ocid="dashboard.session_pnl"
            >
              {fmt(sessionPnL)}
            </div>
          </div>
          <div className="metric-card rounded-2xl p-5 bg-card">
            <span className="label-apple">{labels.daily}</span>
            <div
              className="text-2xl font-semibold tracking-tight mt-1"
              data-ocid="dashboard.daily_pnl"
            >
              {fmt(dailyPnL)}
            </div>
          </div>
          <div className="metric-card rounded-2xl p-5 bg-card">
            <span className="label-apple">{labels.unrealized}</span>
            <div
              className="text-2xl font-semibold tracking-tight mt-1"
              data-ocid="dashboard.unrealized_pnl"
            >
              {fmt(unrealized)}
            </div>
          </div>
        </div>
      )}

      {showStatsBar && (
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 px-5 rounded-xl bg-muted/40 border border-border"
          data-ocid="dashboard.stats_bar"
        >
          {stats.map((s) => (
            <span key={s.label} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium">{s.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Main grid — column composition adapts to mode */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        data-ocid="dashboard.main_grid"
      >
        {/* Column 1: equity curve + (positions in non-beginner) */}
        <div className="flex flex-col gap-4">
          <EquityCurve />
          {showPositions && <PositionsTable />}
        </div>

        {/* Column 2: heatmap (advanced/optional) + active modules */}
        <div className="flex flex-col gap-4">
          {showHeatmap && <SystemHeatmap />}
          <ActiveModules />
        </div>

        {/* Column 3: order book (advanced/optional) + log feed (intermediate+) */}
        <div className="flex flex-col gap-4">
          {showOrderBook && <OrderBook />}
          {showLogFeed && <CriticalLogFeed />}
        </div>
      </div>

      {/* Beginner: simplified activity strip below the grid so the page
          still surfaces live activity without the dense log feed. */}
      {isBeginner && (
        <div
          className="rounded-2xl border border-border bg-card p-5"
          data-ocid="dashboard.beginner_activity"
        >
          <div className="flex items-center justify-between">
            <span className="label-apple">Recent activity</span>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Your system is running smoothly. Open the Activity Feed in
            Intermediate mode or above to see every executed order and system
            event in real time.
          </p>
        </div>
      )}

      {/* Optional: experimental / power-user widgets below the main grid. */}
      {showExperimental && (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          data-ocid="dashboard.experimental_grid"
        >
          <SystemHeatmap />
          <OrderBook />
        </div>
      )}
    </div>
  );
}
