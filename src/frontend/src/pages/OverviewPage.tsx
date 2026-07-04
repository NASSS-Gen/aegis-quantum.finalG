import { ActiveModules } from "@/components/dashboard/ActiveModules";
import { CriticalLogFeed } from "@/components/dashboard/CriticalLogFeed";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { PositionsTable } from "@/components/dashboard/PositionsTable";
import { TickerStrip } from "@/components/dashboard/TickerStrip";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

function useLivePnL() {
  const [totalReturn, setTotalReturn] = useState(42890.12);
  const [winRate, setWinRate] = useState(74.2);
  const [activePositions, setActivePositions] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalReturn((v) => v + (Math.random() - 0.4) * 120);
      setWinRate((v) =>
        Math.min(99, Math.max(0, v + (Math.random() - 0.5) * 0.3)),
      );
      setActivePositions((v) =>
        Math.max(0, Math.round(v + (Math.random() - 0.5) * 0.4)),
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return { totalReturn, winRate, activePositions };
}

function fmt(n: number, prefix = "$") {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${prefix}${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const METRICS = [
  {
    key: "total_return",
    label: "Total Return",
    render: (v: number) => fmt(v),
  },
  {
    key: "win_rate",
    label: "Win Rate",
    render: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    key: "active_positions",
    label: "Active Positions",
    render: (v: number) => `${v}`,
  },
  {
    key: "sharpe",
    label: "Sharpe Ratio",
    render: () => "3.82",
  },
];

export default function OverviewPage() {
  const { totalReturn, winRate, activePositions } = useLivePnL();

  const values: Record<string, number> = {
    total_return: totalReturn,
    win_rate: winRate,
    active_positions: activePositions,
    sharpe: 3.82,
  };

  return (
    <div className="flex flex-col" data-ocid="overview.page">
      <TickerStrip />

      <div className="px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
          data-ocid="overview.header"
        >
          <span className="label-apple uppercase tracking-widest">
            Aegis Quantum
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
            Overview
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Welcome back. Your trading system is online — here's how it's
            performing today.
          </p>
        </motion.div>

        {/* Key metric cards */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          data-ocid="overview.metrics"
        >
          {METRICS.map((m, idx) => (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.1 + idx * 0.08,
                ease: "easeOut",
              }}
            >
              <div
                className="metric-card rounded-2xl p-5 bg-card h-full"
                data-ocid={`overview.metric.${m.key}`}
              >
                <span className="label-apple">{m.label}</span>
                <div className="text-2xl font-semibold tracking-tight mt-1">
                  {m.render(values[m.key])}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Equity curve + positions */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8"
          data-ocid="overview.chart_row"
        >
          <div className="lg:col-span-2">
            <EquityCurve />
          </div>
          <div className="lg:col-span-1">
            <ActiveModules />
          </div>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8"
          data-ocid="overview.table_row"
        >
          <div className="lg:col-span-2">
            <PositionsTable />
          </div>
          <div className="lg:col-span-1">
            <CriticalLogFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
