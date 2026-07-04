import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { QuantModel, createActor } from "../backend";
import type {
  ConfluenceResult,
  QuantSettings,
  SignalReportCard,
  TechnicalIndicators,
  VolatilityOverlay,
} from "../backend";
import { mapTimeframe } from "../lib/timeframe";

export type {
  ConfluenceResult,
  QuantSettings,
  SignalReportCard,
  TechnicalIndicators,
  VolatilityOverlay,
} from "../backend";
export { QuantModel } from "../backend";

/**
 * Fetch the user's QuantSettings (accountSize, maxRiskPercent, etc.) so signal
 * and volatility hooks pass real risk parameters to the backend instead of
 * hardcoded 100000 / 1. Cached for 60s and shared across all consumers via
 * the stable `quantSettings` query key.
 */
export function useQuantSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<QuantSettings>({
    queryKey: ["quantSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getQuantSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useTechnicalIndicators(
  assetId: string,
  timeframe: string,
  scope: "india" | "crypto" | "forex",
) {
  const { actor } = useActor(createActor);
  return useQuery<TechnicalIndicators>({
    queryKey: ["technicalIndicators", assetId, timeframe, scope],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getTechnicalIndicators(
        assetId,
        mapTimeframe(timeframe),
        scope,
      );
    },
    enabled: !!actor,
    staleTime: 30_000,
  });
}

export function useConfluenceResult(
  assetId: string,
  timeframe: string,
  scope: "india" | "crypto" | "forex",
) {
  const { actor } = useActor(createActor);
  return useQuery<ConfluenceResult>({
    queryKey: ["confluenceResult", assetId, timeframe, scope],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getConfluenceResult(assetId, mapTimeframe(timeframe), scope);
    },
    enabled: !!actor,
    staleTime: 30_000,
  });
}

/**
 * Signal report card. `accountSize` and `maxRiskPercent` are read from the
 * user's QuantSettings (via {@link useQuantSettings}) so position sizing
 * reflects the trader's real risk configuration rather than hardcoded
 * 100000 / 1. The query is disabled until QuantSettings are available.
 *
 * The optional `model` parameter (a {@link QuantModel} enum variant) lets the
 * caller request a signal from a specific quant model — momentum, mean
 * reversion, pairs, or auto. When omitted or `null`/`auto`, the backend
 * selects the best model automatically. The model is part of the query key
 * so switching models refetches without stale cache hits.
 *
 * The returned {@link SignalReportCard} now carries the extended quant-engine
 * fields: `model`, `modelSignal`, `volumeProfile`, `regimeAssessment`,
 * `calibratedConfidence`, and `honestDisclaimer`. Consumers read these
 * directly from the Candid shape — no manual remapping.
 */
export function useSignalReportCard(
  assetId: string,
  timeframe: string,
  scope: "india" | "crypto" | "forex",
  model?: QuantModel,
) {
  const { actor } = useActor(createActor);
  const { data: quantSettings } = useQuantSettings();
  const accountSize = quantSettings?.accountSize ?? 100000;
  const maxRiskPercent = quantSettings?.maxRiskPercent ?? 1;
  const effectiveModel = model ?? QuantModel.auto;
  return useQuery<SignalReportCard>({
    queryKey: [
      "signalReportCard",
      assetId,
      timeframe,
      scope,
      accountSize,
      maxRiskPercent,
      effectiveModel,
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getSignalReportCard(
        assetId,
        mapTimeframe(timeframe),
        scope,
        accountSize,
        maxRiskPercent,
        effectiveModel,
      );
    },
    enabled: !!actor && !!quantSettings,
    staleTime: 30_000,
  });
}

/**
 * Volatility overlay. Returns the backend {@link VolatilityOverlay} type
 * directly — no manual remapping — so the hook's generic matches the
 * regenerated bindings exactly. Consumers read `regimeLabel`, `atrValue`,
 * `riskAdjustedPositionSize`, `kellyFraction`, `maxDrawdownEstimate`, and
 * `recommendedLeverage` from the real Candid shape.
 */
export function useVolatilityOverlay(
  assetId: string,
  timeframe: string,
  scope: "india" | "crypto" | "forex",
  accountSize = 100000,
  maxRiskPercent = 1,
) {
  const { actor } = useActor(createActor);
  return useQuery<VolatilityOverlay>({
    queryKey: [
      "volatilityOverlay",
      assetId,
      timeframe,
      scope,
      accountSize,
      maxRiskPercent,
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getVolatilityOverlay(
        assetId,
        mapTimeframe(timeframe),
        scope,
        accountSize,
        maxRiskPercent,
      );
    },
    enabled: !!actor,
    staleTime: 30_000,
  });
}

/**
 * Alias of {@link useSignalReportCard} for the prediction view. Shares the
 * same QuantSettings-driven accountSize / maxRiskPercent so risk parameters
 * stay consistent across the app.
 */
export function usePrediction(
  assetId: string,
  timeframe: string,
  scope: "india" | "crypto" | "forex",
) {
  return useSignalReportCard(assetId, timeframe, scope);
}
