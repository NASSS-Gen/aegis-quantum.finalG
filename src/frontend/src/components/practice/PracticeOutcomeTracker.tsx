import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import {
  Direction,
  type PracticeTrade,
  TradeStatus,
  usePracticeTrades,
  useResolvePracticeTrade,
} from "@/hooks/usePracticeTrades";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Crosshair, Target, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useEffect } from "react";

/**
 * PracticeOutcomeTracker
 *
 * Tracks the active (Open) practice trade and auto-resolves WIN/LOSS from the
 * live price feed. Polls every 5s. Monochrome Apple-inspired styling.
 */

const POLL_INTERVAL_MS = 5_000;
const PRICE_QUERY_KEY = ["practiceLivePrice"] as const;

function unwrapPrice(
  result: { __kind__: "Ok"; Ok: number } | { __kind__: "Err"; Err: string },
): number | null {
  return result.__kind__ === "Ok" ? result.Ok : null;
}

function unwrapLastClose(
  result:
    | { __kind__: "Ok"; Ok: Array<{ close: number }> }
    | { __kind__: "Err"; Err: string },
): number | null {
  if (result.__kind__ !== "Ok") return null;
  const candles = result.Ok;
  if (!candles.length) return null;
  return candles[candles.length - 1].close;
}

function useLivePrice(trade: PracticeTrade | null) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<number | null>({
    queryKey: [
      ...PRICE_QUERY_KEY,
      trade?.id ?? "none",
      trade?.scope ?? "",
      trade?.assetId ?? "",
    ],
    queryFn: async () => {
      if (!actor || !trade) return null;
      const { scope, assetId } = trade;

      if (scope === "crypto") {
        const r = await actor.getCryptoPrice(assetId);
        return unwrapPrice(r);
      }
      if (scope === "forex") {
        const [base, quote] = assetId.split("/");
        if (!base || !quote) return null;
        const r = await actor.getForexPrice(base, quote);
        return unwrapPrice(r);
      }
      if (scope === "india") {
        const r = await actor.getIndianStockOHLC(assetId, "1d");
        return unwrapLastClose(
          r as unknown as
            | { __kind__: "Ok"; Ok: Array<{ close: number }> }
            | { __kind__: "Err"; Err: string },
        );
      }
      return null;
    },
    enabled:
      !!actor && !isFetching && !!trade && trade.status === TradeStatus.Open,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
  });
}

function evaluateOutcome(
  trade: PracticeTrade,
  price: number,
): { resolved: boolean; status: TradeStatus } {
  const isLong = trade.direction === Direction.Long;
  if (isLong) {
    if (price >= trade.targetPrice)
      return { resolved: true, status: TradeStatus.Win };
    if (price <= trade.stopLoss)
      return { resolved: true, status: TradeStatus.Loss };
  } else {
    if (price <= trade.targetPrice)
      return { resolved: true, status: TradeStatus.Win };
    if (price >= trade.stopLoss)
      return { resolved: true, status: TradeStatus.Loss };
  }
  return { resolved: false, status: TradeStatus.Open };
}

export function PracticeOutcomeTracker() {
  const historyQuery = usePracticeTrades();
  const resolveMutation = useResolvePracticeTrade();

  const trades = historyQuery.data ?? [];
  const openTrade =
    (trades.find((t) => t.status === TradeStatus.Open) as
      | PracticeTrade
      | undefined) ?? null;

  const priceQuery = useLivePrice(openTrade);
  const currentPrice = priceQuery.data ?? null;
  const priceLoading = priceQuery.isLoading || priceQuery.isFetching;
  const isResolving = resolveMutation.isPending;

  useEffect(() => {
    if (!openTrade || currentPrice === null || isResolving) return;
    if (openTrade.status !== TradeStatus.Open) return;
    const evalResult = evaluateOutcome(openTrade, currentPrice);
    if (!evalResult.resolved) return;
    void resolveMutation.mutate({ id: openTrade.id, currentPrice });
  }, [openTrade, currentPrice, isResolving, resolveMutation]);

  if (!openTrade) {
    return <EmptyState />;
  }

  return (
    <ActiveTradeView
      trade={openTrade}
      currentPrice={currentPrice}
      priceLoading={priceLoading}
      resolving={isResolving}
    />
  );
}

