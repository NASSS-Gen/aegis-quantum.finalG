import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Direction,
  type PracticeTrade,
  TradeStatus,
} from "@/hooks/usePracticeTrades";
import { usePracticeStats, usePracticeTrades } from "@/hooks/usePracticeTrades";
import { useMemo, useState } from "react";

/**
 * Practice Trade History Log.
 *
 * Apple-inspired monochrome: white card, hairline borders, rounded corners,
 * subtle shadows, system fonts. Performance summary, outcome breakdown,
 * filter controls, sortable table.
 */

interface PracticeTradeHistoryProps {
  onTradeSelected?: (trade: PracticeTrade) => void;
}

type SortKey = "timestamp" | "pnl" | "status";
type SortDir = "asc" | "desc";

const DIRECTION_OPTIONS: Direction[] = [Direction.Long, Direction.Short];
const OUTCOME_OPTIONS: TradeStatus[] = [
  TradeStatus.Win,
  TradeStatus.Loss,
  TradeStatus.Open,
];

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts);
    return new Date(ms).toLocaleString();
  } catch {
    return String(ts);
  }
}

function directionLabel(d: Direction): string {
  return d === Direction.Long ? "Long" : "Short";
}

function statusLabel(s: TradeStatus): string {
  if (s === TradeStatus.Win) return "Win";
  if (s === TradeStatus.Loss) return "Loss";
  return "Open";
}

function DirectionBadge({ direction }: { direction: Direction }) {
  const isLong = direction === Direction.Long;
  return (
    <Badge variant={isLong ? "default" : "secondary"}>
      {directionLabel(direction)}
    </Badge>
  );
}

function OutcomeBadge({ status }: { status: TradeStatus }) {
  if (status === TradeStatus.Win) {
    return (
      <Badge variant="default" data-ocid="practice.outcome_badge.win">
        Win
      </Badge>
    );
  }
  if (status === TradeStatus.Loss) {
    return (
      <Badge variant="secondary" data-ocid="practice.outcome_badge.loss">
        Loss
      </Badge>
    );
  }
  return (
    <Badge variant="outline" data-ocid="practice.outcome_badge.open">
      Open
    </Badge>
  );
}

