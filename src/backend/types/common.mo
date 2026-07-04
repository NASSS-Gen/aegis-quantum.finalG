module {
  // ─── Cross-cutting shared types ─────────────────────────────────────────
  // Canonical aliases used across the quant, predictions, and backtesting
  // domains. Domain modules re-export or reference these to avoid drift.

  public type Timestamp = Nat;

  public type AssetId = Text;

  public type AssetClass = Text;

  // ─── Timeframe ──────────────────────────────────────────────────────────
  // Canonical Timeframe variant. Lives in common.mo to break the
  // quant.mo <-> predictions.mo import cycle. types/predictions.mo re-exports
  // it as Predictions.Timeframe so existing imports keep working.
  public type Timeframe = {
    #M1; #M5; #M15; #M30; #H1; #H4; #D1; #W1;
  };

  // ─── Result ─────────────────────────────────────────────────────────────
  public type Result<T, E> = {
    #Ok : T;
    #Err : E;
  };

  // ─── QuantModel ─────────────────────────────────────────────────────────
  // Canonical model selector variant. Lives in common.mo to break the
  // quant.mo <-> predictions.mo import cycle (ModelSignal in predictions.mo
  // references QuantModel, and BacktestConfig in quant.mo references it too).
  // Both types/quant.mo and types/predictions.mo re-export this so existing
  // imports keep working without schema drift.
  public type QuantModel = {
    #auto;
    #meanReversion;
    #momentum;
    #pairs;
  };

  // ─── MarketRegime ───────────────────────────────────────────────────────
  // Canonical regime variant. Lives in common.mo so both quant.mo
  // (RegimePerformance, RegimeHistoryEntry) and predictions.mo
  // (RegimeAssessment) can reference it without an import cycle.
  public type MarketRegime = {
    #trendingUp;
    #trendingDown;
    #ranging;
    #volatile;
  };
};
