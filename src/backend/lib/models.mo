import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

import MarketDataTypes "../types/marketData";
import PredictionsLib "../lib/predictions";
import QuantTypes "../types/quant";
import Types "../types/models";

module {
  // ─── Quant model signal generators ──────────────────────────────────────
  // Each generator takes OHLC[] (and for pairs, two OHLC[] arrays) plus a
  // QuantSettings and returns a ModelSignal. The dispatcher
  // (generateModelSignal) routes to the correct generator based on the
  // QuantModel variant. For #auto, return a neutral placeholder — auto-
  // selection logic is handled by the calibration/backtest layer using
  // recent win rates.

  public func generateMeanReversionSignal(
    ohlc : [MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : Types.ModelSignal {
    ignore settings;
    let lastClose = if (ohlc.size() > 0) ohlc[ohlc.size() - 1].close else 0.0;
    // Default neutral signal when there isn't enough data to compute the
    // required indicators (Bollinger needs 20 candles, RSI needs 15).
    if (ohlc.size() < 20) {
      return {
        model = #meanReversion;
        direction = #neutral;
        confidence = 0.5;
        entryPrice = lastClose;
        stopLoss = lastClose;
        takeProfit = lastClose;
        reasoning = "Insufficient history for mean-reversion: need at least 20 candles for Bollinger bands.";
        metrics = "zScore=0.00";
      };
    };

    let indicators = PredictionsLib.getTechnicalIndicators(ohlc);
    let bands = indicators.bollinger;
    let rsi = indicators.rsi.value;
    let atr = indicators.atr.value;
    let sma = bands.middle;
    let stddev = (bands.upper - bands.lower) / 2.0;
    let zScore = if (stddev > 0.0) (lastClose - sma) / stddev else 0.0;

    // Entry long when price closes below lower band AND RSI < 30.
    // Entry short when price closes above upper band AND RSI > 70.
    let direction : Types.ModelDirection = if (lastClose < bands.lower and rsi < 30.0) { #long }
      else if (lastClose > bands.upper and rsi > 70.0) { #short }
      else { #neutral };

    if (direction == #neutral) {
      return {
        model = #meanReversion;
        direction = #neutral;
        confidence = 0.5;
        entryPrice = lastClose;
        stopLoss = lastClose;
        takeProfit = sma;
        reasoning = "No mean-reversion setup: price has not breached a Bollinger band with RSI confirmation. " #
          "Close " # lastClose.toText() # " vs lower " # bands.lower.toText() # " / upper " # bands.upper.toText() #
          ", RSI " # rsi.toText() # ".";
        metrics = "zScore=" # zScore.toText();
      };
    };

    // Confidence scales with the magnitude of the z-score (deeper breach =
    // higher conviction), capped at 0.85 per the contract.
    let absZ = Float.abs(zScore);
    let rawConf = 0.5 + (absZ - 2.0) * 0.1;
    let confidence = if (rawConf > 0.85) 0.85 else if (rawConf < 0.5) 0.5 else rawConf;

    // Stop loss = 1.5 * ATR beyond entry; take profit = SMA (the mean).
    let (entryPrice, stopLoss) = switch (direction) {
      case (#long) (lastClose, lastClose - 1.5 * atr);
      case (#short) (lastClose, lastClose + 1.5 * atr);
      case (#neutral) (lastClose, lastClose);
    };
    let takeProfit = sma;

    let reasoning = switch (direction) {
      case (#long) "Mean-reversion LONG: close " # lastClose.toText() #
        " breached lower Bollinger band (" # bands.lower.toText() # ") with RSI " #
        rsi.toText() # " < 30. z-score " # zScore.toText() #
        " (price is " # Float.abs(zScore).toText() # " σ below the 20-period mean " #
        sma.toText() # "). Target is return to mean; stop 1.5×ATR (" # atr.toText() #
        ") below entry.";
      case (#short) "Mean-reversion SHORT: close " # lastClose.toText() #
        " breached upper Bollinger band (" # bands.upper.toText() # ") with RSI " #
        rsi.toText() # " > 70. z-score " # zScore.toText() #
        " (price is " # Float.abs(zScore).toText() # " σ above the 20-period mean " #
        sma.toText() # "). Target is return to mean; stop 1.5×ATR (" # atr.toText() #
        ") above entry.";
      case (#neutral) "No mean-reversion setup.";
    };

    {
      model = #meanReversion;
      direction = direction;
      confidence = confidence;
      entryPrice = entryPrice;
      stopLoss = stopLoss;
      takeProfit = takeProfit;
      reasoning = reasoning;
      metrics = "zScore=" # zScore.toText() # "; rsi=" # rsi.toText() #
        "; atr=" # atr.toText() # "; sma=" # sma.toText();
    };
  };

  public func generateMomentumSignal(
    ohlc : [MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : Types.ModelSignal {
    ignore settings;
    let lastClose = if (ohlc.size() > 0) ohlc[ohlc.size() - 1].close else 0.0;
    // EMA200 needs at least 200 candles to be meaningful; fall back to a
    // neutral signal below that threshold.
    if (ohlc.size() < 50) {
      return {
        model = #momentum;
        direction = #neutral;
        confidence = 0.5;
        entryPrice = lastClose;
        stopLoss = lastClose;
        takeProfit = lastClose;
        reasoning = "Insufficient history for momentum: need at least 50 candles for the EMA stack.";
        metrics = "adx=0.00; macdHist=0.00";
      };
    };

    let ema9 = computeEMA(ohlc, 9);
    let ema21 = computeEMA(ohlc, 21);
    let ema50 = computeEMA(ohlc, 50);
    let ema200 = if (ohlc.size() >= 200) computeEMA(ohlc, 200) else ema50;
    let indicators = PredictionsLib.getTechnicalIndicators(ohlc);
    let macd = indicators.macd;
    let atr = indicators.atr.value;
    let adx = computeADX(ohlc, 14);

    // MACD histogram slope: compare the last two histogram readings.
    // We approximate the prior histogram by recomputing MACD on the series
    // excluding the last candle.
    let priorHist = if (ohlc.size() > 1) {
      let priorSlice = Array.tabulate(ohlc.size() - 1, func(i) = ohlc[i]);
      PredictionsLib.getTechnicalIndicators(priorSlice).macd.histogram;
    } else macd.histogram;
    let histRising = macd.histogram > priorHist;

    // Entry long when EMA9 > EMA21 > EMA50 (stacked bullish) AND MACD
    // histogram rising AND price above EMA200 AND ADX > 25. Mirror for short.
    let stackedBull = ema9 > ema21 and ema21 > ema50;
    let stackedBear = ema9 < ema21 and ema21 < ema50;
    let direction : Types.ModelDirection = if (
      stackedBull and histRising and lastClose > ema200 and adx > 25.0
    ) { #long } else if (
      stackedBear and not histRising and lastClose < ema200 and adx > 25.0
    ) { #short } else { #neutral };

    if (direction == #neutral) {
      return {
        model = #momentum;
        direction = #neutral;
        confidence = 0.5;
        entryPrice = lastClose;
        stopLoss = lastClose;
        takeProfit = lastClose;
        reasoning = "No momentum setup: EMA stack not aligned with MACD slope, EMA200 bias, and ADX>25. " #
          "EMA9/21/50/200 = " # ema9.toText() # "/" # ema21.toText() # "/" #
          ema50.toText() # "/" # ema200.toText() # ", ADX " # adx.toText() #
          ", MACD hist " # macd.histogram.toText() # ".";
        metrics = "adx=" # adx.toText() # "; macdHist=" # macd.histogram.toText();
      };
    };

    // Confidence scales with ADX strength and MACD histogram slope.
    let adxFactor = if (adx > 50.0) 0.25 else (adx - 25.0) / 100.0;
    let histFactor = Float.abs(macd.histogram - priorHist);
    let rawConf = 0.5 + adxFactor + (histFactor * 0.1);
    let confidence = if (rawConf > 0.85) 0.85 else if (rawConf < 0.5) 0.5 else rawConf;

    // Stop loss = 2 * ATR; take profit = 2 * risk (2:1 R/R).
    let risk = 2.0 * atr;
    let (stopLoss, takeProfit) = switch (direction) {
      case (#long) (lastClose - risk, lastClose + 2.0 * risk);
      case (#short) (lastClose + risk, lastClose - 2.0 * risk);
      case (#neutral) (lastClose, lastClose);
    };

    let reasoning = switch (direction) {
      case (#long) "Momentum LONG: EMA stack bullish (9>21>50), MACD histogram rising (" #
        macd.histogram.toText() # " > " # priorHist.toText() # "), price " #
        lastClose.toText() # " above EMA200 " # ema200.toText() #
        ", ADX " # adx.toText() # " > 25 confirms trend strength. Stop 2×ATR (" #
        atr.toText() # "), target 2:1 R/R.";
      case (#short) "Momentum SHORT: EMA stack bearish (9<21<50), MACD histogram falling (" #
        macd.histogram.toText() # " < " # priorHist.toText() # "), price " #
        lastClose.toText() # " below EMA200 " # ema200.toText() #
        ", ADX " # adx.toText() # " > 25 confirms trend strength. Stop 2×ATR (" #
        atr.toText() # "), target 2:1 R/R.";
      case (#neutral) "No momentum setup.";
    };

    {
      model = #momentum;
      direction = direction;
      confidence = confidence;
      entryPrice = lastClose;
      stopLoss = stopLoss;
      takeProfit = takeProfit;
      reasoning = reasoning;
      metrics = "adx=" # adx.toText() # "; macdHist=" # macd.histogram.toText() #
        "; ema9=" # ema9.toText() # "; ema21=" # ema21.toText() #
        "; ema50=" # ema50.toText() # "; ema200=" # ema200.toText();
    };
  };

  public func generatePairsSignal(
    ohlcA : [MarketDataTypes.OHLC],
    ohlcB : [MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : Types.ModelSignal {
    ignore settings;
    let window = 60;
    let n = if (ohlcA.size() < ohlcB.size()) ohlcA.size() else ohlcB.size();
    let lastCloseA = if (ohlcA.size() > 0) ohlcA[ohlcA.size() - 1].close else 0.0;
    let lastCloseB = if (ohlcB.size() > 0) ohlcB[ohlcB.size() - 1].close else 0.0;

    if (n < window or lastCloseA <= 0.0 or lastCloseB <= 0.0) {
      return {
        model = #pairs;
        direction = #neutral;
        confidence = 0.5;
        entryPrice = lastCloseA;
        stopLoss = lastCloseA;
        takeProfit = lastCloseA;
        reasoning = "Insufficient history for pairs: need at least 60 overlapping candles with positive prices.";
        metrics = "spreadZScore=0.00";
      };
    };

    // Rolling spread = log(price A) - log(price B) over the last `window`
    // overlapping candles.
    let start = n - window;
    let spreads = Array.tabulate(window, func(i) {
      let idx = start + i;
      Float.log(ohlcA[idx].close) - Float.log(ohlcB[idx].close);
    });

    // Mean and stddev of the spread series.
    var sum = 0.0;
    var i = 0;
    while (i < window) {
      sum += spreads[i];
      i += 1;
    };
    let mean = sum / Float.fromInt64(window.toInt64());
    var sumSq = 0.0;
    i := 0;
    while (i < window) {
      let diff = spreads[i] - mean;
      sumSq += diff * diff;
      i += 1;
    };
    let stddev = Float.sqrt(sumSq / Float.fromInt64(window.toInt64()));
    let lastSpread = spreads[window - 1];
    let zScore = if (stddev > 0.0) (lastSpread - mean) / stddev else 0.0;

    // Entry long A / short B when spread z-score < -2.
    // Entry short A / long B when spread z-score > 2.
    let direction : Types.ModelDirection = if (zScore < -2.0) { #long }
      else if (zScore > 2.0) { #short }
      else { #neutral };

    if (direction == #neutral) {
      return {
        model = #pairs;
        direction = #neutral;
        confidence = 0.5;
        entryPrice = lastCloseA;
        stopLoss = lastCloseA;
        takeProfit = lastCloseA;
        reasoning = "No pairs setup: spread z-score " # zScore.toText() #
          " is within the ±2 no-trade band. Spread mean " # mean.toText() #
          ", stddev " # stddev.toText() # ".";
        metrics = "spreadZScore=" # zScore.toText();
      };
    };

    // Confidence scales with |z-score|, capped at 0.85.
    let absZ = Float.abs(zScore);
    let rawConf = 0.5 + (absZ - 2.0) * 0.1;
    let confidence = if (rawConf > 0.85) 0.85 else if (rawConf < 0.5) 0.5 else rawConf;

    // Stop when |z-score| exceeds 4; take profit at z-score returning to 0.
    // Translate z-score thresholds into price-A terms for entry/stop/target.
    // spread = logA - logB; a z-score change of Δz maps to a logA change of
    // Δz * stddev (holding logB constant). Convert back to price via exp.
    let entryPrice = lastCloseA;
    let stopLogDelta = 4.0 * stddev;
    let targetLogDelta = Float.abs(zScore) * stddev;
    let (stopLoss, takeProfit) = switch (direction) {
      // Long A: stop if spread drops further (z → -4), target if spread reverts to 0.
      case (#long) (
        entryPrice * Float.exp(-stopLogDelta),
        entryPrice * Float.exp(targetLogDelta),
      );
      // Short A: stop if spread rises further (z → +4), target if spread reverts to 0.
      case (#short) (
        entryPrice * Float.exp(stopLogDelta),
        entryPrice * Float.exp(-targetLogDelta),
      );
      case (#neutral) (entryPrice, entryPrice);
    };

    let reasoning = switch (direction) {
      case (#long) "Pairs LONG A / SHORT B: spread z-score " # zScore.toText() #
        " < -2 (spread " # lastSpread.toText() # " vs mean " # mean.toText() #
        ", stddev " # stddev.toText() # "). Mean-reversion expected to z=0. " #
        "Stop if z-score exceeds -4.";
      case (#short) "Pairs SHORT A / LONG B: spread z-score " # zScore.toText() #
        " > 2 (spread " # lastSpread.toText() # " vs mean " # mean.toText() #
        ", stddev " # stddev.toText() # "). Mean-reversion expected to z=0. " #
        "Stop if z-score exceeds +4.";
      case (#neutral) "No pairs setup.";
    };

    {
      model = #pairs;
      direction = direction;
      confidence = confidence;
      entryPrice = entryPrice;
      stopLoss = stopLoss;
      takeProfit = takeProfit;
      reasoning = reasoning;
      metrics = "spreadZScore=" # zScore.toText() # "; spread=" # lastSpread.toText() #
        "; spreadMean=" # mean.toText() # "; spreadStd=" # stddev.toText();
    };
  };

  // ─── Dispatcher ─────────────────────────────────────────────────────────
  // Routes to the correct generator based on the QuantModel variant. For
  // #auto, returns a neutral placeholder — auto-selection logic is handled
  // by the calibration/backtest layer using recent win rates.
  public func generateModelSignal(
    model : Types.QuantModel,
    ohlcA : [MarketDataTypes.OHLC],
    ohlcB : ?[MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : Types.ModelSignal {
    switch (model) {
      case (#meanReversion) generateMeanReversionSignal(ohlcA, settings);
      case (#momentum) generateMomentumSignal(ohlcA, settings);
      case (#pairs) {
        switch (ohlcB) {
          case (?b) generatePairsSignal(ohlcA, b, settings);
          case null {
            // Pairs model invoked without a second asset — return neutral.
            let lastClose = if (ohlcA.size() > 0) ohlcA[ohlcA.size() - 1].close else 0.0;
            {
              model = #pairs;
              direction = #neutral;
              confidence = 0.5;
              entryPrice = lastClose;
              stopLoss = lastClose;
              takeProfit = lastClose;
              reasoning = "Pairs model requires a second asset (ohlcB); none was provided.";
              metrics = "spreadZScore=0.00";
            };
          };
        };
      };
      case (#auto) {
        let lastClose = if (ohlcA.size() > 0) ohlcA[ohlcA.size() - 1].close else 0.0;
        {
          model = #auto;
          direction = #neutral;
          confidence = 0.5;
          entryPrice = lastClose;
          stopLoss = lastClose;
          takeProfit = lastClose;
          reasoning = "Auto model selection is handled by the calibration/backtest layer using recent win rates. Returning a neutral placeholder.";
          metrics = "auto=neutral";
        };
      };
    };
  };

  // ─── Indicator helpers ──────────────────────────────────────────────────
  // EMA and ADX are not currently exported by lib/predictions.mo, so they are
  // implemented here as module-local helpers. The other indicators (RSI,
  // MACD, Bollinger, ATR) are reused from lib/predictions.mo via the public
  // getTechnicalIndicators entry point.

  // Exponential moving average of the close series over `period` candles.
  public func computeEMA(
    ohlc : [MarketDataTypes.OHLC],
    period : Nat,
  ) : Float {
    if (ohlc.size() == 0 or period == 0) { return 0.0 };
    let multiplier = 2.0 / (Float.fromInt64(period.toInt64()) + 1.0);
    var ema = ohlc[0].close;
    var i = 1;
    while (i < ohlc.size()) {
      ema := (ohlc[i].close - ema) * multiplier + ema;
      i += 1;
    };
    ema;
  };

  // Average Directional Index — trend strength indicator. Returns a value in
  // [0, 100]; values above 25 indicate a trending market. Standard Wilder ADX
  // with +DI and -DI computed internally; only the ADX value is returned.
  public func computeADX(
    ohlc : [MarketDataTypes.OHLC],
    period : Nat,
  ) : Float {
    if (ohlc.size() < period + 1 or period == 0) { return 0.0 };
    let n = ohlc.size();
    let p = Float.fromInt64(period.toInt64());

    // True Range, +DM, -DM per candle (from index 1 onward).
    var sumTR = 0.0;
    var sumPlusDM = 0.0;
    var sumMinusDM = 0.0;
    var i = 1;
    while (i <= period) {
      let upMove = ohlc[i].high - ohlc[i - 1].high;
      let downMove = ohlc[i - 1].low - ohlc[i].low;
      let plusDM = if (upMove > downMove and upMove > 0.0) upMove else 0.0;
      let minusDM = if (downMove > upMove and downMove > 0.0) downMove else 0.0;
      let tr1 = ohlc[i].high - ohlc[i].low;
      let tr2 = Float.abs(ohlc[i].high - ohlc[i - 1].close);
      let tr3 = Float.abs(ohlc[i].low - ohlc[i - 1].close);
      let tr = Float.max(tr1, Float.max(tr2, tr3));
      sumTR += tr;
      sumPlusDM += plusDM;
      sumMinusDM += minusDM;
      i += 1;
    };

    // Wilder smoothing: first ADX is the average of the first `period` DX
    // values. We accumulate DX over the remaining candles using the
    // smoothed +DI/-DI and TR.
    var smoothedTR = sumTR;
    var smoothedPlusDM = sumPlusDM;
    var smoothedMinusDM = sumMinusDM;
    var dxSum = 0.0;
    var dxCount = 0;

    // Compute DX for the first window using the initial sums.
    let plusDI0 = if (smoothedTR > 0.0) 100.0 * smoothedPlusDM / smoothedTR else 0.0;
    let minusDI0 = if (smoothedTR > 0.0) 100.0 * smoothedMinusDM / smoothedTR else 0.0;
    let dx0 = if (plusDI0 + minusDI0 > 0.0) 100.0 * Float.abs(plusDI0 - minusDI0) / (plusDI0 + minusDI0) else 0.0;
    dxSum += dx0;
    dxCount += 1;

    i := period + 1;
    while (i < n) {
      let upMove = ohlc[i].high - ohlc[i - 1].high;
      let downMove = ohlc[i - 1].low - ohlc[i].low;
      let plusDM = if (upMove > downMove and upMove > 0.0) upMove else 0.0;
      let minusDM = if (downMove > upMove and downMove > 0.0) downMove else 0.0;
      let tr1 = ohlc[i].high - ohlc[i].low;
      let tr2 = Float.abs(ohlc[i].high - ohlc[i - 1].close);
      let tr3 = Float.abs(ohlc[i].low - ohlc[i - 1].close);
      let tr = Float.max(tr1, Float.max(tr2, tr3));

      // Wilder smoothing: new = old - (old / period) + new.
      smoothedTR := smoothedTR - (smoothedTR / p) + tr;
      smoothedPlusDM := smoothedPlusDM - (smoothedPlusDM / p) + plusDM;
      smoothedMinusDM := smoothedMinusDM - (smoothedMinusDM / p) + minusDM;

      let plusDI = if (smoothedTR > 0.0) 100.0 * smoothedPlusDM / smoothedTR else 0.0;
      let minusDI = if (smoothedTR > 0.0) 100.0 * smoothedMinusDM / smoothedTR else 0.0;
      let dx = if (plusDI + minusDI > 0.0) 100.0 * Float.abs(plusDI - minusDI) / (plusDI + minusDI) else 0.0;
      dxSum += dx;
      dxCount += 1;
      i += 1;
    };

    if (dxCount == 0) { return 0.0 };
    let adx = dxSum / Float.fromInt64(dxCount.toInt64());
    if (adx > 100.0) 100.0 else if (adx < 0.0) 0.0 else adx;
  };
};
