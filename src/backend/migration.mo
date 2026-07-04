// Stable-type migration for the Aegis Quantum canister.
//
// Adds required fields to BacktestConfig and BacktestMetricsExtended and
// introduces a new calibrationStore stable variable. Old actor state is
// transformed in-place; existing stores pass through unchanged.

import Array "mo:core/Array";
import Int "mo:core/Int";
import Types "types/quant";
import CommonTypes "types/common";

import PredictionsLib "lib/predictions";
import QuantLib "lib/quant";
import BacktestLib "lib/backtest";
import PracticeLib "lib/practice";
import SettingsLib "lib/settings";
import MarketDataLib "lib/marketData";
import CalibrationLib "lib/calibration";

module Migration {

  // ---------------------------------------------------------------------------
  // Old (pre-upgrade) inline types
  // ---------------------------------------------------------------------------

  public type OldBacktestConfig = {
    assetId : CommonTypes.AssetId;
    assetClass : CommonTypes.AssetClass;
    timeframe : CommonTypes.Timeframe;
    startDate : CommonTypes.Timestamp;
    endDate : CommonTypes.Timestamp;
    initialCapital : Float;
    runLabel : ?Text;
    strategyParams : Types.QuantSettings;
  };

  public type OldBacktestMetricsExtended = {
    totalReturn : Float;
    winRate : Float;
    sharpeRatio : Float;
    sortinoRatio : Float;
    maxDrawdown : Float;
    profitFactor : Float;
    averageWin : Float;
    averageLoss : Float;
    numberOfTrades : Nat;
  };

  public type OldBacktestResult = {
    config : OldBacktestConfig;
    equityCurve : [Types.EquityPoint];
    trades : [Types.BacktestTrade];
    metrics : OldBacktestMetricsExtended;
    runAt : CommonTypes.Timestamp;
  };

  public type OldBacktestStore = {
    var nextId : Nat;
    var results : [(Nat, OldBacktestResult)];
  };

  public type OldActor = {
    settingsStore : SettingsLib.SettingsStore;
    predictionStore : PredictionsLib.PredictionStore;
    quantStore : QuantLib.QuantStore;
    marketDataCache : MarketDataLib.MarketDataCache;
    backtestStore : OldBacktestStore;
    practiceStore : PracticeLib.PracticeStore;
  };

  // ---------------------------------------------------------------------------
  // New (post-upgrade) types — referenced from the canonical type modules
  // ---------------------------------------------------------------------------

  public type NewBacktestConfig = Types.BacktestConfig;
  public type NewBacktestMetricsExtended = Types.BacktestMetricsExtended;
  public type NewBacktestResult = Types.BacktestResult;
  public type NewBacktestSummary = Types.BacktestSummary;
  public type NewBacktestStore = BacktestLib.BacktestStore;

  public type NewActor = {
    settingsStore : SettingsLib.SettingsStore;
    predictionStore : PredictionsLib.PredictionStore;
    quantStore : QuantLib.QuantStore;
    marketDataCache : MarketDataLib.MarketDataCache;
    backtestStore : NewBacktestStore;
    practiceStore : PracticeLib.PracticeStore;
    calibrationStore : CalibrationLib.CalibrationStore;
  };

  // ---------------------------------------------------------------------------
  // Transformation
  // ---------------------------------------------------------------------------

  func migrateConfig(old : OldBacktestConfig) : NewBacktestConfig = {
    assetId = old.assetId;
    assetClass = old.assetClass;
    timeframe = old.timeframe;
    startDate = old.startDate;
    endDate = old.endDate;
    initialCapital = old.initialCapital;
    runLabel = old.runLabel;
    strategyParams = old.strategyParams;
    model = #auto;
    walkForwardSplit = 0.0;
    includeRegimeBreakdown = false;
    pairsAssetId = null;
  };

  func migrateMetrics(old : OldBacktestMetricsExtended) : NewBacktestMetricsExtended = {
    totalReturn = old.totalReturn;
    winRate = old.winRate;
    sharpeRatio = old.sharpeRatio;
    sortinoRatio = old.sortinoRatio;
    maxDrawdown = old.maxDrawdown;
    profitFactor = old.profitFactor;
    averageWin = old.averageWin;
    averageLoss = old.averageLoss;
    numberOfTrades = old.numberOfTrades;
    model = #auto;
    regimeBreakdown = null;
    outOfSampleWinRate = null;
    inSampleWinRate = null;
    calibrationTable = null;
  };

  func migrateResult(old : OldBacktestResult) : NewBacktestResult = {
    config = migrateConfig(old.config);
    equityCurve = old.equityCurve;
    trades = old.trades;
    metrics = migrateMetrics(old.metrics);
    runAt = old.runAt;
  };

  func migrateBacktestStore(old : OldBacktestStore) : NewBacktestStore = {
    var nextId = old.nextId;
    var results = old.results.map<(Nat, OldBacktestResult), (Nat, NewBacktestResult)>(
      func(entry : (Nat, OldBacktestResult)) : (Nat, NewBacktestResult) {
        (entry.0, migrateResult(entry.1));
      },
    );
  };

  public func run(old : OldActor) : NewActor = {
    settingsStore = old.settingsStore;
    predictionStore = old.predictionStore;
    quantStore = old.quantStore;
    marketDataCache = old.marketDataCache;
    backtestStore = migrateBacktestStore(old.backtestStore);
    practiceStore = old.practiceStore;
    calibrationStore = CalibrationLib.emptyStore();
  };

};
