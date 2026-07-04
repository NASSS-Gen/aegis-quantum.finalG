import Common "../types/common";
import QuantTypes "../types/quant";
import CalibrationLib "../lib/calibration";
import PredictionsLib "../lib/predictions";

mixin (
  store : CalibrationLib.CalibrationStore,
  predictionStore : PredictionsLib.PredictionStore,
) {
  // ─── Calibration table (optionally filtered, cached) ───────────────────
  // Returns the confidence calibration table computed from resolved
  // prediction outcomes, optionally filtered by asset class and timeframe.
  // The result is cached with a TTL keyed by the filter.
  public query func getCalibrationTable(
    assetClass : ?Text,
    timeframe : ?Common.Timeframe,
  ) : async QuantTypes.CalibrationTable {
    CalibrationLib.getCalibrationTable(store, predictionStore, assetClass, timeframe);
  };

  // ─── Calibrate a raw confidence value ─────────────────────────────────
  // Given a raw model confidence (0.0-1.0) and the current calibration table,
  // return the calibrated confidence with the matched bucket and any warning
  // (e.g. low sample count in the matched bucket).
  public query func calibrateConfidence(
    rawConfidence : Float,
    assetClass : ?Text,
    timeframe : ?Common.Timeframe,
  ) : async QuantTypes.CalibratedConfidence {
    let table = CalibrationLib.getCalibrationTable(store, predictionStore, assetClass, timeframe);
    CalibrationLib.calibrateConfidence(rawConfidence, table);
  };

  // ─── Auto-model selection ─────────────────────────────────────────────
  // Pick the best quant model for the given asset/timeframe based on recent
  // backtest out-of-sample win rates. Returns #auto when no backtest history
  // exists (falls back to the existing confluence strategy).
  public query func selectBestModel(
    assetId : Common.AssetId,
    timeframe : Common.Timeframe,
  ) : async Common.QuantModel {
    let table = CalibrationLib.getCalibrationTable(store, predictionStore, null, ?timeframe);
    CalibrationLib.selectBestModel(assetId, timeframe, table);
  };
};
