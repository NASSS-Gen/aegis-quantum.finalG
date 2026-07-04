import Types "../types/predictions";
import Common "../types/common";
import PredictionsLib "../lib/predictions";
import MarketDataLib "../lib/marketData";
import MarketDataTypes "../types/marketData";
import QuantLib "../lib/quant";
import ModelsLib "../lib/models";
import VolumeLib "../lib/volumeProfile";
import RegimeLib "../lib/regime";
import CalibrationLib "../lib/calibration";
import BacktestLib "../lib/backtest";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  store : PredictionsLib.PredictionStore,
  cache : MarketDataLib.MarketDataCache,
  transform : OutCall.Transform,
  calibrationStore : CalibrationLib.CalibrationStore,
  backtestStore : BacktestLib.BacktestStore,
) {
  public shared func getTechnicalIndicators(
    assetId : Text,
    timeframe : Types.Timeframe,
    scope : Text,
  ) : async Types.TechnicalIndicators {
    let ohlcResult = if (scope == "india") {
      await MarketDataLib.fetchIndianStockOHLC(transform, cache, assetId, "1mo");
    } else if (scope == "forex") {
      await MarketDataLib.fetchForexOHLC(transform, cache, assetId, "USD", 30);
    } else {
      await MarketDataLib.fetchCryptoOHLC(transform, cache, assetId, 30);
    };
    let ohlc = switch (ohlcResult) {
      case (#Ok(data)) data;
      case (#Err(_)) [];
    };
    PredictionsLib.getTechnicalIndicators(ohlc);
  };

  public shared func getConfluenceResult(
    assetId : Text,
    selectedTimeframe : Types.Timeframe,
    scope : Text,
  ) : async Types.ConfluenceResult {
    let ohlcResult = if (scope == "india") {
      await MarketDataLib.fetchIndianStockOHLC(transform, cache, assetId, "1mo");
    } else if (scope == "forex") {
      await MarketDataLib.fetchForexOHLC(transform, cache, assetId, "USD", 30);
    } else {
      await MarketDataLib.fetchCryptoOHLC(transform, cache, assetId, 30);
    };
    let ohlc = switch (ohlcResult) {
      case (#Ok(data)) data;
      case (#Err(_)) [];
    };
    PredictionsLib.getConfluenceResult(ohlc, selectedTimeframe);
  };

  // ─── Extended Signal Report Card ────────────────────────────────────────
  // Engine-upgrade pipeline:
  //   (1) Accept an optional model parameter (null → #auto).
  //   (2) If #auto, call selectBestModel using the calibration table.
  //   (3) Generate the model signal via lib/models.mo.
  //   (4) Compute the OHLCV volume profile and adjust confidence.
  //   (5) Detect the regime and apply strategy weights.
  //   (6) Calibrate the confidence via lib/calibration.mo.
  //   (7) Return the extended SignalReportCard with all new fields populated.
  public shared func getSignalReportCard(
    assetId : Text,
    timeframe : Types.Timeframe,
    scope : Text,
    accountSize : Float,
    maxRiskPercent : Float,
    model : ?Types.QuantModel,
  ) : async Types.SignalReportCard {
    let ohlcResult = if (scope == "india") {
      await MarketDataLib.fetchIndianStockOHLC(transform, cache, assetId, "1mo");
    } else if (scope == "forex") {
      await MarketDataLib.fetchForexOHLC(transform, cache, assetId, "USD", 30);
    } else {
      await MarketDataLib.fetchCryptoOHLC(transform, cache, assetId, 30);
    };
    let ohlc = switch (ohlcResult) {
      case (#Ok(data)) data;
      case (#Err(_)) [];
    };

    // Base card (populates the legacy fields + neutral extension defaults).
    let base = PredictionsLib.getSignalReportCard(ohlc, timeframe, accountSize, maxRiskPercent);

    // (1) Resolve the requested model. null defaults to #auto.
    let requestedModel = switch (model) {
      case (?m) m;
      case null #auto;
    };

    // (2) If #auto, pick the best model from the calibration table. The
    //     calibration table is filtered by asset class (derived from scope)
    //     and the selected timeframe.
    let assetClass = scopeToAssetClass(scope);
    let calibrationTable = CalibrationLib.getCalibrationTable(
      calibrationStore,
      store,
      ?assetClass,
      ?timeframe,
    );
    let selectedModel : Types.QuantModel = switch (requestedModel) {
      case (#auto) CalibrationLib.selectBestModel(assetId, timeframe, calibrationTable);
      case other other;
    };

    // (3) Generate the model signal. Use the default quant settings — the
    //     caller's per-principal settings are not wired here to keep the
    //     report card a pure function of the market data + model selection.
    let settings = QuantLib.defaultSettings;
    let modelSignal = ModelsLib.generateModelSignal(selectedModel, ohlc, null, settings);

    // (4) Compute the OHLCV volume profile and adjust the model confidence
    //     for volume pressure. Skip when OHLC is empty.
    let volumeProfile : ?Types.VolumeProfile = if (ohlc.size() > 0) {
      let vp = VolumeLib.computeVolumeProfile(ohlc, VolumeLib.defaultBinCount);
      ?vp;
    } else {
      null;
    };
    let volumeAdjustedConfidence = switch (volumeProfile) {
      case (?vp) {
        let dirText = switch (modelSignal.direction) {
          case (#long) "long";
          case (#short) "short";
          case (#neutral) "neutral";
        };
        VolumeLib.adjustConfidenceForVolume(modelSignal.confidence, dirText, vp);
      };
      case null modelSignal.confidence;
    };

    // (5) Detect the regime and apply strategy weights. The size multiplier
    //     scales the recommended position size; the model weights inform the
    //     reasoning text. Skip when OHLC is empty.
    let regimeAssessment : ?Types.RegimeAssessment = if (ohlc.size() > 0) {
      ?RegimeLib.detectRegime(ohlc);
    } else {
      null;
    };
    let strategyWeights = switch (regimeAssessment) {
      case (?ra) RegimeLib.getRegimeStrategyWeights(ra.regime);
      case null {
        // Neutral default weights when regime detection is skipped.
        { meanReversion = 0.34; momentum = 0.33; pairs = 0.33; sizeMultiplier = 1.0 };
      };
    };

    // (6) Calibrate the volume-adjusted confidence against the calibration
    //     table. The calibrated confidence replaces the raw model confidence
    //     in the report card when calibration is available.
    let calibrated = CalibrationLib.calibrateConfidence(volumeAdjustedConfidence, calibrationTable);

    // (7) Build the extended report card. The composite confidence (0-100)
    //     is derived from the calibrated confidence when isCalibrated=true,
    //     otherwise it falls back to the base composite confidence.
    let calibratedConfidenceNat : Nat = if (calibrated.isCalibrated) {
      Int.abs(Float.toInt(calibrated.calibratedConfidence * 100.0));
    } else {
      base.compositeConfidence;
    };
    let compositeConfidence = if (calibratedConfidenceNat > 100) 100 else calibratedConfidenceNat;

    // Scale the recommended position size by the regime size multiplier.
    let scaledPositionSize = base.recommendedPositionSize * strategyWeights.sizeMultiplier;

    // Enrich the reasoning with the model, regime, and calibration context.
    let modelText = switch (selectedModel) {
      case (#auto) "auto";
      case (#meanReversion) "meanReversion";
      case (#momentum) "momentum";
      case (#pairs) "pairs";
    };
    let regimeText = switch (regimeAssessment) {
      case (?ra) ra.reasoning;
      case null "Regime detection skipped (insufficient data).";
    };
    let calibrationText = if (calibrated.isCalibrated) {
      "Calibrated confidence " # Float.toInt(calibrated.calibratedConfidence * 100.0).toText() # "% (matched bucket " # calibrated.bucket.reliabilityGrade # ", " # calibrated.bucket.sampleCount.toText() # " samples).";
    } else {
      "Confidence not calibrated: " # calibrated.warning;
    };
    let volumeText = switch (volumeProfile) {
      case (?vp) "Volume profile: POC " # vp.poc.toText() # ", buy pressure " # vp.buyPressure.toText() # ", sell pressure " # vp.sellPressure.toText() # ".";
      case null "Volume profile unavailable.";
    };
    let enrichedReasoning = base.reasoning # " " #
      "Model: " # modelText # ". " #
      regimeText # " " #
      volumeText # " " #
      calibrationText;

    {
      base with
      model = selectedModel;
      modelSignal = modelSignal;
      volumeProfile = volumeProfile;
      regimeAssessment = regimeAssessment;
      calibratedConfidence = ?calibrated;
      compositeConfidence = compositeConfidence;
      recommendedPositionSize = scaledPositionSize;
      reasoning = enrichedReasoning;
    };
  };

  public shared func getVolatilityOverlay(
    assetId : Text,
    timeframe : Types.Timeframe,
    scope : Text,
    accountSize : Float,
    maxRiskPercent : Float,
  ) : async Types.VolatilityOverlay {
    let ohlcResult = if (scope == "india") {
      await MarketDataLib.fetchIndianStockOHLC(transform, cache, assetId, "1mo");
    } else if (scope == "forex") {
      await MarketDataLib.fetchForexOHLC(transform, cache, assetId, "USD", 30);
    } else {
      await MarketDataLib.fetchCryptoOHLC(transform, cache, assetId, 30);
    };
    let ohlc = switch (ohlcResult) {
      case (#Ok(data)) data;
      case (#Err(_)) [];
    };
    PredictionsLib.getVolatilityOverlay(ohlc, accountSize, maxRiskPercent);
  };

  public query func getPredictionHistory() : async [Types.PredictionRecord] {
    PredictionsLib.getPredictionHistory(store);
  };

  public query func getFilteredPredictionHistory(filter : Types.PredictionFilter) : async [Types.PredictionRecord] {
    PredictionsLib.getFilteredPredictionHistory(store, filter);
  };

  public query func getPredictionStats() : async Types.PredictionStats {
    PredictionsLib.getPredictionStats(store);
  };

  public shared func addPredictionRecord(record : Types.PredictionRecord) : async Nat {
    PredictionsLib.addPredictionRecord(store, record);
  };

  public shared func resolvePredictionOutcome(
    id : Nat,
    outcome : Types.Outcome,
    pnl : Float,
  ) : async () {
    PredictionsLib.resolvePredictionOutcome(store, id, outcome, pnl);
  };

  // Automatic price-based resolution: fetches the latest OHLC for the
  // prediction's asset and resolves the outcome from the most recent close.
  public shared func resolvePredictionFromPrice(
    id : Nat,
    scope : Text,
  ) : async ?(Nat, Types.Outcome, Float) {
    let found = store.records.find(func(r) { r.id == id });
    switch (found) {
      case null { null };
      case (?r) {
        let ohlcResult = if (scope == "india") {
          await MarketDataLib.fetchIndianStockOHLC(transform, cache, r.assetId, "1mo");
        } else if (scope == "forex") {
          await MarketDataLib.fetchForexOHLC(transform, cache, r.assetId, "USD", 30);
        } else {
          await MarketDataLib.fetchCryptoOHLC(transform, cache, r.assetId, 30);
        };
        let currentPrice = switch (ohlcResult) {
          case (#Ok(data)) if (data.size() > 0) { data[data.size() - 1].close } else { 0.0 };
          case (#Err(_)) 0.0;
        };
        if (currentPrice == 0.0) { null }
        else { PredictionsLib.resolveFromPrice(store, id, currentPrice) };
      };
    };
  };

  // Manual outcome override for predictions that need human judgment beyond
  // automatic price-based resolution. Returns true if the record was found
  // and updated, false otherwise.
  public shared func manualResolvePredictionOutcome(
    id : Nat,
    outcome : Types.Outcome,
    pnl : Float,
  ) : async Bool {
    PredictionsLib.manualResolvePredictionOutcome(store, id, outcome, pnl);
  };

  // Map a scope token to the asset-class label used by the calibration
  // table filter. "india" → "india", "forex" → "forex", anything else →
  // "crypto" (the default market-data scope).
  func scopeToAssetClass(scope : Text) : Text {
    if (scope == "india") { "india" }
    else if (scope == "forex") { "forex" }
    else { "crypto" };
  };
};
