import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useMemo, useState } from "react";
import {
  Outcome,
  type PredictionRecord,
  type PredictionStats,
  SignalGrade,
  SignalType,
  Timeframe,
} from "../../backend";
import { usePredictionHistory } from "../../hooks/usePredictionHistory";

interface PredictionHistoryProps {
  mode: "beginner" | "advanced" | "power";
}

function formatSignal(signal: SignalType): string {
  const map: Record<SignalType, string> = {
    [SignalType.BuyCall]: "Buy Call",
    [SignalType.BuyPut]: "Buy Put",
    [SignalType.BuyFutures]: "Buy Futures",
    [SignalType.Hold]: "Hold",
    [SignalType.Sell]: "Sell",
  };
  return map[signal] ?? signal;
}

function formatGrade(grade: SignalGrade): string {
  return grade;
}

function formatTimeframe(tf: Timeframe): string {
  const map: Record<Timeframe, string> = {
    [Timeframe.M1]: "1M",
    [Timeframe.M5]: "5M",
    [Timeframe.M15]: "15M",
    [Timeframe.M30]: "30M",
    [Timeframe.H1]: "1H",
    [Timeframe.H4]: "4H",
    [Timeframe.D1]: "1D",
    [Timeframe.W1]: "1W",
  };
  return map[tf] ?? tf;
}

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts / 1000000n);
    return new Date(ms).toLocaleString();
  } catch {
    return String(ts);
  }
}

const SIGNAL_OPTIONS: SignalType[] = [
  SignalType.BuyCall,
  SignalType.BuyPut,
  SignalType.BuyFutures,
  SignalType.Hold,
  SignalType.Sell,
];

const GRADE_OPTIONS: SignalGrade[] = [
  SignalGrade.A,
  SignalGrade.B,
  SignalGrade.C,
  SignalGrade.D,
  SignalGrade.F,
];

const TIMEFRAME_OPTIONS: Timeframe[] = [
  Timeframe.M5,
  Timeframe.M15,
  Timeframe.M30,
  Timeframe.H1,
  Timeframe.H4,
  Timeframe.D1,
];

const OUTCOME_OPTIONS: Outcome[] = [
  Outcome.Open,
  Outcome.HitTarget,
  Outcome.HitStop,
];

function outcomeLabel(o: Outcome): string {
  if (o === Outcome.HitTarget) return "Hit Target";
  if (o === Outcome.HitStop) return "Hit Stop";
  return "Open";
}

function outcomeTone(
  outcome: Outcome | undefined,
): "default" | "secondary" | "outline" {
  const o = outcome ?? Outcome.Open;
  if (o === Outcome.HitTarget) return "default";
  if (o === Outcome.HitStop) return "outline";
  return "secondary";
}

function gradeTone(grade: SignalGrade): "default" | "secondary" | "outline" {
  if (grade === SignalGrade.A || grade === SignalGrade.B) return "default";
  if (grade === SignalGrade.C) return "secondary";
  return "outline";
}

