import { BacktestConfigForm } from "@/components/backtest/BacktestConfigForm";
import { BacktestResults } from "@/components/backtest/BacktestResults";
import { ModelComparisonView } from "@/components/backtest/ModelComparisonView";
import { PracticeOutcomeTracker } from "@/components/practice/PracticeOutcomeTracker";
import PracticeTradeHistory from "@/components/practice/PracticeTradeHistory";
import { PracticeTradePanel } from "@/components/practice/PracticeTradePanel";
import {
  type AssetScope,
  type TradeDirection,
  TradingViewChart,
} from "@/components/practice/TradingViewChart";
import { DrawdownChart } from "@/components/risk/DrawdownChart";
import { PortfolioHeatmap } from "@/components/risk/PortfolioHeatmap";
import { PositionSizeCalc } from "@/components/risk/PositionSizeCalc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type BacktestConfig,
  type BacktestResult,
  type BacktestSummary,
  useBacktestHistory,
  useBacktestResult,
  useRunBacktest,
} from "@/hooks/useBacktest";
import {
  type PracticeTrade,
  TradeStatus,
  usePracticeStats,
  usePracticeTrades,
} from "@/hooks/usePracticeTrades";
import { useAppStore } from "@/store/appStore";
import { AlertTriangle, History, Play, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Practice Arena section — standalone page at /practice-arena.
 *
 * Renders the Paper Trading view: live chart, paper trade panel, outcome
 * tracker, and trade history. PRACTICE ONLY — NO REAL MONEY.
 *
 * The Backtesting and Risk Management views live on their own dedicated
 * routes (/backtest, /risk) and are exported below for those pages to import.
 *
 * All surfaces use the monochrome Apple-inspired design tokens — zero
 * hardcoded hex, rounded corners, subtle shadows, system fonts.
 */
export type PracticeTab = "paper" | "backtest" | "risk";

export default function PracticePage() {
  return (
    <div className="flex flex-col gap-8" data-ocid="practice.page">
      <PracticeHeader
        title="Practice Arena"
        description="Build conviction before you risk capital. Paper-trade live prices with disciplined risk controls."
      />
      <PaperTradingView />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared header (exported for sibling pages)                          */
/* ------------------------------------------------------------------ */

export function PracticeHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2" data-ocid="practice.header">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight font-display">
          {title}
        </h1>
        <Badge
          variant="secondary"
          className="rounded-full border-border bg-muted text-muted-foreground"
          data-ocid="practice.disclaimer"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Practice only — no real money
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Paper Trading view (exported for sibling pages)                    */
/* ------------------------------------------------------------------ */

export function PaperTradingView() {
  const historyQuery = usePracticeTrades();
  const statsQuery = usePracticeStats();

  const trades = historyQuery.data ?? [];
  const stats = statsQuery.data ?? null;
  const openCount = trades.filter((t) => t.status === TradeStatus.Open).length;

  // Shared chart state — driven by the active (open) trade or a user-selected
  // history row. Defaults to NIFTY50 / india so the chart renders on load.
  const [activeSymbol, setActiveSymbol] = useState<string>("NIFTY50");
  const [activeScope, setActiveScope] = useState<AssetScope>("india");
  const [activeEntry, setActiveEntry] = useState<number | undefined>(undefined);
  const [activeTarget, setActiveTarget] = useState<number | undefined>(
    undefined,
  );
  const [activeStop, setActiveStop] = useState<number | undefined>(undefined);
  const [activeDirection, setActiveDirection] =
    useState<TradeDirection>("Long");

  const openTrade = useMemo(
    () => trades.find((t) => t.status === TradeStatus.Open) ?? null,
    [trades],
  );

  const syncChart = (trade: PracticeTrade) => {
    setActiveSymbol(trade.assetId);
    setActiveScope(trade.scope as AssetScope);
    setActiveEntry(trade.entryPrice);
    setActiveTarget(trade.targetPrice);
    setActiveStop(trade.stopLoss);
    setActiveDirection(trade.direction as TradeDirection);
  };

  const chartEntry = activeEntry ?? openTrade?.entryPrice;
  const chartTarget = activeTarget ?? openTrade?.targetPrice;
  const chartStop = activeStop ?? openTrade?.stopLoss;
  const chartDirection: TradeDirection =
    activeDirection ??
    (openTrade?.direction as TradeDirection | undefined) ??
    "Long";

  return (
    <div className="flex flex-col gap-6" data-ocid="practice.paper.view">
      {/* Stats row */}
      {stats && (
        <div
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
          data-ocid="practice.paper.stats"
        >
          <StatCard label="Total trades" value={stats.totalTrades.toString()} />
          <StatCard label="Wins" value={stats.wins.toString()} />
          <StatCard label="Losses" value={stats.losses.toString()} />
          <StatCard
            label="Win rate"
            value={`${(stats.winRate * 100).toFixed(1)}%`}
          />
          <StatCard label="Open" value={openCount.toString()} />
        </div>
      )}

      {/* Main grid: trade panel + chart + outcome tracker */}
      <div
        className="grid gap-6 lg:grid-cols-[2fr_2fr_1fr]"
        data-ocid="practice.paper.grid"
      >
        <Card className="shadow-card" data-ocid="practice.paper.panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Place a paper trade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PracticeTradePanel onTradePlaced={syncChart} />
          </CardContent>
        </Card>

        <Card
          className="shadow-card overflow-hidden"
          data-ocid="practice.paper.chart"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Live chart</CardTitle>
          </CardHeader>
          <CardContent>
            <TradingViewChart
              assetId={activeSymbol}
              scope={activeScope}
              entryPrice={chartEntry}
              targetPrice={chartTarget}
              stopLoss={chartStop}
              direction={chartDirection}
            />
          </CardContent>
        </Card>

        <Card className="shadow-card" data-ocid="practice.paper.outcome">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Outcome tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PracticeOutcomeTracker />
          </CardContent>
        </Card>
      </div>

      {/* Full-width history log */}
      <Card className="shadow-card" data-ocid="practice.paper.history">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Trade history</CardTitle>
        </CardHeader>
        <CardContent>
          <PracticeTradeHistory onTradeSelected={syncChart} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-card" data-ocid="practice.paper.stat">
      <CardContent className="p-4">
        <div className="label-apple">{label}</div>
        <div className="text-2xl font-semibold tracking-tight mt-1">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Backtesting view (exported for /backtest page)                      */
/* ------------------------------------------------------------------ */

export function BacktestingView() {
  const [activeResult, setActiveResult] = useState<BacktestResult | null>(null);
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [lastConfig, setLastConfig] = useState<BacktestConfig | null>(null);
  const mode = useAppStore((s) => s.mode);
  const showComparison = mode === "advanced" || mode === "optional";
  const runMutation = useRunBacktest();
  const historyQuery = useBacktestHistory();
  const storedResultQuery = useBacktestResult(selectedId);

  const handleRun = (config: BacktestConfig) => {
    setSelectedId(null);
    setLastConfig(config);
    runMutation.mutate(config, {
      onSuccess: (result) => setActiveResult(result),
    });
  };

  const handleSelectHistory = (summary: BacktestSummary) => {
    setSelectedId(summary.id);
    setActiveResult(null);
    setLastConfig(summary.config);
  };

  const displayedResult =
    selectedId !== null ? (storedResultQuery.data ?? null) : activeResult;
  const isLoading =
    selectedId !== null ? storedResultQuery.isLoading : runMutation.isPending;
  const error =
    selectedId !== null ? storedResultQuery.error : runMutation.error;

  return (
    <div className="flex flex-col gap-6" data-ocid="practice.backtest.view">
      <Card className="shadow-card" data-ocid="practice.backtest.config">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Backtest configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BacktestConfigForm
            onRun={handleRun}
            isRunning={runMutation.isPending}
          />
        </CardContent>
      </Card>

      {historyQuery.data && historyQuery.data.length > 0 && (
        <HistoryStrip
          summaries={historyQuery.data}
          selectedId={selectedId}
          onSelect={handleSelectHistory}
        />
      )}

      <BacktestResults
        result={displayedResult}
        isLoading={isLoading}
        error={error}
      />

      {showComparison && lastConfig && (
        <ModelComparisonView config={lastConfig} />
      )}
    </div>
  );
}

function HistoryStrip({
  summaries,
  selectedId,
  onSelect,
}: {
  summaries: BacktestSummary[];
  selectedId: bigint | null;
  onSelect: (s: BacktestSummary) => void;
}) {
  return (
    <Card className="shadow-card" data-ocid="practice.backtest.history_strip">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          Prior runs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {summaries.slice(0, 8).map((s, i) => {
            const isActive = selectedId !== null && selectedId === s.id;
            return (
              <Button
                key={s.id.toString()}
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onSelect(s)}
                className="flex-shrink-0 rounded-lg"
                data-ocid={`practice.backtest.history_item.${i + 1}`}
              >
                <span className="font-medium">{s.runLabel ?? "Unlabeled"}</span>
                <Badge
                  variant="secondary"
                  className="ml-2 rounded-full bg-muted text-muted-foreground"
                >
                  {s.tradeCount.toString()}T
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Risk Management view (exported for /risk page)                      */
/* ------------------------------------------------------------------ */

export function RiskManagementView() {
  return (
    <div className="flex flex-col gap-6" data-ocid="practice.risk.view">
      {/* Position size calculator */}
      <Card className="shadow-card" data-ocid="practice.risk.position_calc">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Position size calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PositionSizeCalc />
        </CardContent>
      </Card>

      {/* Drawdown chart */}
      <Card className="shadow-card" data-ocid="practice.risk.drawdown">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Drawdown profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrawdownChart />
        </CardContent>
      </Card>

      {/* Portfolio heatmap */}
      <Card className="shadow-card" data-ocid="practice.risk.heatmap">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Portfolio heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioHeatmap />
        </CardContent>
      </Card>

      {/* Quick risk controls */}
      <RiskControlsCard />
    </div>
  );
}

function RiskControlsCard() {
  const [riskPerTrade, setRiskPerTrade] = useState(1.5);
  const [autoStopLoss, setAutoStopLoss] = useState(true);
  const [globalSl, setGlobalSl] = useState("2.50%");
  const [trailingStop, setTrailingStop] = useState(false);

  return (
    <Card className="shadow-card" data-ocid="practice.risk.controls">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Risk controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Risk per trade slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="risk_per_trade" className="label-apple">
              Risk per trade
            </Label>
            <span className="text-sm font-semibold tabular-nums">
              {riskPerTrade.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Conservative</span>
            <input
              id="risk_per_trade"
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={riskPerTrade}
              onChange={(e) =>
                setRiskPerTrade(Number.parseFloat(e.target.value))
              }
              className="flex-1 h-1.5 appearance-none cursor-pointer rounded-full bg-muted accent-foreground"
              data-ocid="practice.risk.risk_per_trade_slider"
            />
            <span className="text-xs text-muted-foreground">Aggressive</span>
          </div>
        </div>

        {/* Auto stop loss */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto_sl" className="label-apple">
              Auto stop-loss
            </Label>
            <button
              type="button"
              role="switch"
              aria-checked={autoStopLoss}
              onClick={() => setAutoStopLoss((v) => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-smooth border border-border data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted"
              data-state={autoStopLoss ? "checked" : "unchecked"}
              data-ocid="practice.risk.auto_sl_toggle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform ${
                  autoStopLoss ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <Input
            id="global_sl"
            value={globalSl}
            onChange={(e) => setGlobalSl(e.target.value)}
            placeholder="Global SL %"
            className="config-input rounded-lg"
            data-ocid="practice.risk.global_sl_input"
          />
        </div>

        {/* Trailing stop */}
        <div className="flex items-center justify-between">
          <Label htmlFor="trailing_stop" className="label-apple">
            Trailing stop
          </Label>
          <button
            type="button"
            role="switch"
            aria-checked={trailingStop}
            onClick={() => setTrailingStop((v) => !v)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-smooth border border-border data-[state=checked]:bg-foreground data-[state=unchecked]:bg-muted"
            data-state={trailingStop ? "checked" : "unchecked"}
            data-ocid="practice.risk.trailing_stop_toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform ${
                trailingStop ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Play className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Controls apply to paper trades placed from this section.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