export default function PracticeTradeHistory({
  onTradeSelected,
}: PracticeTradeHistoryProps) {
  const historyQuery = usePracticeTrades();
  const statsQuery = usePracticeStats();

  const trades = historyQuery.data ?? [];
  const stats = statsQuery.data ?? null;

  const [search, setSearch] = useState("");
  const [filterDirection, setFilterDirection] = useState<Direction | "all">(
    "all",
  );
  const [filterOutcome, setFilterOutcome] = useState<TradeStatus | "all">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterDirection("all");
    setFilterOutcome("all");
  };

  const filtered = useMemo(() => {
    let rows = trades.filter((t) => {
      const matchesSearch = t.assetId
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDirection =
        filterDirection === "all" || t.direction === filterDirection;
      const matchesOutcome =
        filterOutcome === "all" || t.status === filterOutcome;
      return matchesSearch && matchesDirection && matchesOutcome;
    });
    rows = [...rows].sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "timestamp") {
        av = Number(a.timestamp);
        bv = Number(b.timestamp);
      } else if (sortKey === "pnl") {
        av = a.pnl ?? 0;
        bv = b.pnl ?? 0;
      } else {
        av = statusLabel(a.status);
        bv = statusLabel(b.status);
      }
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [trades, search, filterDirection, filterOutcome, sortKey, sortDir]);

  const localStats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => t.status === TradeStatus.Win).length;
    const losses = trades.filter((t) => t.status === TradeStatus.Loss).length;
    const open = trades.filter((t) => t.status === TradeStatus.Open).length;
    const resolved = wins + losses;
    const winRate = resolved > 0 ? (wins / resolved) * 100 : 0;
    const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgPnl = resolved > 0 ? totalPnl / resolved : 0;
    const avgRiskReward =
      trades.reduce((s, t) => {
        const risk = Math.abs(t.entryPrice - t.stopLoss);
        const reward = Math.abs(t.targetPrice - t.entryPrice);
        return s + (risk > 0 ? reward / risk : 0);
      }, 0) / (total > 0 ? total : 1);
    return {
      total,
      wins,
      losses,
      open,
      winRate,
      totalPnl,
      avgPnl,
      avgRiskReward,
    };
  }, [trades]);

  const totalTrades = stats ? Number(stats.totalTrades) : localStats.total;
  const winRate = stats ? stats.winRate : localStats.winRate;
  const totalPnl = stats ? stats.totalPnl : localStats.totalPnl;
  const avgPnl = stats ? stats.avgPnl : localStats.avgPnl;
  const avgRiskReward = stats ? stats.avgRiskReward : localStats.avgRiskReward;

  const outcomeBreakdown = useMemo(() => {
    const wins = stats ? Number(stats.wins) : localStats.wins;
    const losses = stats ? Number(stats.losses) : localStats.losses;
    const open = stats ? totalTrades - wins - losses : localStats.open;
    const total = Math.max(totalTrades, 1);
    return {
      wins,
      losses,
      open,
      winPct: (wins / total) * 100,
      lossPct: (losses / total) * 100,
      openPct: (open / total) * 100,
    };
  }, [stats, localStats, totalTrades]);

  if (historyQuery.isLoading) {
    return (
      <div
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
        data-ocid="practice.history.loading_state"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            Practice Trade History
          </span>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (historyQuery.error) {
    return (
      <div
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
        data-ocid="practice.history.error_state"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            Practice History Error
          </span>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {historyQuery.error instanceof Error
            ? historyQuery.error.message
            : String(historyQuery.error)}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => void historyQuery.refetch()}
          data-ocid="practice.history.retry_button"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
      data-ocid="practice.history"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-display text-base font-semibold tracking-tight text-foreground">
          Practice Trade History
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void historyQuery.refetch()}
            data-ocid="practice.history.refresh_button"
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            data-ocid="practice.history.clear_filters_button"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Performance summary stats row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Trades"
          value={String(totalTrades)}
          marker="practice.history.stat.total_trades"
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          marker="practice.history.stat.win_rate"
        />
        <StatCard
          label="Total P&L"
          value={`${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`}
          marker="practice.history.stat.total_pnl"
        />
        <StatCard
          label="Avg P&L"
          value={`${avgPnl >= 0 ? "+" : ""}${avgPnl.toFixed(2)}`}
          marker="practice.history.stat.avg_pnl"
        />
        <StatCard
          label="Avg Risk/Reward"
          value={avgRiskReward.toFixed(2)}
          marker="practice.history.stat.avg_rr"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Outcome breakdown panel */}
      <div
        className="mb-4 rounded-xl border border-border bg-muted/30 p-4"
        data-ocid="practice.history.outcome_breakdown"
      >
        <div className="label-apple mb-2">Outcome Breakdown</div>
        <div className="space-y-2">
          {[
            {
              label: "Win",
              count: outcomeBreakdown.wins,
              pct: outcomeBreakdown.winPct,
            },
            {
              label: "Loss",
              count: outcomeBreakdown.losses,
              pct: outcomeBreakdown.lossPct,
            },
            {
              label: "Open",
              count: outcomeBreakdown.open,
              pct: outcomeBreakdown.openPct,
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-10 text-xs font-medium text-foreground">
                {row.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-border bg-background">
                <div
                  className="h-full rounded-full bg-foreground transition-smooth"
                  style={{ width: `${Math.min(row.pct, 100)}%` }}
                />
              </div>
              <span className="w-20 text-right font-mono text-xs text-muted-foreground">
                {row.count} · {row.pct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol…"
          className="min-w-[180px] flex-1"
          data-ocid="practice.history.search_input"
        />
        <Select
          value={filterDirection}
          onValueChange={(v) => setFilterDirection(v as Direction | "all")}
        >
          <SelectTrigger
            className="w-[160px]"
            data-ocid="practice.history.filter_direction_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            {DIRECTION_OPTIONS.map((d) => (
              <SelectItem key={`dir-${d}`} value={d}>
                {directionLabel(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterOutcome}
          onValueChange={(v) => setFilterOutcome(v as TradeStatus | "all")}
        >
          <SelectTrigger
            className="w-[160px]"
            data-ocid="practice.history.filter_outcome_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            {OUTCOME_OPTIONS.map((o) => (
              <SelectItem key={`out-${o}`} value={o}>
                {statusLabel(o)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trade log table */}
      <div
        className="overflow-auto"
        style={{ maxHeight: 420 }}
        data-ocid="practice.history.table"
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="border-border">
              {[
                {
                  key: "timestamp" as const,
                  label: "Timestamp",
                  sortable: true,
                },
                { key: null, label: "Symbol", sortable: false },
                { key: null, label: "Direction", sortable: false },
                { key: null, label: "Entry", sortable: false },
                { key: null, label: "Target", sortable: false },
                { key: null, label: "Stop", sortable: false },
                { key: "status" as const, label: "Outcome", sortable: true },
                { key: "pnl" as const, label: "P&L", sortable: true },
              ].map((col) => (
                <TableHead
                  key={col.label}
                  className={
                    col.sortable
                      ? "cursor-pointer select-none hover:text-foreground"
                      : ""
                  }
                  onClick={
                    col.sortable
                      ? () => handleSort(col.key as SortKey)
                      : undefined
                  }
                  data-ocid={`practice.history.th.${col.label.toLowerCase()}`}
                >
                  {col.label}
                  {col.sortable &&
                    sortKey === col.key &&
                    (sortDir === "asc" ? " ▲" : " ▼")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-sm text-muted-foreground"
                  data-ocid="practice.history.empty_state"
                >
                  No practice trades yet — place a paper trade to begin
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t, i) => {
                const pnl = t.pnl ?? 0;
                return (
                  <TableRow
                    key={String(t.id)}
                    className={onTradeSelected ? "cursor-pointer" : ""}
                    onClick={
                      onTradeSelected ? () => onTradeSelected(t) : undefined
                    }
                    data-ocid={`practice.history.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatTimestamp(t.timestamp)}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {t.assetId}
                    </TableCell>
                    <TableCell>
                      <DirectionBadge direction={t.direction} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {t.entryPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {t.targetPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {t.stopLoss.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge status={t.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {pnl >= 0 ? "+" : ""}
                      {pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Practice-only disclaimer */}
      <div
        className="mt-3 text-center text-xs text-muted-foreground"
        data-ocid="practice.history.disclaimer"
      >
        Practice only — no real money · paper-trade P&L
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  marker,
  className = "",
}: {
  label: string;
  value: string;
  marker: string;
  className?: string;
}) {
  return (
    <div
      className={`metric-card flex flex-col gap-1 rounded-xl p-3 text-center ${className}`}
      data-ocid={marker}
    >
      <div className="label-apple">{label}</div>
      <div className="font-mono text-lg font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}
