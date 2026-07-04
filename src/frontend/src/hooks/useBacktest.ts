import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  AssetClass,
  AssetId,
  BacktestConfig,
  BacktestResult,
  BacktestSummary,
  ModelComparison,
  QuantSettings,
  Timestamp,
} from "../backend";
import { QuantModel, type Timeframe } from "../backend";

/**
 * Backtest domain hooks backed by the regenerated typed bindings.
 *
 * Types are re-exported from the generated `../backend` module so consumers
 * import the exact Candid shapes (bigint timestamps, enum variants, optional
 * fields) rather than hand-rolled approximations.
 */

export type {
  AssetClass,
  AssetId,
  BacktestConfig,
  BacktestResult,
  BacktestSummary,
  BacktestTrade,
  BacktestMetricsExtended,
  EquityPoint,
  ModelComparison,
  ModelComparisonEntry,
  QuantSettings,
  ConfluenceWeights,
  Timestamp,
} from "../backend";
export {
  Direction,
  BacktestStatus,
  IndicatorSet,
  QuantModel,
  Timeframe,
} from "../backend";

/**
 * Run a backtest. Returns the full BacktestResult. Invalidates the history
 * query on success so the new run appears in the list.
 */
export function useRunBacktest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<BacktestResult, Error, BacktestConfig>({
    mutationFn: async (config) => {
      if (!actor) throw new Error("Actor not available");
      return actor.runBacktest(config);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["backtestHistory"] });
    },
  });
}

/**
 * List past backtest summaries.
 */
export function useBacktestHistory() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<BacktestSummary[]>({
    queryKey: ["backtestHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBacktestHistory();
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

/**
 * Fetch a single stored backtest result by id. Pass `null` to disable the
 * query (e.g. when no history item is selected).
 */
export function useBacktestResult(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<BacktestResult | null>({
    queryKey: ["backtestResult", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getBacktestResult(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    staleTime: 60_000,
  });
}

/**
 * Run a head-to-head comparison of all quant models (momentum, mean
 * reversion, pairs) over the same date range and capital. Returns per-model
 * win rate, Sharpe, max drawdown, and profit factor so the UI can render a
 * comparison table. Invalidates the backtest history query on success so any
 * cached comparison views refresh.
 *
 * The existing {@link useRunBacktest} continues to work — the
 * {@link BacktestConfig} it accepts now carries the extended fields
 * (`model`, `walkForwardSplit`, `includeRegimeBreakdown`, `pairsAssetId`)
 * which the frontend populates.
 */
export interface RunModelComparisonInput {
  assetId: AssetId;
  assetClass: AssetClass;
  pairsAssetId?: AssetId | null;
  timeframe: Timeframe;
  startDate: Timestamp;
  endDate: Timestamp;
  initialCapital: number;
  strategyParams: QuantSettings;
}

export function useRunModelComparison() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<ModelComparison, Error, RunModelComparisonInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Actor not available");
      return actor.runModelComparison(
        input.assetId,
        input.assetClass,
        input.pairsAssetId ?? null,
        input.timeframe,
        input.startDate,
        input.endDate,
        input.initialCapital,
        input.strategyParams,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["backtestHistory"] });
    },
  });
}
