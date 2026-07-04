import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  AssetClass,
  AssetId,
  CalibratedConfidence,
  CalibrationTable,
  MarketRegime,
  ModelComparison,
  QuantModel,
  QuantSettings,
  RegimeAssessment,
  RegimeHistoryEntry,
  RegimeStrategyWeights,
  Timeframe,
  Timestamp,
  VolumeProfile,
} from "../backend";

/**
 * Quant Engine domain hooks backed by the regenerated typed bindings.
 *
 * Wraps the 9 new backend methods exposed by the upgraded quant engine:
 * calibration, model selection, regime detection, regime strategy weights,
 * volume profile, and model comparison. Mirrors the React Query pattern used
 * in {@link useMarketData} and {@link useBacktest}: queries for read-only
 * state with sensible staleTime, mutations for write operations that
 * invalidate dependent queries on success.
 *
 * Types are re-exported from the generated `../backend` module so consumers
 * import the exact Candid shapes (bigint timestamps, enum variants, optional
 * fields) rather than hand-rolled approximations.
 */

export type {
  AssetClass,
  AssetId,
  CalibrationTable,
  CalibratedConfidence,
  ModelComparison,
  RegimeAssessment,
  RegimeHistoryEntry,
  RegimeStrategyWeights,
  VolumeProfile,
} from "../backend";
export { MarketRegime, QuantModel, Timeframe } from "../backend";

/**
 * Fetch the confidence calibration table, optionally narrowed by asset class
 * and/or timeframe. Cached for 60s because the table only changes when new
 * backtest outcomes land. Pass `null` for either filter to request the global
 * table across all asset classes / timeframes.
 */
export function useCalibrationTable(
  assetClass?: string | null,
  timeframe?: Timeframe | null,
) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<CalibrationTable>({
    queryKey: ["calibrationTable", assetClass ?? "all", timeframe ?? "all"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCalibrationTable(assetClass ?? null, timeframe ?? null);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

/**
 * Calibrate a raw confidence value against the backend's historical
 * realized-win-rate buckets. Returns the calibrated confidence plus the
 * matched bucket and a reliability warning when sample size is too small.
 * Pass `null` for either filter to calibrate against the global table.
 */
export function useCalibratedConfidence() {
  const { actor } = useActor(createActor);

  return useMutation<
    CalibratedConfidence,
    Error,
    {
      rawConfidence: number;
      assetClass?: string | null;
      timeframe?: Timeframe | null;
    }
  >({
    mutationFn: async ({ rawConfidence, assetClass, timeframe }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.calibrateConfidence(
        rawConfidence,
        assetClass ?? null,
        timeframe ?? null,
      );
    },
  });
}

/**
 * Ask the backend to pick the best-performing quant model (momentum, mean
 * reversion, pairs, or auto) for a given asset + timeframe. Cached for 60s
 * because model selection is driven by backtest history that changes slowly.
 */
export function useSelectBestModel(assetId: AssetId, timeframe: Timeframe) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<QuantModel>({
    queryKey: ["selectBestModel", assetId, timeframe],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.selectBestModel(assetId, timeframe);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

/**
 * Detect the current market regime (trendingUp / trendingDown / volatile /
 * ranging) for an asset + scope. Cached for 30s — regime shifts are
 * meaningful but not second-by-second.
 */
export function useDetectRegime(assetId: string, scope: string) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<RegimeAssessment>({
    queryKey: ["detectRegime", assetId, scope],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.detectRegime(assetId, scope);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/**
 * Fetch the recent regime history for an asset + scope. `lookback` is the
 * number of candles to look back. Cached for 30s.
 */
export function useRegimeHistory(
  assetId: string,
  scope: string,
  lookback: bigint,
) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<RegimeHistoryEntry[]>({
    queryKey: ["regimeHistory", assetId, scope, lookback.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRegimeHistory(assetId, scope, lookback);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/**
 * Fetch the strategy-weighting profile for a given regime. The backend uses
 * these weights (momentum / meanReversion / pairs / sizeMultiplier) to tilt
 * the ensemble toward the strategies that historically perform best in that
 * regime. Cached for 30s.
 */
export function useRegimeStrategyWeights(regime: MarketRegime) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<RegimeStrategyWeights>({
    queryKey: ["regimeStrategyWeights", regime],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getRegimeStrategyWeights(regime);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/**
 * Fetch the OHLCV-derived volume profile (POC, VAH, VAL, HVN/LVN nodes, buy /
 * sell pressure) for an asset + scope. `binCount` is optional — the backend
 * applies a sensible default when omitted. Cached for 30s.
 *
 * Note: this is volume profile estimated from OHLCV bars only. True Level-2
 * order-flow depth is intentionally out of scope for this build.
 */
export function useVolumeProfile(
  assetId: string,
  scope: string,
  binCount?: bigint,
) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<VolumeProfile>({
    queryKey: [
      "volumeProfile",
      assetId,
      scope,
      binCount?.toString() ?? "default",
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getVolumeProfile(assetId, scope);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/**
 * Run a head-to-head comparison of all quant models (momentum, mean
 * reversion, pairs) over the same date range and capital. Returns per-model
 * win rate, Sharpe, max drawdown, and profit factor so the UI can render a
 * comparison table. Invalidates the backtest history query on success so any
 * cached comparison views refresh.
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
