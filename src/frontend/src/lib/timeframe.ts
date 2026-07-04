import { Timeframe } from "../backend";

/**
 * Single source of truth for mapping UI timeframe strings (e.g. "15M",
 * "1H", "DAILY") to the backend {@link Timeframe} enum variants.
 *
 * Previously two divergent tables lived in `useMarketData.ts` and
 * `usePredictionHistory.ts` with different key sets (one supported M1/W1,
 * the other supported 5M but not M1). This shared table is the union of
 * both so every hook maps timeframes identically and drift cannot recur.
 */
export const TIMEFRAME_MAP: Record<string, Timeframe> = {
  M1: Timeframe.M1,
  "5M": Timeframe.M5,
  M5: Timeframe.M5,
  "15M": Timeframe.M15,
  M15: Timeframe.M15,
  "30M": Timeframe.M30,
  M30: Timeframe.M30,
  "1H": Timeframe.H1,
  H1: Timeframe.H1,
  "4H": Timeframe.H4,
  H4: Timeframe.H4,
  DAILY: Timeframe.D1,
  D1: Timeframe.D1,
  "1D": Timeframe.D1,
  W1: Timeframe.W1,
  "1W": Timeframe.W1,
};

/** Default fallback when a timeframe string is unrecognized. */
export const DEFAULT_TIMEFRAME = Timeframe.M15;

/**
 * Map a UI timeframe string to the backend {@link Timeframe} enum.
 * Falls back to {@link DEFAULT_TIMEFRAME} when the key is unknown.
 */
export function mapTimeframe(tf: string): Timeframe {
  return TIMEFRAME_MAP[tf] ?? DEFAULT_TIMEFRAME;
}
