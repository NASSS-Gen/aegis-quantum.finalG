import type { CalibrationTable, RegimePerformance } from "@/backend";
import { MarketRegime, QuantModel } from "@/backend";
import { Skeleton } from "@/components/ui/skeleton";
import type { BacktestResult } from "@/hooks/useBacktest";
import { useAppStore } from "@/store/appStore";
import { BacktestMetricsCards } from "./BacktestMetricsCards";
import { EquityCurveChart } from "./EquityCurveChart";
import { TradeLogTable } from "./TradeLogTable";

interface Props {
  result: BacktestResult | null;
  isLoading?: boolean;
  error?: Error | null;
}

const MODEL_LABELS: Record<QuantModel, string> = {
  [QuantModel.auto]: "Auto",
  [QuantModel.momentum]: "Momentum",
  [QuantModel.meanReversion]: "Mean Reversion",
  [QuantModel.pairs]: "Pairs",
};

const REGIME_LABELS: Record<MarketRegime, string> = {
  [MarketRegime.trendingUp]: "Trending Up",
  [MarketRegime.trendingDown]: "Trending Down",
  [MarketRegime.volatile_]: "Volatile",
  [MarketRegime.ranging]: "Ranging",
};

export function BacktestResults({ result, isLoading, error }: Props) {
  const mode = useAppStore((s) => s.mode);

  if (isLoading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 shadow-card"
        data-ocid="backtest.results_error"
      >
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          Backtest Execution Failed
        </span>
        <span className="text-sm text-muted-foreground">{error.message}</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-12 shadow-card"
        data-ocid="backtest.results_empty"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
          <span className="text-xl text-muted-foreground">□</span>
        </div>
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          No Backtest Results
        </span>
        <span className="text-xs text-muted-foreground">
          Configure parameters and execute backtest to begin
        </span>
      </div>
    );
  }

  const showIntermediate = mode !== "beginner";
  const showAdvanced = mode === "advanced" || mode === "optional";
  const showOptional = mode === "optional";

  const regimeBreakdown = result.metrics.regimeBreakdown;
  const calibrationTable = result.metrics.calibrationTable;
  const inSample = result.metrics.inSampleWinRate;
  const outOfSample = result.metrics.outOfSampleWinRate;
  const hasWalkForward = inSample !== undefined || outOfSample !== undefined;

  return (
    <div className="flex flex-col gap-4" data-ocid="backtest.results">
      {/* Run header — always shows model name */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
        data-ocid="backtest.run_header"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            Run: {result.config.runLabel ?? "Unlabeled"}
          </span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Model: {MODEL_LABELS[result.metrics.model]}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {result.config.assetId.toUpperCase()}
            {result.config.pairsAssetId
              ? ` / ${result.config.pairsAssetId.toUpperCase()}`
              : ""}{" "}
            · {result.config.timeframe}
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          Executed: {formatRunAt(result.runAt)}
        </span>
      </div>

      {/* Beginner summary: win rate + total trades + model name */}
      {mode === "beginner" && (
        <div
          className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
          data-ocid="backtest.beginner_summary"
        >
          <SummaryStat
            label="Model"
            value={MODEL_LABELS[result.metrics.model]}
          />
          <SummaryStat
            label="Win Rate"
            value={`${result.metrics.winRate.toFixed(1)}%`}
          />
          <SummaryStat
            label="Total Trades"
            value={result.metrics.numberOfTrades.toString()}
          />
        </div>
      )}

      {/* Equity curve + metrics (hidden in beginner mode) */}
      {showIntermediate && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EquityCurveChart
              data={result.equityCurve}
              initialCapital={result.config.initialCapital}
            />
          </div>
          <div className="lg:col-span-1">
            <BacktestMetricsCards metrics={result.metrics} />
          </div>
        </div>
      )}

      {/* Walk-forward in-sample vs out-of-sample (advanced + optional) */}
      {showAdvanced && hasWalkForward && (
        <WalkForwardSection inSample={inSample} outOfSample={outOfSample} />
      )}

      {/* Regime breakdown table (advanced + optional, only if enabled) */}
      {showAdvanced &&
        result.config.includeRegimeBreakdown &&
        regimeBreakdown &&
        regimeBreakdown.length > 0 && (
          <RegimeBreakdownTable breakdown={regimeBreakdown} />
        )}

      {/* Calibration table (optional only) */}
      {showOptional && calibrationTable && (
        <CalibrationTableSection table={calibrationTable} />
      )}

      {/* Trade log (intermediate and up) */}
      {showIntermediate && <TradeLogTable trades={result.trades} />}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label-apple">{label}</span>
      <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
        {value}
      </span>
    </div>
  );
}

