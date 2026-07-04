import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import VarArray "mo:core/VarArray";
import Types "../types/regime";
import MarketDataTypes "../types/marketData";
import Common "../types/common";
import PredictionsLib "../lib/predictions";

module {
  // ─── Adaptive Regime Detection ─────────────────────────────────────────
  // Pure-Motoko regime classification from OHLC. No external libraries.
  // ATR is reused from lib/predictions.mo (PredictionsLib.getTechnicalIndicators
  // exposes the ATR via the technical-indicators bundle); ADX uses standard
  // Wilder smoothing.

  // Standard Wilder ADX: measures trend strength (direction-agnostic). +DI and
  // -DI give direction. Smoothed over `period` candles (default 14).
  // Returns (adx, plusDI, minusDI).
  public func computeADX(ohlc : [MarketDataTypes.OHLC], period : Nat) : (Float, Float, Float) {
    let n = ohlc.size();
    // Need at least 2*period+1 candles for a stable Wilder smoothing + ADX
    // average. With less data we degrade gracefully to a neutral (0,0,0).
    if (n < period * 2 + 1 or period == 0) {
      return (0.0, 0.0, 0.0);
    };

    // Step 1: compute true range, +DM, -DM for every candle from index 1.
    let len = n - 1;
    let trs = VarArray.repeat(0.0, len);
    let plusDMs = VarArray.repeat(0.0, len);
    let minusDMs = VarArray.repeat(0.0, len);
    var i = 1;
    while (i < n) {
      let up = ohlc[i].high - ohlc[i - 1].high;
      let down = ohlc[i - 1].low - ohlc[i].low;
      let plusDM = if (up > down and up > 0.0) up else 0.0;
      let minusDM = if (down > up and down > 0.0) down else 0.0;
      let tr1 = ohlc[i].high - ohlc[i].low;
      let tr2 = Float.abs(ohlc[i].high - ohlc[i - 1].close);
      let tr3 = Float.abs(ohlc[i].low - ohlc[i - 1].close);
      let tr = Float.max(tr1, Float.max(tr2, tr3));
      trs[i - 1] := tr;
      plusDMs[i - 1] := plusDM;
      minusDMs[i - 1] := minusDM;
      i += 1;
    };

    // Step 2: Wilder smoothing. First smoothed value = sum of first `period`
    // raw values. Subsequent smoothed values = prev - (prev / period) + current.
    let periodF = Float.fromInt64(period.toInt64());
    var trSum = 0.0;
    var plusDMSum = 0.0;
    var minusDMSum = 0.0;
    var k = 0;
    while (k < period) {
      trSum += trs[k];
      plusDMSum += plusDMs[k];
      minusDMSum += minusDMs[k];
      k += 1;
    };
    var smoothedTR = trSum;
    var smoothedPlusDM = plusDMSum;
    var smoothedMinusDM = minusDMSum;

    // Step 3: rolling +DI, -DI, DX. We keep the latest smoothed values and the
    // last `period` DX values to average into ADX (Wilder's standard ADX is a
    // smoothed average of DX).
    let dxValues = VarArray.repeat(0.0, len - period + 1);
    var dxCount = 0;
    var plusDI = 0.0;
    var minusDI = 0.0;
    var j = period;
    while (j < len) {
      smoothedTR := smoothedTR - (smoothedTR / periodF) + trs[j];
      smoothedPlusDM := smoothedPlusDM - (smoothedPlusDM / periodF) + plusDMs[j];
      smoothedMinusDM := smoothedMinusDM - (smoothedMinusDM / periodF) + minusDMs[j];
      plusDI := if (smoothedTR == 0.0) 0.0 else (smoothedPlusDM / smoothedTR) * 100.0;
      minusDI := if (smoothedTR == 0.0) 0.0 else (smoothedMinusDM / smoothedTR) * 100.0;
      let diSum = plusDI + minusDI;
      let dx = if (diSum == 0.0) 0.0 else (Float.abs(plusDI - minusDI) / diSum) * 100.0;
      dxValues[dxCount] := dx;
      dxCount += 1;
      j += 1;
    };

    if (dxCount == 0) {
      return (0.0, plusDI, minusDI);
    };

    // Step 4: ADX = Wilder-smoothed average of DX. First ADX = simple average
    // of the first `period` DX values; subsequent ADX values use the same
    // Wilder recurrence.
    if (dxCount < period) {
      // Not enough DX samples for a full ADX smoothing window — fall back to
      // the simple average of available DX values.
      var sum = 0.0;
      var m = 0;
      while (m < dxCount) {
        sum += dxValues[m];
        m += 1;
      };
      let adx = sum / Float.fromInt64(dxCount.toInt64());
      (adx, plusDI, minusDI);
    } else {
      var dxSum = 0.0;
      var m = 0;
      while (m < period) {
        dxSum += dxValues[m];
        m += 1;
      };
      var adx = dxSum / periodF;
      var p = period;
      while (p < dxCount) {
        adx := (adx * (periodF - 1.0) + dxValues[p]) / periodF;
        p += 1;
      };
      (adx, plusDI, minusDI);
    };
  };

  // ATR percentile: compute ATR over the lookback, then compute the percentile
  // rank of the current ATR relative to the last 100 periods. Returns a value
  // in [0.0, 100.0]. High percentile (>80) = volatile.
  public func computeATRPercentile(ohlc : [MarketDataTypes.OHLC]) : Float {
    let n = ohlc.size();
    if (n < 15) { return 0.0 };

    // Reuse PredictionsLib.getTechnicalIndicators which computes ATR over the
    // full window with a 14-period Wilder smoothing. The "current" ATR is the
    // ATR computed over the entire window.
    let indicators = PredictionsLib.getTechnicalIndicators(ohlc);
    let currentATR = indicators.atr.value;
    if (currentATR == 0.0) { return 0.0 };

    // Compute a rolling 14-period ATR over each trailing window of the last
    // 100 candles, then rank the current ATR against that population.
    let windowSize : Nat = 100;
    let atrPeriod : Nat = 14;
    let start = if (n > windowSize) n - windowSize else 0;
    var count = 0;
    var below = 0;
    var idx = start;
    while (idx < n) {
      // Need at least atrPeriod+1 candles for a meaningful ATR.
      if (idx >= atrPeriod + 1) {
        let sliceEnd = idx + 1;
        let slice = Array.tabulate(sliceEnd, func(k) = ohlc[k]);
        let sliceIndicators = PredictionsLib.getTechnicalIndicators(slice);
        let historicalATR = sliceIndicators.atr.value;
        count += 1;
        if (currentATR > historicalATR) { below += 1 };
      };
      idx += 1;
    };

    if (count == 0) { 0.0 } else {
      (Float.fromInt64(below.toInt64()) / Float.fromInt64(count.toInt64())) * 100.0;
    };
  };

  // Price vs EMA200: classify the last close relative to a 200-period EMA.
  // 'above' if close > EMA200 * 1.005, 'below' if close < EMA200 * 0.995,
  // 'near' otherwise.
  public func classifyPriceVsEma200(ohlc : [MarketDataTypes.OHLC]) : { #above; #below; #near } {
    let n = ohlc.size();
    if (n == 0) { return #near };
    let period : Nat = 200;
    let effectivePeriod = if (n < period) n else period;
    let multiplier = 2.0 / (Float.fromInt64(effectivePeriod.toInt64()) + 1.0);
    var ema = ohlc[0].close;
    var i = 1;
    while (i < n) {
      ema := (ohlc[i].close - ema) * multiplier + ema;
      i += 1;
    };
    let close = ohlc[n - 1].close;
    if (close > ema * 1.005) { #above }
    else if (close < ema * 0.995) { #below }
    else { #near };
  };

  // Classify the current market state as #trendingUp, #trendingDown,
  // #ranging, or #volatile using the rules:
  //   (1) ATR percentile > 80 → #volatile (regardless of ADX).
  //   (2) ADX > 25 and price above EMA200 → #trendingUp.
  //   (3) ADX > 25 and price below EMA200 → #trendingDown.
  //   (4) ADX <= 20 or mixed → #ranging.
  //   (5) ADX between 20 and 25 → tie-break via price-vs-EMA200:
  //       above → weak #trendingUp, below → weak #trendingDown, near → #ranging.
  // Confidence scales with the driving signal:
  //   trending: ADX 25→0.5, 50→0.95.
  //   volatile: ATR percentile 80→0.5, 100→0.95.
  //   ranging: (25 - ADX) / 25 → ADX 0→0.95, ADX 20→0.2.
  public func detectRegime(ohlc : [MarketDataTypes.OHLC]) : Types.RegimeAssessment {
    let (adx, plusDI, minusDI) = computeADX(ohlc, 14);
    let atrPercentile = computeATRPercentile(ohlc);
    let priceVsEma200 = classifyPriceVsEma200(ohlc);

    // Linear interpolation helper: maps x in [x0, x1] to [y0, y1], clamped.
    func lerp(x : Float, x0 : Float, x1 : Float, y0 : Float, y1 : Float) : Float {
      if (x1 == x0) { return y0 };
      let t = (x - x0) / (x1 - x0);
      let clamped = if (t < 0.0) 0.0 else if (t > 1.0) 1.0 else t;
      y0 + (y1 - y0) * clamped;
    };

    // Rule (1): ATR percentile > 80 → #volatile.
    if (atrPercentile > 80.0) {
      let confidence = lerp(atrPercentile, 80.0, 100.0, 0.5, 0.95);
      let reasoning = "Volatile regime: ATR percentile " # atrPercentile.toInt().toText() #
        "% (>80 threshold). ADX " # adx.toInt().toText() # ", +DI " # plusDI.toInt().toText() #
        ", -DI " # minusDI.toInt().toText() # ". Reducing position size and favoring pairs strategy.";
      return {
        regime = #volatile;
        confidence = confidence;
        adx = adx;
        plusDI = plusDI;
        minusDI = minusDI;
        atrPercentile = atrPercentile;
        priceVsEma200 = priceVsEma200;
        reasoning = reasoning;
      };
    };

    // Rule (2)/(3): ADX > 25 → trending, direction from price-vs-EMA200.
    if (adx > 25.0) {
      let confidence = lerp(adx, 25.0, 50.0, 0.5, 0.95);
      switch (priceVsEma200) {
        case (#above) {
          let reasoning = "Trending up: ADX " # adx.toInt().toText() #
            " (>25) with price above EMA200. +DI " # plusDI.toInt().toText() #
            " vs -DI " # minusDI.toInt().toText() # ". Favoring momentum strategy.";
          return {
            regime = #trendingUp;
            confidence = confidence;
            adx = adx;
            plusDI = plusDI;
            minusDI = minusDI;
            atrPercentile = atrPercentile;
            priceVsEma200 = priceVsEma200;
            reasoning = reasoning;
          };
        };
        case (#below) {
          let reasoning = "Trending down: ADX " # adx.toInt().toText() #
            " (>25) with price below EMA200. +DI " # plusDI.toInt().toText() #
            " vs -DI " # minusDI.toInt().toText() # ". Favoring momentum strategy.";
          return {
            regime = #trendingDown;
            confidence = confidence;
            adx = adx;
            plusDI = plusDI;
            minusDI = minusDI;
            atrPercentile = atrPercentile;
            priceVsEma200 = priceVsEma200;
            reasoning = reasoning;
          };
        };
        case (#near) {
          // ADX strong but price near EMA200 — treat as ranging with a
          // directional lean from +DI/-DI.
          let regime = if (plusDI > minusDI) #trendingUp else #trendingDown;
          let reasoning = "Trending (near EMA200): ADX " # adx.toInt().toText() #
            " (>25), price near EMA200. Direction inferred from +DI " # plusDI.toInt().toText() #
            " vs -DI " # minusDI.toInt().toText() # ".";
          return {
            regime = regime;
            confidence = confidence;
            adx = adx;
            plusDI = plusDI;
            minusDI = minusDI;
            atrPercentile = atrPercentile;
            priceVsEma200 = priceVsEma200;
            reasoning = reasoning;
          };
        };
      };
    };

    // Rule (5): ADX between 20 and 25 → tie-break via price-vs-EMA200.
    if (adx > 20.0 and adx <= 25.0) {
      let confidence = lerp(adx, 25.0, 50.0, 0.5, 0.95) * 0.7; // weak trend
      switch (priceVsEma200) {
        case (#above) {
          let reasoning = "Weak trending up: ADX " # adx.toInt().toText() #
            " (20-25 band) with price above EMA200. Low-confidence trend; momentum favored with reduced size.";
          return {
            regime = #trendingUp;
            confidence = confidence;
            adx = adx;
            plusDI = plusDI;
            minusDI = minusDI;
            atrPercentile = atrPercentile;
            priceVsEma200 = priceVsEma200;
            reasoning = reasoning;
          };
        };
        case (#below) {
          let reasoning = "Weak trending down: ADX " # adx.toInt().toText() #
            " (20-25 band) with price below EMA200. Low-confidence trend; momentum favored with reduced size.";
          return {
            regime = #trendingDown;
            confidence = confidence;
            adx = adx;
            plusDI = plusDI;
            minusDI = minusDI;
            atrPercentile = atrPercentile;
            priceVsEma200 = priceVsEma200;
            reasoning = reasoning;
          };
        };
        case (#near) {
          // Falls through to ranging below.
        };
      };
    };

    // Rule (4): ADX <= 20 or mixed → #ranging.
    let confidence = lerp(25.0 - adx, 0.0, 25.0, 0.2, 0.95);
    let clampedConfidence = if (confidence < 0.0) 0.0 else if (confidence > 0.95) 0.95 else confidence;
    let reasoning = "Ranging regime: ADX " # adx.toInt().toText() #
      " (<=20 or mixed). ATR percentile " # atrPercentile.toInt().toText() #
      "%. Favoring mean-reversion strategy.";
    {
      regime = #ranging;
      confidence = clampedConfidence;
      adx = adx;
      plusDI = plusDI;
      minusDI = minusDI;
      atrPercentile = atrPercentile;
      priceVsEma200 = priceVsEma200;
      reasoning = reasoning;
    };
  };

  // Walk back through the last `lookback` candles and classify the regime at
  // each, returning a timestamped regime history strip.
  public func getRegimeHistory(ohlc : [MarketDataTypes.OHLC], lookback : Nat) : [Types.RegimeHistoryEntry] {
    let n = ohlc.size();
    if (n == 0 or lookback == 0) { return [] };

    let effectiveLookback = if (lookback > n) n else lookback;
    let start = n - effectiveLookback;
    var entries : [Types.RegimeHistoryEntry] = [];
    var i = start;
    while (i < n) {
      // Classify the regime using the OHLC window ending at candle i
      // (inclusive). Slice the array up to and including index i.
      let slice = Array.tabulate(i + 1, func(k) = ohlc[k]);
      let assessment = detectRegime(slice);
      let entry : Types.RegimeHistoryEntry = {
        timestamp = ohlc[i].timestamp;
        regime = assessment.regime;
      };
      entries := entries.concat([entry]);
      i += 1;
    };
    entries;
  };

  // Strategy weighting adapter: returns per-regime strategy weights plus a
  // position-size multiplier.
  //   #trendingUp / #trendingDown → momentum 0.6, meanReversion 0.2, pairs 0.2.
  //   #ranging → meanReversion 0.6, momentum 0.2, pairs 0.2.
  //   #volatile → meanReversion 0.3, momentum 0.2, pairs 0.5, sizeMultiplier 0.5.
  public func getRegimeStrategyWeights(regime : Common.MarketRegime) : Types.RegimeStrategyWeights {
    switch (regime) {
      case (#trendingUp) {
        { meanReversion = 0.2; momentum = 0.6; pairs = 0.2; sizeMultiplier = 1.0 };
      };
      case (#trendingDown) {
        { meanReversion = 0.2; momentum = 0.6; pairs = 0.2; sizeMultiplier = 1.0 };
      };
      case (#ranging) {
        { meanReversion = 0.6; momentum = 0.2; pairs = 0.2; sizeMultiplier = 1.0 };
      };
      case (#volatile) {
        { meanReversion = 0.3; momentum = 0.2; pairs = 0.5; sizeMultiplier = 0.5 };
      };
    };
  };
};
