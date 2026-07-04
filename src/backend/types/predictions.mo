import OHLC "../types/marketData";
import Quant "../types/quant";
import Common "../types/common";
module {
  // ─── Technical Indicators ──────────────────────────────────────────────
  public type RSI = {
    value : Float;
    overbought : Bool;
    oversold : Bool;
  };

  public type MACD = {
    macdLine : Float;
    signalLine : Float;
    histogram : Float;
  };

  public type BollingerBands = {
    upper : Float;
    middle : Float;
    lower : Float;
    percentB : Float;
  };

  public type ATR = {
    value : Float;
  };

  public type Stochastic = {
    percentK : Float;
    percentD : Float;
    overbought : Bool;
    oversold : Bool;
  };

  public type VWAP = {
    value : Float;
    deviation : Float;
    upperBand : Float;
    lowerBand : Float;
  };

  public type CCI = {
    value : Float;
    overbought : Bool;
    oversold : Bool;
  };

  public type TechnicalIndicators = {
    rsi : RSI;
    macd : MACD;
    bollinger : BollingerBands;
    atr : ATR;
    stochastic : Stochastic;
    cci : CCI;
    vwap : VWAP;
  };

  // ─── Timeframe Confluence ──────────────────────────────────────────────
  // Timeframe is canonical in types/common.mo (re-exported here to keep
  // existing Predictions.Timeframe / Types.Timeframe imports working).
  public type Timeframe = Common.Timeframe;

  public type TimeframeVote = {
    timeframe : Timeframe;
    bias : Text; // "Bullish" | "Bearish" | "Neutral"
    strength : Nat; // 0-100
    keyLevel : Float;
    rsi : Float;
    macdSignal : Float;
    vwapDev : Float;
  };

  public type ConfluenceResult = {
    votes : [TimeframeVote];
    confluenceScore : Nat; // 0-100
    finalBias : Text;
    primaryTimeframe : Timeframe;
    weightedScore : Float;
  };

  // ─── Volatility Regime ───────────────────────────────────────────────────
  public type VolatilityRegime = {
    #LowVolatility;
    #Normal;
    #HighVolatility;
    #Extreme;
  };

  public type VolatilityOverlay = {
    regime : VolatilityRegime;
    regimeLabel : Text;
    riskAdjustedPositionSize : Float;
    kellyFraction : Float;
    maxDrawdownEstimate : Float;
    atrValue : Float;
    recommendedLeverage : Float;
  };

  // ─── Backtest & Signal Report ───────────────────────────────────────────
  public type BacktestMetrics = {
    winRate : Float; // 0.0-1.0
    avgReturn : Float;
    sharpeRatio : Float;
    maxDrawdown : Float;
    lookbackCandles : Nat;
  };

  public type SignalGrade = {
    #A; #B; #C; #D; #F;
  };

  // ─── QuantModel (re-exported from common.mo) ────────────────────────────
  // Canonical QuantModel lives in types/common.mo to break the
  // quant.mo <-> predictions.mo import cycle. Re-exported here so existing
  // `Predictions.QuantModel` imports keep working.
  public type QuantModel = Common.QuantModel;

  // ─── MarketRegime (re-exported from common.mo) ───────────────────────────
  public type MarketRegime = Common.MarketRegime;

  // ─── Model Direction ──────────────────────────────────────────────────
  // Direction suggested by a quant model. Maps onto the existing SignalType
  // at the prediction-record layer, but kept as a model-local variant so the
  // model layer does not depend on predictions.mo's SignalType (avoids an
  // import cycle). Canonical home for ModelDirection — types/models.mo is a
  // thin re-export shim.
  public type ModelDirection = {
    #long;
    #short;
    #neutral;
  };

  // ─── Model Signal ──────────────────────────────────────────────────────
  // A single model's directional call with model-specific metrics. The
  // metrics field carries model-specific context:
  //   - meanReversion: zScore (price vs mean in std-dev units)
  //   - momentum: slope (regression slope of recent returns)
  //   - pairs: spreadZScore (pair spread in std-dev units)
  //   - auto: the winning sub-model's metric, mirrored here
  // Canonical home for ModelSignal — types/models.mo is a thin re-export
  // shim so existing `Types.ModelSignal` imports keep working.
  public type ModelSignal = {
    model : QuantModel;
    direction : ModelDirection;
    confidence : Float; // 0.0-1.0
    entryPrice : Float;
    stopLoss : Float;
    takeProfit : Float;
    reasoning : Text;
    metrics : Text; // model-specific metric payload (zScore / slope / spreadZScore)
  };

  // ─── Volume Profile (OHLCV-derived) ─────────────────────────────────────
  // Volume profile reconstructed from OHLCV candles only — no Level-2 / DOM
  // feed. POC = point of control, VAH/VAL = value area high/low,
  // HVN/LVN = high/low-volume node price lists. Canonical home for the
  // volume-profile types — types/volume.mo is a thin re-export shim.
  public type VolumeBin = {
    price : Float; // bin midpoint price
    volume : Float; // total volume distributed into this bin
  };

  public type NodeClass = {
    #POC; // within 0.5% of the point of control
    #HVN; // within 0.5% of a high-volume node
    #LVN; // within 0.5% of a low-volume node
    #Other;
  };

  public type PricePosition = {
    #AboveVA; // close > value area high
    #InVA; // value area low <= close <= value area high
    #BelowVA; // close < value area low
  };

  public type VolumeNode = {
    price : Float;
    volume : Float;
    kind : Text; // "HVN" | "LVN"
  };

  public type VolumeProfile = {
    bins : [VolumeBin];
    binCount : Nat;
    minPrice : Float;
    maxPrice : Float;
    poc : Float; // point of control price (alias of pocPrice)
    pocVolume : Float;
    vah : Float; // value area high (70% of volume centered on POC)
    val : Float; // value area low
    hvnNodes : [VolumeNode]; // top 3 high-volume nodes
    lvnNodes : [VolumeNode]; // top 3 low-volume nodes
    buyPressure : Float; // 0.0-1.0 fraction of volume attributed to buyers
    sellPressure : Float; // 0.0-1.0 fraction of volume attributed to sellers
    totalVolume : Float;
    avgBinVolume : Float;
    nodeClass : NodeClass; // classification of the latest close
    pricePosition : PricePosition; // latest close vs value area
    latestClose : Float;
  };

  // ─── Regime Assessment ──────────────────────────────────────────────────
  // Adaptive regime detection result. Classifies the current market state
  // using ADX (trend strength), +DI/-DI (direction), ATR percentile
  // (volatility), and price vs EMA200 (direction bias). Confidence scales
  // with the strength of the driving signal; reasoning explains the
  // classification in plain text. Canonical home for RegimeAssessment —
  // types/regime.mo is a thin re-export shim.
  public type RegimeAssessment = {
    regime : MarketRegime;
    confidence : Float; // 0.0-1.0
    adx : Float; // ADX value (trend strength, direction-agnostic)
    plusDI : Float; // +DI (bullish directional indicator)
    minusDI : Float; // -DI (bearish directional indicator)
    atrPercentile : Float; // 0.0-100.0 percentile rank of current ATR
    priceVsEma200 : { #above; #below; #near };
    reasoning : Text;
  };

  // ─── Regime Strategy Weights (re-exported from quant.mo) ────────────────
  // Canonical home is types/quant.mo (alongside RegimePerformance and
  // RegimeHistoryEntry). Re-exported here so the predictions domain can
  // reference it without importing quant.mo directly.
  public type RegimeStrategyWeights = Quant.RegimeStrategyWeights;

  // ─── Calibration Types (re-exported from quant.mo) ─────────────────────
  // Calibration types live canonically in types/quant.mo (computed from
  // backtest results) and are re-exported here so the signal report card can
  // reference them without importing quant.mo directly.
  public type CalibrationBucket = Quant.CalibrationBucket;
  public type CalibrationTable = Quant.CalibrationTable;
  public type CalibratedConfidence = Quant.CalibratedConfidence;

  // ─── Signal Report Card (extended) ─────────────────────────────────────
  // Extended with model attribution, model signal, OHLCV volume profile,
  // regime assessment, calibrated confidence, and an honest disclaimer.
  public type SignalReportCard = {
    backtest : BacktestMetrics;
    grade : SignalGrade;
    expectedValue : Float; // in INR
    compositeConfidence : Nat; // 0-100
    reasoning : Text;
    bias : Text;
    riskRewardRatio : Float;
    recommendedPositionSize : Float;
    expectedMovePercent : Float;
    confluenceBreakdown : [TimeframeVote];
    regime : VolatilityRegime;
    regimeLabel : Text;
    keyLevels : [KeyLevel];
    // ── Engine-upgrade extensions ──────────────────────────────────────────
    model : QuantModel; // which model drove this signal
    modelSignal : ModelSignal; // the model's directional call + metrics
    volumeProfile : ?VolumeProfile; // null when OHLCV volume profile unavailable
    regimeAssessment : ?RegimeAssessment; // null when regime detection skipped
    calibratedConfidence : ?CalibratedConfidence; // null when no calibration table
    honestDisclaimer : Text; // e.g. "90% accuracy is a goal, not a promise"
  };

  // ─── Prediction History ──────────────────────────────────────────────────
  public type SignalType = {
    #BuyCall;
    #BuyPut;
    #BuyFutures;
    #Sell;
    #Hold;
  };

  public type Outcome = {
    #HitTarget;
    #HitStop;
    #Open;
  };

  public type KeyLevel = {
    name : Text;
    price : Float;
    kind : Text; // "entry" | "target" | "stop" | "vwap"
  };

  public type PredictionRecord = {
    id : Nat;
    timestamp : Nat;
    assetId : Text;
    assetClass : Text;
    timeframe : Timeframe;
    signal : SignalType;
    entryPrice : Float;
    targetPrice : Float;
    stopLoss : Float;
    confidence : Nat;
    grade : SignalGrade;
    resolvedAt : ?Nat;
    outcome : ?Outcome;
    pnl : ?Float;
  };

  // ─── Quant Settings (re-exported from types/quant.mo) ──────────────────
  // The canonical QuantSettings, IndicatorSet, and ConfluenceWeights now live
  // in types/quant.mo to eliminate schema drift. They are re-exported here so
  // existing `Predictions.QuantSettings` imports keep working.
  public type IndicatorSet = Quant.IndicatorSet;
  public type ConfluenceWeights = Quant.ConfluenceWeights;
  public type QuantSettings = Quant.QuantSettings;

  // ─── Filter & Stats ─────────────────────────────────────────────────────
  public type PredictionFilter = {
    assetId : ?Text;
    signalType : ?SignalType;
    grade : ?SignalGrade;
    timeframe : ?Timeframe;
    outcome : ?Outcome;
    startDate : ?Nat;
    endDate : ?Nat;
  };

  // Count of predictions per signal grade (A/B/C/D/F).
  public type GradeDistribution = {
    gradeA : Nat;
    gradeB : Nat;
    gradeC : Nat;
    gradeD : Nat;
    gradeF : Nat;
  };

  // Count of predictions per resolved outcome status.
  public type OutcomeBreakdown = {
    hitTarget : Nat;
    hitStop : Nat;
    open : Nat;
  };

  public type PredictionStats = {
    totalPredictions : Nat;
    resolvedCount : Nat;
    winRate : Float;
    avgRiskReward : Float;
    sharpeLikeRatio : Float;
    avgPnl : Float;
    bestTrade : Float;
    worstTrade : Float;
    gradeDistribution : GradeDistribution;
    outcomeBreakdown : OutcomeBreakdown;
  };
};
