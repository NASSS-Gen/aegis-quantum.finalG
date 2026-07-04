import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import QuantTypes "../types/quant";
import PredictionsTypes "../types/predictions";
import PredictionsLib "predictions";

module {
  // ─── Calibration store ─────────────────────────────────────────────────
  // Caches computed CalibrationTables keyed by a filter signature (assetClass
  // + timeframe) with a TTL in seconds. The composition task wires this as a
  // new stable variable in main.mo.
  public type CalibrationStore = {
    var cache : [(Text, QuantTypes.CalibrationTable)]; // key -> table
    var timestamps : [(Text, Nat)]; // key -> last-updated epoch seconds
  };

  public func emptyStore() : CalibrationStore {
    { var cache = []; var timestamps = [] };
  };

  // TTL (in seconds) for cached calibration tables. After this many seconds
  // the cache entry is considered stale and recomputed from prediction history.
  public let cacheTtlSeconds : Nat = 300;

  // ─── Bucket boundaries ─────────────────────────────────────────────────
  // Five confidence buckets: [50-60), [60-70), [70-80), [80-90), [90-100].
  // The last bucket is inclusive of 100; all others are half-open [lo, hi).
  private let bucketBounds : [(Float, Float)] = [
    (0.50, 0.60),
    (0.60, 0.70),
    (0.70, 0.80),
    (0.80, 0.90),
    (0.90, 1.01), // 1.01 so 1.00 falls in the last bucket
  ];

  private func bucketMidpoint(lo : Float, hi : Float) : Float {
    (lo + hi) / 2.0;
  };

  // Find the bucket index containing a confidence value (0.0-1.0). Returns
  // null when the value is outside the calibrated range (< 0.50).
  private func bucketIndexOf(confidence : Float) : ?Nat {
    if (confidence < 0.50) { return null };
    var i = 0;
    while (i < bucketBounds.size()) {
      let (lo, hi) = bucketBounds[i];
      if (confidence >= lo and confidence < hi) { return ?i };
      i += 1;
    };
    if (confidence >= 1.0) { ?(bucketBounds.size() - 1) } else { null };
  };

  // ─── Calibration table computation ─────────────────────────────────────
  // Bucket resolved predictions by stated confidence into 5 buckets:
  // [50-60), [60-70), [70-80), [80-90), [90-100]. For each bucket compute
  // sampleCount, realizedWinRate (wins / (wins + losses), excluding breakeven),
  // reliabilityGrade, and reliabilityFactor (realizedWinRate / bucketMidpoint).
  public func computeCalibrationTable(
    records : [PredictionsTypes.PredictionRecord],
  ) : QuantTypes.CalibrationTable {
    // Per-bucket accumulators: wins, losses, count. Breakeven (pnl == 0.0) is
    // excluded from both the numerator and the denominator of realizedWinRate.
    // Mutable arrays so we can increment per-bucket counters in place.
    let wins = [var 0, 0, 0, 0, 0];
    let losses = [var 0, 0, 0, 0, 0];
    let counts = [var 0, 0, 0, 0, 0];

    var i = 0;
    while (i < records.size()) {
      let r = records[i];
      // Only resolved predictions contribute (outcome != null). #Open is not
      // a resolved terminal state — skip both. Use a guard flag so we don't
      // fall through to the bucketing logic for skipped records.
      var skip = false;
      switch (r.outcome) {
        case null { skip := true };
        case (?o) {
          switch (o) {
            case (#Open) { skip := true };
            case _ {};
          };
        };
      };
      if (not skip) {
        // Stated confidence is stored as Nat 0-100; convert to 0.0-1.0.
        let conf = Float.fromInt64(r.confidence.toInt64()) / 100.0;
        switch (bucketIndexOf(conf)) {
          case null {};
          case (?idx) {
            counts[idx] += 1;
            let pnl = switch (r.pnl) {
              case (?p) p;
              case null 0.0;
            };
            if (pnl > 0.0) {
              wins[idx] += 1;
            } else if (pnl < 0.0) {
              losses[idx] += 1;
            };
            // pnl == 0.0 (breakeven) is excluded from wins+losses denominator.
          };
        };
      };
      i += 1;
    };

    var buckets : [QuantTypes.CalibrationBucket] = [];
    var b = 0;
    while (b < bucketBounds.size()) {
      let (lo, hi) = bucketBounds[b];
      let mid = bucketMidpoint(lo, if (hi > 1.0) 1.0 else hi);
      let sampleCount = counts[b];
      let denom = wins[b] + losses[b];
      let realizedWinRate = if (denom == 0) 0.0
        else Float.fromInt64(wins[b].toInt64()) / Float.fromInt64(denom.toInt64());
      let reliabilityFactor = if (mid == 0.0) 0.0 else realizedWinRate / mid;
      let reliabilityGrade = gradeFor(sampleCount, realizedWinRate, mid);
      buckets := buckets.concat([{
        minConfidence = lo;
        maxConfidence = if (hi > 1.0) 1.0 else hi;
        sampleCount = sampleCount;
        realizedWinRate = realizedWinRate;
        reliabilityGrade = reliabilityGrade;
        reliabilityFactor = reliabilityFactor;
      }]);
      b += 1;
    };

    var totalSamples = 0;
    var t = 0;
    while (t < counts.size()) {
      totalSamples += counts[t];
      t += 1;
    };

    {
      buckets = buckets;
      totalSamples = totalSamples;
      lastUpdated = Int.abs(Time.now());
      disclaimer = "No system guarantees profit. Calibrated confidence reflects historical win rate, not future certainty.";
    };
  };

  // Reliability grade:
  //   'A' if sampleCount >= 50 AND |realizedWinRate - midpoint| < 0.05
  //   'B' if sampleCount >= 30 AND |realizedWinRate - midpoint| < 0.10
  //   'C' if sampleCount >= 20
  //   'insufficient' if sampleCount < 20
  private func gradeFor(sampleCount : Nat, realizedWinRate : Float, midpoint : Float) : Text {
    if (sampleCount < 20) { return "insufficient" };
    let diff = Float.abs(realizedWinRate - midpoint);
    if (sampleCount >= 50 and diff < 0.05) { "A" }
    else if (sampleCount >= 30 and diff < 0.10) { "B" }
    else { "C" };
  };

  // ─── Confidence calibration ────────────────────────────────────────────
  // Find the bucket containing rawConfidence. If the bucket has < 20 samples,
  // return isCalibrated=false with the raw confidence unchanged and a warning.
  // Otherwise calibratedConfidence = clamp(rawConfidence * reliabilityFactor, 0, 1)
  // with isCalibrated=true and an empty warning. The matched bucket is included.
  public func calibrateConfidence(
    rawConfidence : Float,
    table : QuantTypes.CalibrationTable,
  ) : QuantTypes.CalibratedConfidence {
    let idx = bucketIndexOf(rawConfidence);
    switch (idx) {
      case null {
        // Confidence below the calibrated range — return uncalibrated with a
        // synthetic empty bucket so the caller still gets a well-formed record.
        let empty : QuantTypes.CalibrationBucket = {
          minConfidence = 0.0;
          maxConfidence = 0.50;
          sampleCount = 0;
          realizedWinRate = 0.0;
          reliabilityGrade = "insufficient";
          reliabilityFactor = 0.0;
        };
        {
          rawConfidence = rawConfidence;
          calibratedConfidence = rawConfidence;
          bucket = empty;
          isCalibrated = false;
          warning = "Uncalibrated — confidence below calibrated range (min 50%). Confidence not adjusted.";
        };
      };
      case (?i) {
        let bucket = table.buckets[i];
        if (bucket.sampleCount < 20) {
          {
            rawConfidence = rawConfidence;
            calibratedConfidence = rawConfidence;
            bucket = bucket;
            isCalibrated = false;
            warning = "Uncalibrated — low sample count (" # bucket.sampleCount.toText() #
              " samples in this bucket). Confidence not adjusted.";
          };
        } else {
          let calibrated = clamp01(rawConfidence * bucket.reliabilityFactor);
          {
            rawConfidence = rawConfidence;
            calibratedConfidence = calibrated;
            bucket = bucket;
            isCalibrated = true;
            warning = "";
          };
        };
      };
    };
  };

  private func clamp01(x : Float) : Float {
    if (x < 0.0) 0.0 else if (x > 1.0) 1.0 else x;
  };

  // ─── Filtered calibration table with caching ───────────────────────────
  // Fetch resolved predictions from the prediction history store (optionally
  // filtered by asset class and timeframe), compute the table, cache it with
  // a TTL keyed by the filter, and return. The disclaimer field is always
  // the standard no-guarantee notice.
  public func getCalibrationTable(
    store : CalibrationStore,
    predictionStore : PredictionsLib.PredictionStore,
    assetClass : ?Text,
    timeframe : ?Common.Timeframe,
  ) : QuantTypes.CalibrationTable {
    let key = filterKey(assetClass, timeframe);
    let now = Int.abs(Time.now());
    // Check the cache for a fresh entry.
    var ci = 0;
    while (ci < store.cache.size()) {
      let (k, table) = store.cache[ci];
      if (k == key) {
        var ts = 0;
        var ti = 0;
        while (ti < store.timestamps.size()) {
          let (tk, tv) = store.timestamps[ti];
          if (tk == key) { ts := tv };
          ti += 1;
        };
        if (now - ts < cacheTtlSeconds) {
          return table;
        };
      };
      ci += 1;
    };

    // Cache miss or stale — recompute from resolved prediction history.
    let resolved = PredictionsLib.getFilteredPredictionHistory(
      predictionStore,
      {
        assetId = null;
        signalType = null;
        grade = null;
        timeframe = timeframe;
        outcome = null;
        startDate = null;
        endDate = null;
      },
    ).filter(func(r) {
      // Apply the asset-class filter (prediction records carry an assetClass
      // text field) on top of the timeframe filter already applied above.
      switch (assetClass) {
        case null true;
        case (?ac) r.assetClass == ac;
      };
    });

    let table = computeCalibrationTable(resolved);
    cachePut(store, key, table, now);
    table;
  };

  // Build a deterministic cache key from the optional filter dimensions.
  private func filterKey(assetClass : ?Text, timeframe : ?Common.Timeframe) : Text {
    let acText = switch (assetClass) {
      case null "all";
      case (?ac) ac;
    };
    let tfText = switch (timeframe) {
      case null "all";
      case (?tf) timeframeToText(tf);
    };
    acText # "|" # tfText;
  };

  private func timeframeToText(tf : Common.Timeframe) : Text {
    switch (tf) {
      case (#M1) "M1";
      case (#M5) "M5";
      case (#M15) "M15";
      case (#M30) "M30";
      case (#H1) "H1";
      case (#H4) "H4";
      case (#D1) "D1";
      case (#W1) "W1";
    };
  };

  // Insert or replace a cache entry and its timestamp atomically.
  private func cachePut(
    store : CalibrationStore,
    key : Text,
    table : QuantTypes.CalibrationTable,
    now : Nat,
  ) {
    var newCache : [(Text, QuantTypes.CalibrationTable)] = [];
    var newTs : [(Text, Nat)] = [];
    var found = false;
    var i = 0;
    while (i < store.cache.size()) {
      let (k, _) = store.cache[i];
      if (k == key) {
        newCache := newCache.concat([(k, table)]);
        found := true;
      } else {
        newCache := newCache.concat([store.cache[i]]);
      };
      i += 1;
    };
    if (not found) {
      newCache := newCache.concat([(key, table)]);
    };
    var j = 0;
    while (j < store.timestamps.size()) {
      let (k, _) = store.timestamps[j];
      if (k == key) {
        newTs := newTs.concat([(k, now)]);
      } else {
        newTs := newTs.concat([store.timestamps[j]]);
      };
      j += 1;
    };
    if (not found) {
      newTs := newTs.concat([(key, now)]);
    };
    store.cache := newCache;
    store.timestamps := newTs;
  };

  // ─── Auto-model selection helper ──────────────────────────────────────
  // Look at recent backtest results for this asset/timeframe across the 4
  // models and pick the one with the highest out-of-sample win rate. If no
  // backtest history exists, return #auto (falls back to the confluence
  // strategy). Simple argmax, not online learning.
  //
  // NOTE: The fixed public signature (assetId, timeframe, table) does not
  // receive a BacktestStore, so this function cannot inspect backtest history
  // directly. The calibration table alone does not carry per-model backtest
  // win rates. The honest implementation given the available inputs is to
  // return #auto — the documented fallback when no backtest history is
  // accessible. A future signature change could inject the BacktestStore to
  // enable true argmax selection.
  public func selectBestModel(
    assetId : Common.AssetId,
    timeframe : Common.Timeframe,
    table : QuantTypes.CalibrationTable,
  ) : Common.QuantModel {
    ignore (assetId, timeframe, table);
    #auto;
  };
};
