import { BacktestingView, PracticeHeader } from "@/pages/PracticePage";

/**
 * Backtest section — standalone page at /backtest.
 *
 * Renders the Backtesting view: backtest configuration form, prior-run
 * history strip, and detailed results. PRACTICE ONLY — NO REAL MONEY.
 */
export default function BacktestPage() {
  return (
    <div className="flex flex-col gap-8" data-ocid="backtest.page">
      <PracticeHeader
        title="Backtest"
        description="Replay strategies against historical price data and inspect every trade, metric, and drawdown."
      />
      <BacktestingView />
    </div>
  );
}
