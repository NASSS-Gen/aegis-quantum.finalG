import Common "./common";

module {
  // ─── Indicator Set ──────────────────────────────────────────────────────
  public type IndicatorSet = {
    #Minimal;
    #Full;
  };

  // ─── Confluence Weights ────────────────────────────────────────────────
  // Canonical confluence weighting across the four standard timeframes plus
  // the legacy lower/selected/higher buckets. Both types/quant.mo and
  // types/predictions.mo reference this single definition.
  public type ConfluenceWeights = {
    lowerTimeframe : Nat;
    selectedTimeframe : Nat;
    higherTimeframe : Nat;
    m15 : Nat;
    h1 : Nat;
    h4 : Nat;
    d1 : Nat;
  };

  // ─── Quant Settings (canonical) ────────────────────────────────────────
  // Single source of truth for quant configuration. types/predictions.mo
  // re-exports this as Predictions.QuantSettings so existing imports keep
  // working without schema drift.
  public type QuantSettings = {
    indicatorSet : IndicatorSet;
    confluenceWeights : ConfluenceWeights;
    maxRiskPercent : Float;
    accountSize : Float;
    backtestLookback : Nat;
    useVWAP : Bool;
    useRegimeFilter : Bool;
    minConfidence : Nat;
  };

  // ─── QuantModel (re-exported from common.mo) ────────────────────────────
  // Canonical QuantModel lives in types/common.mo to break the
  // quant.mo <-> predictions.mo import cycle. Re-exported here so existing
  // `Quant.QuantModel` imports keep working.
  public type QuantModel = Common.QuantModel;

  // ─── MarketRegime (re-exported from common.mo) ───────────────────────────
  public type MarketRegime = Common.MarketRegime;

  // ─── Backtesting Engine Types ──────────────────────────────────────────

  // Direction of a single backtest trade.
  public type BacktestDirection = {
    #Long;
    #Short;
  };

  // Status of a stored backtest run.
  public type BacktestStatus = {
    #Completed;
    #Failed;
    #Partial;
  };

  // Configuration for a single backtest run.
  public type BacktestConfig = {
    assetId : Common.AssetId;
    assetClass : Common.AssetClass;
    timeframe : Common.Timeframe;
    startDate : Common.Timestamp;
    endDate : Common.Timestamp;
    initialCapital : Float;
    runLabel : ?Text;
    strategyParams : QuantSettings;
    // ── Engine-upgrade extensions ──────────────────────────────────────────
    model : QuantModel; // which model drove this run
    walkForwardSplit : Float; // out-of-sample fraction, e.g. 0.3
    includeRegimeBreakdown : Bool; // emit per-regime performance
    pairsAssetId : ?Common.AssetId; // second asset for #pairs model; null otherwise
  };

  // A single executed trade within a backtest run.
  public type BacktestTrade = {
    entryTimestamp : Common.Timestamp;
    exitTimestamp : Common.Timestamp;
    direction : BacktestDirection;
    entryPrice : Float;
    exitPrice : Float;
    returnPercent : Float; // trade return as a fraction, e.g. 0.025 = +2.5%
    holdingPeriod : Nat; // number of candles held
    pnl : Float; // absolute P&L in account currency
  };

  // A single point on the equity curve.
  public type EquityPoint = {
    timestamp : Common.Timestamp;
    equity : Float;
    drawdown : Float; // current drawdown from peak, as a fraction (>= 0.0)
  };

  // ─── Calibration Types ─────────────────────────────────────────────────
  // Confidence calibration: maps raw model confidence to realized win rate
  // so the stated confidence matches historical accuracy. Lives in quant.mo
  // because it is computed from backtest results and reused by the signal
  // report card (predictions.mo re-exports it).

  public type CalibrationBucket = {
    minConfidence : Float;
    maxConfidence : Float;
    sampleCount : Nat;
    realizedWinRate : Float; // 0.0-1.0
    reliabilityGrade : Text; // "A" | "B" | "C" | "insufficient"
    reliabilityFactor : Float; // weight applied to calibrated confidence
  };

  public type CalibrationTable = {
    buckets : [CalibrationBucket];
    totalSamples : Nat;
    lastUpdated : Common.Timestamp;
    disclaimer : Text;
  };

  public type CalibratedConfidence = {
    rawConfidence : Float;
    calibratedConfidence : Float;
    bucket : CalibrationBucket;
    isCalibrated : Bool;
    warning : Text; // non-empty when sampleCount < 20
  };

  // ─── Regime Performance (per-regime backtest breakdown) ─────────────────
  public type RegimePerformance = {
    regime : MarketRegime;
    winRate : Float; // 0.0-1.0
    tradeCount : Nat;
  };

  // ─── Regime History ────────────────────────────────────────────────────
  // A timestamped regime state used to reconstruct the last N regime states
  // for trend/range analysis and visualization.
  public type RegimeHistoryEntry = {
    timestamp : Common.Timestamp;
    regime : MarketRegime;
  };

  // ─── Regime Strategy Weights ────────────────────────────────────────────
  // Strategy weighting adapter output. The three model weights always sum to
  // 1.0; sizeMultiplier scales overall position size (e.g. 0.5 in volatile
  // regimes). Canonical home — types/regime.mo is a thin re-export shim.
  public type RegimeStrategyWeights = {
    meanReversion : Float;
    momentum : Float;
    pairs : Float;
    sizeMultiplier : Float;
  };

  // Comprehensive metrics for a backtest run. Extends the legacy
  // Predictions.BacktestMetrics (winRate/avgReturn/sharpe/maxDrawdown) with
  // Sortino, profit factor, average win/loss, trade count, model attribution,
  // regime breakdown, and walk-forward in/out-of-sample win rates.
  public type BacktestMetricsExtended = {
    totalReturn : Float; // cumulative return as a fraction
    winRate : Float; // 0.0-1.0
    sharpeRatio : Float;
    sortinoRatio : Float;
    maxDrawdown : Float; // as a fraction (>= 0.0)
    profitFactor : Float; // gross profit / gross loss
    averageWin : Float; // average return on winning trades
    averageLoss : Float; // average return on losing trades (<= 0.0)
    numberOfTrades : Nat;
    // ── Engine-upgrade extensions ──────────────────────────────────────────
    model : QuantModel; // which model produced these metrics
    regimeBreakdown : ?[RegimePerformance]; // null when includeRegimeBreakdown = false
    outOfSampleWinRate : ?Float; // walk-forward out-of-sample win rate (0.0-1.0)
    inSampleWinRate : ?Float; // walk-forward in-sample win rate (0.0-1.0)
    calibrationTable : ?CalibrationTable; // confidence calibration derived from this run
  };

  // Full result of a backtest run.
  public type BacktestResult = {
    config : BacktestConfig;
    equityCurve : [EquityPoint];
    trades : [BacktestTrade];
    metrics : BacktestMetricsExtended;
    runAt : Common.Timestamp;
  };

  // Stored backtest summary for persistence and later review without
  // re-running the engine. The full BacktestResult is referenced by id.
  public type BacktestSummary = {
    id : Nat;
    config : BacktestConfig;
    metrics : BacktestMetricsExtended;
    status : BacktestStatus;
    runAt : Common.Timestamp;
    tradeCount : Nat;
    runLabel : ?Text;
  };

  // ─── Model Comparison ──────────────────────────────────────────────────
  // Side-by-side comparison of all QuantModel variants over the same
  // asset/timeframe/date range, used to pick the best model per regime.
  public type ModelComparisonEntry = {
    model : QuantModel;
    winRate : Float; // 0.0-1.0
    sharpe : Float;
    maxDrawdown : Float; // as a fraction (>= 0.0)
    profitFactor : Float;
    totalTrades : Nat;
    outOfSampleWinRate : ?Float; // walk-forward out-of-sample win rate (0.0-1.0)
  };

  public type ModelComparison = {
    assetId : Common.AssetId;
    timeframe : Common.Timeframe;
    dateRange : Text; // human-readable, e.g. "2021-01-01..2025-01-01"
    results : [ModelComparisonEntry];
  };
};
