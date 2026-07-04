import PracticePage from "@/pages/PracticePage";

/**
 * Practice Arena section — standalone page at /practice-arena.
 *
 * Renders the Paper Trading view (live chart, paper trade panel, outcome
 * tracker, trade history). PRACTICE ONLY — NO REAL MONEY.
 *
 * The Backtesting and Risk Management views live on their own dedicated
 * routes (/backtest, /risk).
 */
export default function PracticeArenaPage() {
  return <PracticePage />;
}