function WalkForwardSection({
  inSample,
  outOfSample,
}: {
  inSample: number | undefined;
  outOfSample: number | undefined;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 shadow-card"
      data-ocid="backtest.walk_forward_section"
    >
      <h4 className="font-display text-sm font-semibold tracking-tight text-foreground">
        Walk-Forward Validation
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        In-sample fit vs out-of-sample robustness. A small gap indicates the
        model generalizes rather than overfitting.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="metric-card flex flex-col gap-1 rounded-xl p-3">
          <span className="label-apple">In-Sample Win Rate</span>
          <span className="font-mono text-xl font-semibold tracking-tight metric-value-neutral">
            {inSample !== undefined ? `${Number(inSample).toFixed(1)}%` : "—"}
          </span>
        </div>
        <div className="metric-card flex flex-col gap-1 rounded-xl p-3">
          <span className="label-apple">Out-of-Sample Win Rate</span>
          <span className="font-mono text-xl font-semibold tracking-tight metric-value-neutral">
            {outOfSample !== undefined
              ? `${Number(outOfSample).toFixed(1)}%`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function RegimeBreakdownTable({
  breakdown,
}: {
  breakdown: RegimePerformance[];
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 shadow-card"
      data-ocid="backtest.regime_breakdown_section"
    >
      <h4 className="font-display text-sm font-semibold tracking-tight text-foreground">
        Regime Breakdown
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        How the strategy performed across distinct market regimes.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 font-medium text-muted-foreground">
                Regime
              </th>
              <th className="py-2 pr-4 text-right font-medium text-muted-foreground">
                Win Rate
              </th>
              <th className="py-2 pr-4 text-right font-medium text-muted-foreground">
                Trades
              </th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row, i) => (
              <tr
                key={row.regime}
                className="border-b border-border/50 last:border-0"
                data-ocid={`backtest.regime_row.${i + 1}`}
              >
                <td className="py-2 pr-4 font-medium text-foreground">
                  {REGIME_LABELS[row.regime] ?? row.regime}
                </td>
                <td className="py-2 pr-4 text-right font-mono tabular-nums">
                  {Number(row.winRate).toFixed(1)}%
                </td>
                <td className="py-2 pr-4 text-right font-mono tabular-nums">
                  {row.tradeCount.toString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalibrationTableSection({ table }: { table: CalibrationTable }) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 shadow-card"
      data-ocid="backtest.calibration_section"
    >
      <h4 className="font-display text-sm font-semibold tracking-tight text-foreground">
        Confidence Calibration
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        {table.disclaimer} · {table.totalSamples.toString()} total samples
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 font-medium text-muted-foreground">
                Confidence
              </th>
              <th className="py-2 pr-4 text-right font-medium text-muted-foreground">
                Realized Win
              </th>
              <th className="py-2 pr-4 text-right font-medium text-muted-foreground">
                Samples
              </th>
              <th className="py-2 pr-4 text-right font-medium text-muted-foreground">
                Reliability
              </th>
            </tr>
          </thead>
          <tbody>
            {table.buckets.map((b, i) => (
              <tr
                key={`cal-${b.minConfidence}-${b.maxConfidence}`}
                className="border-b border-border/50 last:border-0"
                data-ocid={`backtest.calibration_row.${i + 1}`}
              >
                <td className="py-2 pr-4 font-mono tabular-nums text-foreground">
                  {b.minConfidence.toFixed(0)}–{b.maxConfidence.toFixed(0)}%
                </td>
                <td className="py-2 pr-4 text-right font-mono tabular-nums">
                  {Number(b.realizedWinRate).toFixed(1)}%
                </td>
                <td className="py-2 pr-4 text-right font-mono tabular-nums">
                  {b.sampleCount.toString()}
                </td>
                <td className="py-2 pr-4 text-right font-mono tabular-nums">
                  {b.reliabilityGrade} ({b.reliabilityFactor.toFixed(2)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-ocid="backtest.results_loading">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          Executing backtest…
        </span>
      </div>
      <Skeleton className="equity-curve-grid h-[320px] rounded-2xl border border-border" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={`metric-skeleton-slot-${i + 1}`}
            className="metric-card h-20 rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

function formatRunAt(ts: bigint): string {
  const d = new Date(Number(ts) * 1000);
  return `${d.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}