export default function PredictionHistory({ mode }: PredictionHistoryProps) {
  const {
    history,
    stats,
    loading,
    error,
    applyFilters,
    clearFilters,
    manualResolve,
    resolveFromPrice,
    refresh,
  } = usePredictionHistory();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof PredictionRecord>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterAsset, setFilterAsset] = useState("");
  const [filterSignal, setFilterSignal] = useState<SignalType | "">("");
  const [filterGrade, setFilterGrade] = useState<SignalGrade | "">("");
  const [filterTimeframe, setFilterTimeframe] = useState<Timeframe | "">("");
  const [filterOutcome, setFilterOutcome] = useState<Outcome | "">("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Manual override modal state
  const [overrideTarget, setOverrideTarget] = useState<PredictionRecord | null>(
    null,
  );
  const [overrideOutcome, setOverrideOutcome] = useState<Outcome>(
    Outcome.HitTarget,
  );
  const [overridePnl, setOverridePnl] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Price resolution busy set (per-row)
  const [priceBusyId, setPriceBusyId] = useState<bigint | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  const submitFilters = useCallback(() => {
    applyFilters({
      assetId: filterAsset || undefined,
      signalType: filterSignal || undefined,
      grade: filterGrade || undefined,
      timeframe: filterTimeframe || undefined,
      outcome: filterOutcome || undefined,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined,
    });
  }, [
    applyFilters,
    filterAsset,
    filterSignal,
    filterGrade,
    filterTimeframe,
    filterOutcome,
    filterStartDate,
    filterEndDate,
  ]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setFilterAsset("");
    setFilterSignal("");
    setFilterGrade("");
    setFilterTimeframe("");
    setFilterOutcome("");
    setFilterStartDate("");
    setFilterEndDate("");
    clearFilters();
  }, [clearFilters]);

  const filtered = useMemo(() => {
    let rows = history.filter((h) => {
      const matchesSearch =
        h.assetId.toLowerCase().includes(search.toLowerCase()) ||
        formatSignal(h.signal).toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      if (typeof av === "bigint" && typeof bv === "bigint") {
        return sortDir === "asc" ? Number(av - bv) : Number(bv - av);
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [history, search, sortKey, sortDir]);

  const localStats = useMemo(() => {
    const total = history.length;
    const wins = history.filter((h) => h.outcome === Outcome.HitTarget).length;
    const losses = history.filter((h) => h.outcome === Outcome.HitStop).length;
    const open = history.filter((h) => h.outcome === Outcome.Open).length;
    const resolved = wins + losses;
    const winRate = resolved > 0 ? (wins / resolved) * 100 : 0;
    const totalPnl = history.reduce((s, h) => s + (h.pnl ?? 0), 0);
    const avgReturn = resolved > 0 ? totalPnl / resolved : 0;
    return {
      total,
      wins,
      losses,
      open,
      resolved,
      winRate,
      totalPnl,
      avgReturn,
    };
  }, [history]);

  const gradeDist = useMemo(() => {
    if (stats) {
      return {
        a: Number(stats.gradeDistribution.gradeA),
        b: Number(stats.gradeDistribution.gradeB),
        c: Number(stats.gradeDistribution.gradeC),
        d: Number(stats.gradeDistribution.gradeD),
        f: Number(stats.gradeDistribution.gradeF),
      };
    }
    return {
      a: history.filter((h) => h.grade === SignalGrade.A).length,
      b: history.filter((h) => h.grade === SignalGrade.B).length,
      c: history.filter((h) => h.grade === SignalGrade.C).length,
      d: history.filter((h) => h.grade === SignalGrade.D).length,
      f: history.filter((h) => h.grade === SignalGrade.F).length,
    };
  }, [stats, history]);

  const outcomeBreakdown = useMemo(() => {
    if (stats) {
      return {
        hitTarget: Number(stats.outcomeBreakdown.hitTarget),
        hitStop: Number(stats.outcomeBreakdown.hitStop),
        open: Number(stats.outcomeBreakdown.open),
      };
    }
    return {
      hitTarget: localStats.wins,
      hitStop: localStats.losses,
      open: localStats.open,
    };
  }, [stats, localStats]);

  const winRate = stats ? stats.winRate : localStats.winRate;
  const avgReturn = stats ? stats.avgPnl : localStats.avgReturn;
  const totalPredictions = stats
    ? Number(stats.totalPredictions)
    : localStats.total;

  const handleSort = (key: keyof PredictionRecord) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const openOverride = (record: PredictionRecord) => {
    setOverrideTarget(record);
    setOverrideOutcome(Outcome.HitTarget);
    setOverridePnl(record.pnl != null ? String(record.pnl) : "");
    setOverrideReason("");
    setOverrideError(null);
  };

  const closeOverride = () => {
    setOverrideTarget(null);
    setOverrideError(null);
  };

  const submitOverride = async () => {
    if (!overrideTarget) return;
    setOverrideBusy(true);
    setOverrideError(null);
    try {
      const pnlNum = Number.parseFloat(overridePnl) || 0;
      await manualResolve(overrideTarget.id, overrideOutcome, pnlNum);
      setOverrideTarget(null);
    } catch (err: unknown) {
      setOverrideError(err instanceof Error ? err.message : String(err));
    } finally {
      setOverrideBusy(false);
    }
  };

  const handleResolveFromPrice = async (record: PredictionRecord) => {
    setPriceBusyId(record.id);
    setPriceError(null);
    try {
      await resolveFromPrice(record.id, record.assetClass);
    } catch (err: unknown) {
      setPriceError(err instanceof Error ? err.message : String(err));
    } finally {
      setPriceBusyId(null);
    }
  };

  if (loading) {
    return (
      <Card data-ocid="history.loading_state" className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Prediction History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-ocid="history.error_state" className="shadow-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Prediction History Error
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={refresh}
            data-ocid="history.retry_button"
            className="self-start"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-ocid="history.panel" className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Prediction History
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={refresh}
            data-ocid="history.refresh_button"
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetFilters}
            data-ocid="history.clear_filters_button"
          >
            Clear filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mode !== "beginner" && (
          <>
            {/* Core stats row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Total" value={`${totalPredictions}`} />
              <StatTile label="Win Rate" value={`${winRate.toFixed(1)}%`} />
              <StatTile
                label="Total P&L"
                value={`${localStats.totalPnl >= 0 ? "+" : ""}${localStats.totalPnl.toFixed(2)}%`}
              />
              <StatTile
                label="Avg Return"
                value={`${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(2)}%`}
              />
            </div>

            {/* Grade distribution + outcome breakdown */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="label-apple mb-2">Grade Distribution</div>
                <div className="flex items-end justify-between gap-1">
                  {[
                    { label: "A", value: gradeDist.a },
                    { label: "B", value: gradeDist.b },
                    { label: "C", value: gradeDist.c },
                    { label: "D", value: gradeDist.d },
                    { label: "F", value: gradeDist.f },
                  ].map((g) => (
                    <div
                      key={`grade-${g.label}`}
                      className="flex flex-1 flex-col items-center"
                    >
                      <div className="font-mono text-sm font-semibold text-foreground">
                        {g.value}
                      </div>
                      <div className="label-apple">{g.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="label-apple mb-2">Outcome Breakdown</div>
                <div className="flex items-end justify-between gap-1">
                  <div className="flex flex-1 flex-col items-center">
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {outcomeBreakdown.hitTarget}
                    </div>
                    <div className="label-apple">Target</div>
                  </div>
                  <div className="flex flex-1 flex-col items-center">
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {outcomeBreakdown.hitStop}
                    </div>
                    <div className="label-apple">Stop</div>
                  </div>
                  <div className="flex flex-1 flex-col items-center">
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {outcomeBreakdown.open}
                    </div>
                    <div className="label-apple">Open</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {mode !== "beginner" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search asset or signal..."
                className="flex-1 min-w-[180px]"
                data-ocid="history.search_input"
              />
              <Input
                type="text"
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value)}
                placeholder="Filter asset..."
                className="w-40"
                data-ocid="history.filter_asset_input"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filterSignal}
                onValueChange={(v) =>
                  setFilterSignal((v || "") as SignalType | "")
                }
              >
                <SelectTrigger
                  className="w-36"
                  data-ocid="history.filter_signal_select"
                >
                  <SelectValue placeholder="All Signals" />
                </SelectTrigger>
                <SelectContent>
                  {SIGNAL_OPTIONS.map((s) => (
                    <SelectItem key={`sig-${s}`} value={s}>
                      {formatSignal(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterGrade}
                onValueChange={(v) =>
                  setFilterGrade((v || "") as SignalGrade | "")
                }
              >
                <SelectTrigger
                  className="w-32"
                  data-ocid="history.filter_grade_select"
                >
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={`grade-opt-${g}`} value={g}>
                      {formatGrade(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterTimeframe}
                onValueChange={(v) =>
                  setFilterTimeframe((v || "") as Timeframe | "")
                }
              >
                <SelectTrigger
                  className="w-36"
                  data-ocid="history.filter_timeframe_select"
                >
                  <SelectValue placeholder="All Timeframes" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAME_OPTIONS.map((t) => (
                    <SelectItem key={`tf-${t}`} value={t}>
                      {formatTimeframe(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterOutcome}
                onValueChange={(v) =>
                  setFilterOutcome((v || "") as Outcome | "")
                }
              >
                <SelectTrigger
                  className="w-36"
                  data-ocid="history.filter_outcome_select"
                >
                  <SelectValue placeholder="All Outcomes" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map((o) => (
                    <SelectItem key={`out-${o}`} value={o}>
                      {outcomeLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-40"
                data-ocid="history.filter_start_date"
              />
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-40"
                data-ocid="history.filter_end_date"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={submitFilters}
                data-ocid="history.apply_filters_button"
              >
                Apply
              </Button>
            </div>
            {priceError && (
              <div
                className="text-sm text-muted-foreground"
                data-ocid="history.price_resolve_error"
              >
                {priceError}
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          {mode === "beginner" ? (
            <div className="space-y-2">
              {filtered.length === 0 && (
                <div
                  className="py-6 text-center text-sm text-muted-foreground"
                  data-ocid="history.empty_state"
                >
                  No predictions yet.
                </div>
              )}
              {filtered.map((h, i) => (
                <div
                  key={`row-${String(h.id)}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2"
                  data-ocid={`history.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {h.assetId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatSignal(h.signal)}
                    </span>
                  </div>
                  <Badge variant={outcomeTone(h.outcome)} className="text-xs">
                    {outcomeLabel(h.outcome ?? Outcome.Open)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: "timestamp" as const, label: "Time" },
                    { key: "assetId" as const, label: "Asset" },
                    { key: "signal" as const, label: "Signal" },
                    { key: "grade" as const, label: "Grade" },
                    { key: "timeframe" as const, label: "TF" },
                    { key: "entryPrice" as const, label: "Entry" },
                    { key: "targetPrice" as const, label: "Target" },
                    { key: "stopLoss" as const, label: "Stop" },
                    { key: "outcome" as const, label: "Outcome" },
                    { key: "pnl" as const, label: "P&L" },
                  ].map((col) => (
                    <TableHead
                      key={`th-${col.key}`}
                      className="label-apple cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort(col.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSort(col.key);
                        }
                      }}
                    >
                      {col.label}
                      {sortKey === col.key && (sortDir === "asc" ? " ▲" : " ▼")}
                    </TableHead>
                  ))}
                  <TableHead className="label-apple">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-6 text-center text-sm text-muted-foreground"
                      data-ocid="history.empty_state"
                    >
                      No predictions match the current filters.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((h, i) => {
                  const isOpen = (h.outcome ?? Outcome.Open) === Outcome.Open;
                  const resolving = priceBusyId === h.id;
                  return (
                    <TableRow
                      key={`tr-${String(h.id)}`}
                      data-ocid={`history.item.${i + 1}`}
                    >
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatTimestamp(h.timestamp)}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {h.assetId}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatSignal(h.signal)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={gradeTone(h.grade)}
                          className="text-xs font-semibold"
                        >
                          {h.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatTimeframe(h.timeframe)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {h.entryPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {h.targetPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {h.stopLoss.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={outcomeTone(h.outcome)}
                          className="text-xs"
                        >
                          {outcomeLabel(h.outcome ?? Outcome.Open)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold tabular-nums">
                        {(h.pnl ?? 0) >= 0 ? "+" : ""}
                        {(h.pnl ?? 0).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isOpen && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveFromPrice(h)}
                              disabled={resolving}
                              data-ocid={`history.resolve_price_button.${i + 1}`}
                              title="Resolve from live price"
                            >
                              {resolving ? "..." : "Price"}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openOverride(h)}
                            data-ocid={`history.override_button.${i + 1}`}
                            title="Manually override outcome"
                          >
                            Override
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>

      {/* Manual override modal */}
      <Dialog
        open={overrideTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeOverride();
        }}
      >
        <DialogContent data-ocid="history.override_dialog" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Outcome Override</DialogTitle>
          </DialogHeader>
          {overrideTarget && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {overrideTarget.assetId} · {formatSignal(overrideTarget.signal)}{" "}
                · Entry {overrideTarget.entryPrice.toFixed(2)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="history-override-outcome">Outcome</Label>
                <Select
                  value={overrideOutcome}
                  onValueChange={(v) => setOverrideOutcome(v as Outcome)}
                >
                  <SelectTrigger
                    id="history-override-outcome"
                    data-ocid="history.override_outcome_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOME_OPTIONS.map((o) => (
                      <SelectItem key={`ov-out-${o}`} value={o}>
                        {outcomeLabel(o)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="history-override-pnl">P&L (%)</Label>
                <Input
                  id="history-override-pnl"
                  type="number"
                  step="0.01"
                  value={overridePnl}
                  onChange={(e) => setOverridePnl(e.target.value)}
                  placeholder="e.g. 2.5 or -1.0"
                  data-ocid="history.override_pnl_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="history-override-reason">
                  Reason (optional)
                </Label>
                <Input
                  id="history-override-reason"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Why is this being overridden?"
                  data-ocid="history.override_reason_input"
                />
              </div>
              {overrideError && (
                <div
                  className="text-sm text-muted-foreground"
                  data-ocid="history.override_error"
                >
                  {overrideError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeOverride}
                  disabled={overrideBusy}
                  data-ocid="history.override_cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitOverride}
                  disabled={overrideBusy}
                  data-ocid="history.override_confirm_button"
                >
                  {overrideBusy ? "Saving..." : "Confirm override"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
      <div className="label-apple">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
