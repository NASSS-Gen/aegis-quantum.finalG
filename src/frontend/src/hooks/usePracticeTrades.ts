import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Direction,
  type PracticeStats,
  type PracticeTrade,
  TradeStatus,
  createActor,
} from "../backend";

/**
 * Practice Arena domain hooks backed by the regenerated typed bindings.
 *
 * Mirrors the useBacktest.ts React Query pattern: queries for history/stats,
 * mutations for add/resolve that invalidate the practice history query on
 * success so the UI refreshes automatically.
 */

export type { PracticeTrade, PracticeStats } from "../backend";
export { Direction, TradeStatus } from "../backend";

export interface AddPracticeTradeInput {
  assetId: string;
  assetClass: string;
  scope: string;
  direction: Direction;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
}

export interface ResolvePracticeTradeInput {
  id: bigint;
  currentPrice: number;
}

const PRACTICE_HISTORY_KEY = ["practiceTradeHistory"] as const;
const PRACTICE_STATS_KEY = ["practiceTradeStats"] as const;

/**
 * List all practice trades (history). Returns an empty array while the actor
 * is still being fetched so consumers can render an empty state safely.
 */
export function usePracticeTrades() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<PracticeTrade[]>({
    queryKey: PRACTICE_HISTORY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPracticeTradeHistory();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

/**
 * Aggregate practice stats (totalTrades, wins, losses, winRate, pnl, etc.).
 */
export function usePracticeStats() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<PracticeStats>({
    queryKey: PRACTICE_STATS_KEY,
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPracticeTradeStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10_000,
  });
}

/**
 * Open a new practice trade. Invalidates the practice history and stats
 * queries on success so the new trade appears in the log immediately.
 */
export function useAddPracticeTrade() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<PracticeTrade, Error, AddPracticeTradeInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPracticeTrade(
        input.assetId,
        input.assetClass,
        input.scope,
        input.direction,
        input.entryPrice,
        input.targetPrice,
        input.stopLoss,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRACTICE_HISTORY_KEY });
      void queryClient.invalidateQueries({ queryKey: PRACTICE_STATS_KEY });
    },
  });
}

/**
 * Resolve an open practice trade against a current price. Returns the
 * resolved trade (with status Win/Loss and pnl) or null if it remained open.
 * Invalidates practice history and stats on success.
 */
export function useResolvePracticeTrade() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<PracticeTrade | null, Error, ResolvePracticeTradeInput>({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Actor not available");
      return actor.resolvePracticeTradeFromPrice(input.id, input.currentPrice);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PRACTICE_HISTORY_KEY });
      void queryClient.invalidateQueries({ queryKey: PRACTICE_STATS_KEY });
    },
  });
}
