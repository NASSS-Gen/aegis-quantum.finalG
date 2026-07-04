import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type BacktestConfig,
  type ModelComparison,
  type ModelComparisonEntry,
  QuantModel,
  type RunModelComparisonInput,
  useRunModelComparison,
} from "@/hooks/useBacktest";
import { GitCompareArrows } from "lucide-react";
import { useMemo } from "react";

const MODEL_LABELS: Record<QuantModel, string> = {
  [QuantModel.auto]: "Auto",
  [QuantModel.momentum]: "Momentum",
  [QuantModel.meanReversion]: "Mean Reversion",
  [QuantModel.pairs]: "Pairs",
};

interface Props {
  /** Current form values — used to seed the comparison run. */
  config: BacktestConfig;
}

/**
 * Head-to-head comparison of all quant models over the same date range
 * and capital. Renders a side-by-side table of win rate, Sharpe, max
 * drawdown, profit factor, total trades, and out-of-sample win rate.
 * Monochrome tokens only — no color accents.
 */
export function ModelComparisonView({ config }: Props) {
  const mutation = useRunModelComparison();
  const comparison = mutation.data ?? null;

  const input: RunModelComparisonInput = useMemo(
    () => ({
      assetId: config.assetId,
      assetClass: config.assetClass,
      pairsAssetId: config.pairsAssetId ?? null,
      timeframe: config.timeframe,
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.initialCapital,
      strategyParams: config.strategyParams,
    }),
    [config],
  );

  const handleRun = () => {
    mutation.mutate(input);
  };

  return (
    <Card className="shadow-card" data-ocid="backtest.model_comparison">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <GitCompareArrows className="h-4 w-4" />
          Model Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleRun}
            disabled={mutation.isPending}
            data-ocid="backtest.run_comparison_button"
          >
            <GitCompareArrows className="h-4 w-4" />
            {mutation.isPending ? "Comparing…" : "Run Comparison"}
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {config.assetId.toUpperCase()}
            {config.pairsAssetId
              ? ` / ${config.pairsAssetId.toUpperCase()}`
              : ""}{" "}
            · {config.timeframe} · {config.startDate.toString()} →{" "}
            {config.endDate.toString()}
          </span>
        </div>

        {mutation.isPending && <ComparisonSkeleton />}

        {mutation.error && (
          <div
            className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground"
            data-ocid="backtest.comparison_error"
          >
            Comparison failed: {mutation.error.message}
          </div>
        )}

        {comparison && !mutation.isPending && (
          <ComparisonTable comparison={comparison} />
        )}

        {!comparison && !mutation.isPending && !mutation.error && (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center"
            data-ocid="backtest.comparison_empty"
          >
            <span className="font-display text-sm font-medium text-foreground">
              No comparison yet
            </span>
            <span className="text-xs text-muted-foreground">
              Run a head-to-head comparison of all quant models over the current
              date range to see which strategy fits best.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComparisonTable({ comparison }: { comparison: ModelComparison }) {
  const rows = comparison.results;
  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground"
        data-ocid="backtest.comparison_empty"
      >
        No model results returned.
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border"
      data-ocid="backtest.comparison_table"
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left">
            <th className="px-3 py-2 font-medium text-muted-foreground">
              Model
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Win Rate
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Sharpe
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Max DD
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Profit Factor
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              Trades
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
              OOS Win
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: ModelComparisonEntry, i: number) => (
            <tr
              key={row.model}
              className="border-b border-border/50 last:border-0"
              data-ocid={`backtest.comparison_row.${i + 1}`}
            >
              <td className="px-3 py-2 font-medium text-foreground">
                {MODEL_LABELS[row.model] ?? row.model}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {Number(row.winRate).toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {Number(row.sharpe).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {Number(row.maxDrawdown).toFixed(2)}%
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {Number(row.profitFactor).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {row.totalTrades.toString()}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {row.outOfSampleWinRate !== undefined
                  ? `${Number(row.outOfSampleWinRate).toFixed(1)}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border"
      data-ocid="backtest.comparison_loading"
    >
      <Skeleton className="h-9 w-full rounded-none border-b border-border" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={`comp-skel-row-${i + 1}-of-4`}
          className="h-10 w-full rounded-none border-b border-border/50 last:border-0"
        />
      ))}
    </div>
  );
}