function ActiveTradeView({
  trade,
  currentPrice,
  priceLoading,
  resolving,
}: {
  trade: PracticeTrade;
  currentPrice: number | null;
  priceLoading: boolean;
  resolving: boolean;
}) {
  const isLong = trade.direction === Direction.Long;
  const DirIcon = isLong ? TrendingUp : TrendingDown;

  const price = currentPrice ?? trade.entryPrice;
  const targetDist = trade.targetPrice - trade.entryPrice;
  const stopDist = trade.entryPrice - trade.stopLoss;
  const span = Math.abs(targetDist) + Math.abs(stopDist) || 1;

  let progress: number;
  if (isLong) {
    progress = ((price - trade.stopLoss) / span) * 100;
  } else {
    progress = ((trade.stopLoss - price) / span) * 100;
  }
  progress = Math.max(0, Math.min(100, progress));

  const distToTargetPct = isLong
    ? ((trade.targetPrice - price) / trade.entryPrice) * 100
    : ((price - trade.targetPrice) / trade.entryPrice) * 100;
  const distToStopPct = isLong
    ? ((price - trade.stopLoss) / trade.entryPrice) * 100
    : ((trade.stopLoss - price) / trade.entryPrice) * 100;

  return (
    <div
      className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
      data-ocid="practice.outcome_tracker"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-muted-foreground" />
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            Outcome Tracker
          </span>
        </div>
        <OutcomeBadge status={TradeStatus.Open} resolving={resolving} />
      </div>

      {/* Symbol + direction */}
      <div className="flex items-center gap-2">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          {trade.assetId}
        </span>
        <Badge
          variant="outline"
          data-ocid="practice.outcome_tracker.direction_badge"
        >
          <DirIcon className="h-3 w-3" />
          {isLong ? "Long" : "Short"}
        </Badge>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          #{trade.id.toString()} · {trade.scope}
        </span>
      </div>

      {/* Live price */}
      <div
        className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2"
        data-ocid="practice.outcome_tracker.live_price"
      >
        <span className="label-apple">Live Price</span>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground" />
          <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
            {currentPrice !== null
              ? currentPrice.toFixed(4)
              : priceLoading
                ? "Sync…"
                : "—"}
          </span>
        </div>
      </div>

      {/* Level metric cards */}
      <div className="grid grid-cols-3 gap-2">
        <LevelCard
          label="Entry"
          value={trade.entryPrice}
          icon={<Zap className="h-3 w-3" />}
        />
        <LevelCard
          label="Target"
          value={trade.targetPrice}
          icon={<Target className="h-3 w-3" />}
        />
        <LevelCard
          label="Stop"
          value={trade.stopLoss}
          icon={<TrendingDown className="h-3 w-3" />}
        />
      </div>

      {/* Price-vs-levels visual bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">
            Stop {distToStopPct >= 0 ? "+" : ""}
            {distToStopPct.toFixed(2)}%
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            Target {distToTargetPct >= 0 ? "+" : ""}
            {distToTargetPct.toFixed(2)}%
          </span>
        </div>
        <div
          className="relative h-2 w-full overflow-hidden rounded-full border border-border bg-muted"
          data-ocid="practice.outcome_tracker.price_bar"
        >
          {/* Entry marker (center) */}
          <div
            className="absolute top-0 h-full"
            style={{
              left: "50%",
              width: "1px",
              backgroundColor: "oklch(var(--marker-entry))",
            }}
          />
          {/* Current price marker */}
          <div
            className="absolute top-0 h-full"
            style={{
              left: `${progress}%`,
              width: "2px",
              backgroundColor: "oklch(var(--foreground))",
              transition: "left 0.3s ease-out",
            }}
            data-ocid="practice.outcome_tracker.price_marker"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-foreground">
            {trade.stopLoss.toFixed(2)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {trade.entryPrice.toFixed(2)}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {trade.targetPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Footer status */}
      <div className="mt-auto flex items-center gap-3 border-t border-border pt-3">
        <span className="font-mono text-[10px] text-muted-foreground">
          Poll: {POLL_INTERVAL_MS / 1000}s
        </span>
        <span className="font-mono text-[10px] font-medium text-foreground">
          {resolving ? "Resolving…" : priceLoading ? "Syncing" : "Tracking"}
        </span>
      </div>
    </div>
  );
}

function LevelCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="metric-card flex flex-col gap-1 rounded-xl p-2.5"
      data-ocid={`practice.outcome_tracker.level_${label.toLowerCase()}`}
    >
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="label-apple">{label}</span>
      </div>
      <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function OutcomeBadge({
  status,
  resolving,
}: {
  status: TradeStatus;
  resolving: boolean;
}) {
  let label = "Open";
  if (resolving) label = "Resolving";
  else if (status === TradeStatus.Win) label = "Win";
  else if (status === TradeStatus.Loss) label = "Loss";

  return (
    <Badge
      variant="secondary"
      data-ocid="practice.outcome_tracker.outcome_badge"
    >
      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-foreground" />
      {label}
    </Badge>
  );
}

function EmptyState() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-card"
      data-ocid="practice.outcome_tracker.empty_state"
    >
      <Crosshair className="h-8 w-8 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          No Active Trade
        </span>
        <span className="text-xs text-muted-foreground">
          Place a paper trade from the
          <br />
          trade panel to begin tracking
        </span>
      </div>
    </div>
  );
}

export default PracticeOutcomeTracker;
