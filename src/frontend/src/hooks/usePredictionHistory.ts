import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  Outcome,
  type PredictionFilter,
  type PredictionRecord,
  type PredictionStats,
  type SignalGrade,
  type SignalType,
  createActor,
} from "../backend";
import { mapTimeframe } from "../lib/timeframe";

export type {
  Outcome,
  PredictionFilter,
  PredictionRecord,
  PredictionStats,
  SignalGrade,
  SignalType,
} from "../backend";

const PREDICTION_HISTORY_KEY = "predictionHistory";
const PREDICTION_STATS_KEY = "predictionStats";

export interface PredictionHistoryFilters {
  assetId?: string;
  signalType?: SignalType;
  grade?: SignalGrade;
  timeframe?: string;
  outcome?: Outcome;
  startDate?: string;
  endDate?: string;
}

function dateToBigInt(dateStr: string): bigint | undefined {
  if (!dateStr) return undefined;
  const ms = new Date(dateStr).getTime();
  if (Number.isNaN(ms)) return undefined;
  return BigInt(ms) * 1000000n;
}

function buildFilter(filters: PredictionHistoryFilters): PredictionFilter {
  const filter: PredictionFilter = {};
  if (filters.assetId) filter.assetId = filters.assetId;
  if (filters.signalType) filter.signalType = filters.signalType;
  if (filters.grade) filter.grade = filters.grade;
  if (filters.timeframe) filter.timeframe = mapTimeframe(filters.timeframe);
  if (filters.outcome) filter.outcome = filters.outcome;
  const start = dateToBigInt(filters.startDate ?? "");
  const end = dateToBigInt(filters.endDate ?? "");
  if (start !== undefined) filter.startDate = start;
  if (end !== undefined) filter.endDate = end;
  return filter;
}

/**
 * Prediction history + stats, migrated from manual useState/useEffect to
 * React Query for consistency with {@link useBacktest} and
 * {@link usePracticeTrades}. Filters are applied via the backend
 * `getFilteredPredictionHistory` endpoint; stats come from
 * `getPredictionStats`. Mutations (add / resolve / manual-resolve /
 * resolve-from-price) invalidate both queries on success so the UI refreshes
 * automatically.
 *
 * The returned object preserves the legacy field names (`history`, `stats`,
 * `loading`, `error`, `applyFilters`, `clearFilters`, `refresh`,
 * `addPrediction`, `resolvePrediction`, `manualResolve`, `resolveFromPrice`)
 * so existing consumers do not need to change.
 */
export function usePredictionHistory() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [activeFilters, setActiveFilters] = useState<PredictionHistoryFilters>(
    {},
  );

  const historyQuery = useQuery<PredictionRecord[]>({
    queryKey: [PREDICTION_HISTORY_KEY, activeFilters],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFilteredPredictionHistory(buildFilter(activeFilters));
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });

  const statsQuery = useQuery<PredictionStats>({
    queryKey: [PREDICTION_STATS_KEY],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPredictionStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [PREDICTION_HISTORY_KEY] });
    void queryClient.invalidateQueries({ queryKey: [PREDICTION_STATS_KEY] });
  }, [queryClient]);

  const addPredictionMutation = useMutation<
    bigint,
    Error,
    {
      assetId: string;
      signal: SignalType;
      entryPrice: number;
      targetPrice: number;
      stopLoss: number;
      confidence?: number;
      grade?: SignalGrade;
      timeframe: string;
      assetClass: string;
    }
  >({
    mutationFn: async (params) => {
      if (!actor) throw new Error("Actor not available");
      const record: PredictionRecord = {
        id: 0n,
        grade: (params.grade ?? "C") as SignalGrade,
        confidence: BigInt(Math.round(params.confidence ?? 50)),
        timestamp: BigInt(Date.now()) * 1000000n,
        assetId: params.assetId,
        signal: params.signal,
        entryPrice: params.entryPrice,
        targetPrice: params.targetPrice,
        stopLoss: params.stopLoss,
        outcome: Outcome.Open,
        pnl: 0,
        assetClass: params.assetClass,
        timeframe: mapTimeframe(params.timeframe),
      };
      return actor.addPredictionRecord(record);
    },
    onSuccess: () => invalidateAll(),
  });

  const resolvePredictionMutation = useMutation<
    void,
    Error,
    { id: bigint; outcome: Outcome; pnl: number }
  >({
    mutationFn: async ({ id, outcome, pnl }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.resolvePredictionOutcome(id, outcome, pnl);
    },
    onSuccess: () => invalidateAll(),
  });

  const manualResolveMutation = useMutation<
    boolean,
    Error,
    { id: bigint; outcome: Outcome; pnl: number }
  >({
    mutationFn: async ({ id, outcome, pnl }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.manualResolvePredictionOutcome(id, outcome, pnl);
    },
    onSuccess: () => invalidateAll(),
  });

  const resolveFromPriceMutation = useMutation<
    { id: bigint; outcome: Outcome; pnl: number } | null,
    Error,
    { id: bigint; scope: string }
  >({
    mutationFn: async ({ id, scope }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.resolvePredictionFromPrice(id, scope);
      if (!result) return null;
      const [newId, outcome, pnl] = result;
      return { id: newId, outcome, pnl };
    },
    onSuccess: () => invalidateAll(),
  });

  const applyFilters = useCallback((filters: PredictionHistoryFilters) => {
    setActiveFilters(filters);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const refresh = useCallback(() => {
    invalidateAll();
  }, [invalidateAll]);

  const addPrediction = useCallback(
    (params: {
      assetId: string;
      signal: SignalType;
      entryPrice: number;
      targetPrice: number;
      stopLoss: number;
      confidence?: number;
      grade?: SignalGrade;
      timeframe: string;
      assetClass: string;
    }) => {
      return addPredictionMutation.mutateAsync(params);
    },
    [addPredictionMutation],
  );

  const resolvePrediction = useCallback(
    (id: bigint, outcome: Outcome, pnl: number) => {
      return resolvePredictionMutation.mutateAsync({ id, outcome, pnl });
    },
    [resolvePredictionMutation],
  );

  const manualResolve = useCallback(
    (id: bigint, outcome: Outcome, pnl: number) => {
      return manualResolveMutation.mutateAsync({ id, outcome, pnl });
    },
    [manualResolveMutation],
  );

  const resolveFromPrice = useCallback(
    (id: bigint, scope: string) => {
      return resolveFromPriceMutation.mutateAsync({ id, scope });
    },
    [resolveFromPriceMutation],
  );

  const loading =
    historyQuery.isLoading ||
    statsQuery.isLoading ||
    addPredictionMutation.isPending ||
    resolvePredictionMutation.isPending ||
    manualResolveMutation.isPending ||
    resolveFromPriceMutation.isPending;

  const error =
    historyQuery.error?.message ??
    statsQuery.error?.message ??
    addPredictionMutation.error?.message ??
    resolvePredictionMutation.error?.message ??
    manualResolveMutation.error?.message ??
    resolveFromPriceMutation.error?.message ??
    null;

  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const stats = statsQuery.data ?? null;

  return {
    history,
    stats,
    loading,
    error,
    activeFilters,
    addPrediction,
    resolvePrediction,
    manualResolve,
    resolveFromPrice,
    applyFilters,
    clearFilters,
    refresh,
  };
}
