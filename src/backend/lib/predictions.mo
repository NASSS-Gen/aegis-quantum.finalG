import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/predictions";
import MarketDataTypes "../types/marketData";

module {
  public type PredictionStore = {
    var nextId : Nat;
    var records : [Types.PredictionRecord];
  };

  public func emptyStore() : PredictionStore {
    { var nextId = 0; var records = [] };
  };

  // ─── Indicator computations from OHLC ────────────────────────────────────
  private func computeRSI(ohlc : [MarketDataTypes.OHLC]) : Types.RSI {
    let period = 14;
    if (ohlc.size() < period + 1) {
      return { value = 50.0; overbought = false; oversold = false };
    };
    var gains = 0.0;
    var losses = 0.0;
    var i = 1;
    while (i <= period) {
      let diff = ohlc[i].close - ohlc[i - 1].close;
      if (diff > 0.0) { gains += diff } else { losses += Float.abs(diff) };
      i += 1;
    };
    let avgGain = gains / Float.fromInt64(period.toInt64());
    let avgLoss = losses / Float.fromInt64(period.toInt64());
    if (avgLoss == 0.0) {
      return { value = 100.0; overbought = true; oversold = false };
    };
    let rs = avgGain / avgLoss;
    let value = 100.0 - (100.0 / (1.0 + rs));
    { value = value; overbought = value > 70.0; oversold = value < 30.0 };
  };

  private func computeMACD(ohlc : [MarketDataTypes.OHLC]) : Types.MACD {
    let ema12 = computeEMA(ohlc, 12);
    let ema26 = computeEMA(ohlc, 26);
    let macdLine = ema12 - ema26;
    let signalLine = computeEMAOfMACD(ohlc, 12, 26, 9);
    { macdLine = macdLine; signalLine = signalLine; histogram = macdLine - signalLine };
  };

  private func computeEMA(ohlc : [MarketDataTypes.OHLC], period : Nat) : Float {
    if (ohlc.size() == 0) { return 0.0 };
    let multiplier = 2.0 / (Float.fromInt64(period.toInt64()) + 1.0);
    var ema = ohlc[0].close;
    var i = 1;
    while (i < ohlc.size()) {
      ema := (ohlc[i].close - ema) * multiplier + ema;
      i += 1;
    };
    ema;
  };

  private func computeEMAOfMACD(ohlc : [MarketDataTypes.OHLC], fast : Nat, slow : Nat, signal : Nat) : Float {
    if (ohlc.size() == 0) { return 0.0 };
    let macdValues = Array.tabulate(ohlc.size(), func(i) {
      let slice = Array.tabulate(i + 1, func(j) = ohlc[j]);
      let ema12 = computeEMA(slice, fast);
      let ema26 = computeEMA(slice, slow);
      ema12 - ema26;
    });
    if (macdValues.size() == 0) { return 0.0 };
    let multiplier = 2.0 / (Float.fromInt64(signal.toInt64()) + 1.0);
    var ema = macdValues[0];
    var i = 1;
    while (i < macdValues.size()) {
      ema := (macdValues[i] - ema) * multiplier + ema;
      i += 1;
    };
    ema;
  };

  private func computeBollinger(ohlc : [MarketDataTypes.OHLC]) : Types.BollingerBands {
    let period = 20;
    if (ohlc.size() < period) {
      return { upper = 0.0; middle = 0.0; lower = 0.0; percentB = 0.5 };
    };
    let closes = Array.tabulate(ohlc.size(), func(i) = ohlc[i].close);
    let sma = computeSMA(closes, period);
    let stddev = computeStdDev(closes, period, sma);
    let upper = sma + 2.0 * stddev;
    let lower = sma - 2.0 * stddev;
    let lastClose = closes[closes.size() - 1];
    let percentB = if (upper == lower) 0.5 else (lastClose - lower) / (upper - lower);
    { upper = upper; middle = sma; lower = lower; percentB = percentB };
  };

  private func computeSMA(values : [Float], period : Nat) : Float {
    if (values.size() < period) { return 0.0 };
    var sum = 0.0;
    var i = Int.abs(values.size()) - Int.abs(period);
    while (i < values.size()) {
      sum += values[i];
      i += 1;
    };
    sum / Float.fromInt64(period.toInt64());
  };

  private func computeStdDev(values : [Float], period : Nat, mean : Float) : Float {
    if (values.size() < period) { return 0.0 };
    var sumSq = 0.0;
    var i = Int.abs(values.size()) - Int.abs(period);
    while (i < values.size()) {
      let diff = values[i] - mean;
      sumSq += diff * diff;
      i += 1;
    };
    Float.sqrt(sumSq / Float.fromInt64(period.toInt64()));
  };

  private func computeATR(ohlc : [MarketDataTypes.OHLC]) : Types.ATR {
    let period = 14;
    if (ohlc.size() < period + 1) {
      return { value = 0.0 };
    };
    var sum = 0.0;
    var i = 1;
    while (i <= period) {
      let tr1 = ohlc[i].high - ohlc[i].low;
      let tr2 = Float.abs(ohlc[i].high - ohlc[i - 1].close);
      let tr3 = Float.abs(ohlc[i].low - ohlc[i - 1].close);
      let tr = Float.max(tr1, Float.max(tr2, tr3));
      sum += tr;
      i += 1;
    };
    { value = sum / Float.fromInt64(period.toInt64()) };
  };

  private func computeStochastic(ohlc : [MarketDataTypes.OHLC]) : Types.Stochastic {
    let period = 14;
    if (ohlc.size() < period) {
      return { percentK = 50.0; percentD = 50.0; overbought = false; oversold = false };
    };
    let last = ohlc[ohlc.size() - 1];
    var lowest = last.low;
    var highest = last.high;
    var i = Int.abs(ohlc.size()) - Int.abs(period);
    while (i < ohlc.size()) {
      if (ohlc[i].low < lowest) { lowest := ohlc[i].low };
      if (ohlc[i].high > highest) { highest := ohlc[i].high };
      i += 1;
    };
    let range = highest - lowest;
    let percentK = if (range == 0.0) 50.0 else ((last.close - lowest) / range) * 100.0;
    // %D is a 3-period SMA of %K. The previous implementation called
    // computeSMA([percentK], 3), which always returned 0.0 because the
    // single-element array is shorter than the period. Instead, compute a
    // rolling %K over the last `period` candles and average them so %D
    // reflects actual recent momentum rather than always being 0.
    var kSum = 0.0;
    var kCount = 0;
    var kIdx = Int.abs(ohlc.size()) - Int.abs(period);
    while (kIdx < ohlc.size()) {
      var kLow = ohlc[kIdx].low;
      var kHigh = ohlc[kIdx].high;
      var j = Int.abs(ohlc.size()) - Int.abs(period);
      while (j <= kIdx) {
        if (ohlc[j].low < kLow) { kLow := ohlc[j].low };
        if (ohlc[j].high > kHigh) { kHigh := ohlc[j].high };
        j += 1;
      };
      let kRange = kHigh - kLow;
      let kValue = if (kRange == 0.0) 50.0 else ((ohlc[kIdx].close - kLow) / kRange) * 100.0;
      kSum += kValue;
      kCount += 1;
      kIdx += 1;
    };
    let percentD = if (kCount == 0) 50.0 else kSum / Float.fromInt64(kCount.toInt64());
    { percentK = percentK; percentD = percentD; overbought = percentK > 80.0; oversold = percentK < 20.0 };
  };

  private func computeCCI(ohlc : [MarketDataTypes.OHLC]) : Types.CCI {
    let period = 20;
    if (ohlc.size() < period) {
      return { value = 0.0; overbought = false; oversold = false };
    };
    var sum = 0.0;
    var i = Int.abs(ohlc.size()) - Int.abs(period);
    while (i < ohlc.size()) {
      let tp = (ohlc[i].high + ohlc[i].low + ohlc[i].close) / 3.0;
      sum += tp;
      i += 1;
    };
    let sma = sum / Float.fromInt64(period.toInt64());
    var meanDev = 0.0;
    i := Int.abs(ohlc.size()) - Int.abs(period);
    while (i < ohlc.size()) {
      let tp = (ohlc[i].high + ohlc[i].low + ohlc[i].close) / 3.0;
      meanDev += Float.abs(tp - sma);
      i += 1;
    };
    meanDev := meanDev / Float.fromInt64(period.toInt64());
    let lastTP = (ohlc[ohlc.size() - 1].high + ohlc[ohlc.size() - 1].low + ohlc[ohlc.size() - 1].close) / 3.0;
    let value = if (meanDev == 0.0) 0.0 else (lastTP - sma) / (0.015 * meanDev);
    { value = value; overbought = value > 100.0; oversold = value < -100.0 };
  };

  private func computeBacktest(ohlc : [MarketDataTypes.OHLC]) : Types.BacktestMetrics {
    if (ohlc.size() < 20) {
      return { winRate = 0.5; avgReturn = 0.0; sharpeRatio = 0.0; maxDrawdown = 0.0; lookbackCandles = ohlc.size() };
    };
    var wins = 0;
    var totalReturn = 0.0;
    var maxDD = 0.0;
    var peak = 0.0;
    let n = Int.abs(ohlc.size()) - 1;
    // Collect per-candle returns for stddev-based Sharpe computation.
    let returns = Array.tabulate(n, func(i) {
      ohlc[i + 1].close - ohlc[i].close;
    });
    var i = 1;
    while (i < ohlc.size()) {
      let ret = returns[i - 1];
      if (ret > 0.0) { wins += 1 };
      totalReturn += ret;
      if (totalReturn > peak) { peak := totalReturn };
      let dd = peak - totalReturn;
      if (dd > maxDD) { maxDD := dd };
      i += 1;
    };
    let winRate = Float.fromInt64(wins.toInt64()) / Float.fromInt64(n.toInt64());
    let avgReturn = totalReturn / Float.fromInt64(n.toInt64());
    // Sharpe ratio = mean(excess returns) / std(excess returns). With a zero
    // risk-free rate, excess returns equal the raw returns. stddev is the
    // population standard deviation of the per-candle returns. A zero
    // stddev (flat series) yields Sharpe 0.0 to avoid division by zero.
    var sumSq = 0.0;
    var k = 0;
    while (k < n) {
      let diff = returns[k] - avgReturn;
      sumSq += diff * diff;
      k += 1;
    };
    let variance = sumSq / Float.fromInt64(n.toInt64());
    let stddev = Float.sqrt(variance);
    let sharpe = if (stddev == 0.0) 0.0 else avgReturn / stddev;
    { winRate = winRate; avgReturn = avgReturn; sharpeRatio = sharpe; maxDrawdown = maxDD; lookbackCandles = ohlc.size() };
  };

  private func computeVWAP(ohlc : [MarketDataTypes.OHLC]) : Types.VWAP {
    if (ohlc.size() == 0) {
      return { value = 0.0; deviation = 0.0; upperBand = 0.0; lowerBand = 0.0 };
    };
    var cumulativeTPV = 0.0;
    var cumulativeVol = 0.0;
    var i = 0;
    while (i < ohlc.size()) {
      let tp = (ohlc[i].high + ohlc[i].low + ohlc[i].close) / 3.0;
      let vol = if (ohlc[i].volume > 0.0) ohlc[i].volume else 1.0;
      cumulativeTPV += tp * vol;
      cumulativeVol += vol;
      i += 1;
    };
    let vwap = if (cumulativeVol == 0.0) ohlc[ohlc.size() - 1].close else cumulativeTPV / cumulativeVol;
    let lastClose = ohlc[ohlc.size() - 1].close;
    let deviation = Float.abs(lastClose - vwap) / vwap * 100.0;
    { value = vwap; deviation = deviation; upperBand = vwap * 1.02; lowerBand = vwap * 0.98 };
  };

  // ─── Public API ──────────────────────────────────────────────────────────
  public func getTechnicalIndicators(
    ohlc : [MarketDataTypes.OHLC],
  ) : Types.TechnicalIndicators {
    {
      rsi = computeRSI(ohlc);
      macd = computeMACD(ohlc);
      bollinger = computeBollinger(ohlc);
      atr = computeATR(ohlc);
      stochastic = computeStochastic(ohlc);
      cci = computeCCI(ohlc);
      vwap = computeVWAP(ohlc);
    };
  };

  // Slice the OHLC series to the last `lookback` candles, simulating a
  // different timeframe resolution per vote. Shorter lookbacks react to
  // recent price action (fast timeframes); longer lookbacks smooth it out
  // (slow timeframes). This gives each confluence vote a genuinely
  // different indicator reading instead of reusing one shared computation
  // labeled with four timeframe tags.
  private func sliceLast(ohlc : [MarketDataTypes.OHLC], lookback : Nat) : [MarketDataTypes.OHLC] {
    if (ohlc.size() <= lookback) { ohlc }
    else {
      let start = Int.abs(ohlc.size()) - Int.abs(lookback);
      Array.tabulate(lookback, func(i) = ohlc[start + i]);
    };
  };

  public func getConfluenceResult(
    ohlc : [MarketDataTypes.OHLC],
    selectedTimeframe : Types.Timeframe,
  ) : Types.ConfluenceResult {
    // Each timeframe vote uses a genuinely different lookback window so the
    // underlying indicator readings differ per timeframe rather than being
    // one shared computation labeled M15/H1/H4/D1.
    let m15Slice = sliceLast(ohlc, 15);
    let h1Slice = sliceLast(ohlc, 30);
    let h4Slice = sliceLast(ohlc, 60);
    let d1Slice = sliceLast(ohlc, 120);

    let m15Indicators = getTechnicalIndicators(m15Slice);
    let h1Indicators = getTechnicalIndicators(h1Slice);
    let h4Indicators = getTechnicalIndicators(h4Slice);
    let d1Indicators = getTechnicalIndicators(d1Slice);

    let vwap = m15Indicators.vwap;
    let lastClose = if (ohlc.size() > 0) ohlc[ohlc.size() - 1].close else 0.0;
    let vwapDev = if (vwap.value > 0.0) Float.abs(lastClose - vwap.value) / vwap.value * 100.0 else 0.0;

    let m15Bias = if (m15Indicators.rsi.value > 60.0) "Bullish" else if (m15Indicators.rsi.value < 40.0) "Bearish" else "Neutral";
    let m15Strength = Int.abs(m15Indicators.rsi.value.toInt());

    let h1Bias = if (h1Indicators.macd.macdLine > h1Indicators.macd.signalLine) "Bullish" else if (h1Indicators.macd.macdLine < h1Indicators.macd.signalLine) "Bearish" else "Neutral";
    let h1Strength = Int.abs(Float.toInt(h1Indicators.macd.histogram * 10.0));

    let h4Bias = if (h4Indicators.stochastic.percentK > 80.0) "Bullish" else if (h4Indicators.stochastic.percentK < 20.0) "Bearish" else "Neutral";
    let h4Strength = Int.abs(h4Indicators.stochastic.percentK.toInt());

    let d1Bias = if (d1Indicators.cci.value > 100.0) "Bullish" else if (d1Indicators.cci.value < -100.0) "Bearish" else "Neutral";
    let d1Strength = Int.abs(d1Indicators.cci.value.toInt());

    let votes = [
      {
        timeframe = #M15;
        bias = m15Bias;
        strength = m15Strength;
        keyLevel = m15Indicators.bollinger.middle;
        rsi = m15Indicators.rsi.value;
        macdSignal = m15Indicators.macd.signalLine;
        vwapDev = vwapDev;
      },
      {
        timeframe = #H1;
        bias = h1Bias;
        strength = h1Strength;
        keyLevel = h1Indicators.bollinger.upper;
        rsi = h1Indicators.rsi.value;
        macdSignal = h1Indicators.macd.signalLine;
        vwapDev = vwapDev;
      },
      {
        timeframe = #H4;
        bias = h4Bias;
        strength = h4Strength;
        keyLevel = h4Indicators.bollinger.lower;
        rsi = h4Indicators.rsi.value;
        macdSignal = h4Indicators.macd.signalLine;
        vwapDev = vwapDev;
      },
      {
        timeframe = #D1;
        bias = d1Bias;
        strength = d1Strength;
        keyLevel = d1Indicators.vwap.value;
        rsi = d1Indicators.rsi.value;
        macdSignal = d1Indicators.macd.signalLine;
        vwapDev = vwapDev;
      },
    ];

    var bullishVotes = 0;
    var bearishVotes = 0;
    var totalStrength = 0;
    var i = 0;
    while (i < votes.size()) {
      if (votes[i].bias == "Bullish") { bullishVotes += 1 };
      if (votes[i].bias == "Bearish") { bearishVotes += 1 };
      totalStrength += votes[i].strength;
      i += 1;
    };

    let confluenceScore = if (votes.size() > 0) totalStrength / votes.size() else 0;
    let finalBias = if (bullishVotes > bearishVotes) "Bullish" else if (bearishVotes > bullishVotes) "Bearish" else "Neutral";
    let weightedScore = Float.fromInt64(bullishVotes.toInt64()) - Float.fromInt64(bearishVotes.toInt64());

    {
      votes = votes;
      confluenceScore = confluenceScore;
      finalBias = finalBias;
      primaryTimeframe = selectedTimeframe;
      weightedScore = weightedScore;
    };
  };

  // Default minimum confidence threshold (0-100) applied when no
  // QuantSettings.minConfidence is wired into the call site. Signals whose
  // blended confidence falls below this floor are reported at the floor so
  // the displayed confidence never implies a sub-threshold trade.
  private let defaultMinConfidence : Nat = 50;

  public func getSignalReportCard(
    ohlc : [MarketDataTypes.OHLC],
    selectedTimeframe : Types.Timeframe,
    accountSize : Float,
    maxRiskPercent : Float,
  ) : Types.SignalReportCard {
    let indicators = getTechnicalIndicators(ohlc);
    let backtest = computeBacktest(ohlc);
    let confluence = getConfluenceResult(ohlc, selectedTimeframe);
    let volatility = getVolatilityOverlay(ohlc, accountSize, maxRiskPercent);

    let grade = if (backtest.sharpeRatio > 2.0 and confluence.confluenceScore > 75) #A
      else if (backtest.sharpeRatio > 1.5 and confluence.confluenceScore > 60) #B
      else if (backtest.sharpeRatio > 1.0 and confluence.confluenceScore > 45) #C
      else if (backtest.sharpeRatio > 0.5) #D
      else #F;

    let lastClose = if (ohlc.size() > 0) ohlc[ohlc.size() - 1].close else 0.0;
    let atrValue = indicators.atr.value;
    let entryPrice = lastClose;
    let stopLoss = if (confluence.finalBias == "Bullish") lastClose - (atrValue * 2.0) else lastClose + (atrValue * 2.0);
    let targetPrice = if (confluence.finalBias == "Bullish") lastClose + (atrValue * 3.0) else lastClose - (atrValue * 3.0);
    let risk = Float.abs(entryPrice - stopLoss);
    let reward = Float.abs(targetPrice - entryPrice);
    let riskRewardRatio = if (risk == 0.0) 0.0 else reward / risk;

    let expectedMovePercent = if (lastClose > 0.0) (atrValue / lastClose) * 100.0 else 0.0;
    let positionSize = if (risk == 0.0) 0.0 else (accountSize * (maxRiskPercent / 100.0)) / risk;
    let riskAmount = accountSize * (maxRiskPercent / 100.0);

    // ─── Composite confidence ──────────────────────────────────────────────
    // Blend the raw confluence score with a vote-alignment factor: how many
    // of the four timeframe votes agree with the final bias. A signal where
    // 3/4 timeframes agree is more trustworthy than one carried by a single
    // timeframe, even at equal average strength. The result is then floored
    // at the minConfidence threshold so displayed confidence never implies a
    // sub-threshold trade.
    let totalVotes = confluence.votes.size();
    var alignedVotes = 0;
    var i = 0;
    while (i < totalVotes) {
      if (confluence.votes[i].bias == confluence.finalBias and confluence.finalBias != "Neutral") {
        alignedVotes += 1;
      };
      i += 1;
    };
    let alignmentRatio = if (totalVotes == 0) 0.0 else Float.fromInt64(alignedVotes.toInt64()) / Float.fromInt64(totalVotes.toInt64());
    let blended = (Float.fromInt64(confluence.confluenceScore.toInt64()) * 0.6) + (alignmentRatio * 100.0 * 0.4);
    let rawConfidence = if (blended > 100.0) 100.0 else if (blended < 0.0) 0.0 else blended;
    let compositeConfidence = if (rawConfidence < Float.fromInt64(defaultMinConfidence.toInt64())) defaultMinConfidence else Int.abs(rawConfidence.toInt());

    let gradeText = switch (grade) {
      case (#A) "A";
      case (#B) "B";
      case (#C) "C";
      case (#D) "D";
      case (#F) "F";
    };

    // ─── Grade rationale ───────────────────────────────────────────────────
    // Explain WHY the grade was assigned: Sharpe ratio tier, confluence
    // strength, and how many timeframes aligned with the final bias.
    let sharpeTier = if (backtest.sharpeRatio > 2.0) "favorable Sharpe ratio (" # backtest.sharpeRatio.toText() # ")"
      else if (backtest.sharpeRatio > 1.0) "moderate Sharpe ratio (" # backtest.sharpeRatio.toText() # ")"
      else if (backtest.sharpeRatio > 0.5) "weak Sharpe ratio (" # backtest.sharpeRatio.toText() # ")"
      else "unfavorable Sharpe ratio (" # backtest.sharpeRatio.toText() # ")";
    let confluenceTier = if (confluence.confluenceScore > 75) "strong confluence"
      else if (confluence.confluenceScore > 60) "good confluence"
      else if (confluence.confluenceScore > 45) "moderate confluence"
      else "weak confluence";
    let alignmentPhrase = if (alignedVotes == totalVotes and totalVotes > 0) "all " # totalVotes.toText() # " timeframes aligned"
      else if (alignedVotes >= 3) "strong alignment across " # alignedVotes.toText() # " of " # totalVotes.toText() # " timeframes"
      else if (alignedVotes >= 2) "partial alignment across " # alignedVotes.toText() # " of " # totalVotes.toText() # " timeframes"
      else "limited timeframe alignment (" # alignedVotes.toText() # "/" # totalVotes.toText() # ")";

    let reasoning = "Grade " # gradeText # ": " # confluenceTier # " (score " # confluence.confluenceScore.toText() #
      "/100) with " # sharpeTier # " and " # alignmentPhrase # ". " #
      "Volatility regime: " # volatility.regimeLabel # ". " #
      "Composite confidence " # compositeConfidence.toText() # "/100 blends confluence strength with vote alignment, floored at the " #
      defaultMinConfidence.toText() # " minimum threshold. " #
      "RSI " # indicators.rsi.value.toText() # ", MACD histogram " # indicators.macd.histogram.toText() # ". " #
      "Suggested position size " # positionSize.toText() # " units risking " # riskAmount.toText() # " (" # maxRiskPercent.toText() # "% of " # accountSize.toText() # ").";

    // ─── Engine-upgrade extension defaults ───────────────────────────────
    // The base lib computation populates the new SignalReportCard extension
    // fields with neutral defaults. The predictions-api mixin enriches these
    // with the real model signal, OHLCV volume profile, regime assessment,
    // and calibrated confidence by calling lib/models.mo, lib/volumeProfile.mo,
    // lib/regime.mo, and lib/calibration.mo. This keeps the lib function a
    // pure function of OHLC (no store dependencies) while letting the mixin
    // layer compose the full pipeline.
    let neutralModelSignal : Types.ModelSignal = {
      model = #auto;
      direction = #neutral;
      confidence = Float.fromInt64(compositeConfidence.toInt64()) / 100.0;
      entryPrice = entryPrice;
      stopLoss = stopLoss;
      takeProfit = targetPrice;
      reasoning = "Base confluence signal — model selection, volume profile, regime assessment, and calibration are applied by the API layer.";
      metrics = "";
    };

    let honestDisclaimer = "90% accuracy is a goal, not a promise. Past performance does not guarantee future results. Signals are educational, not financial advice.";

    {
      backtest = backtest;
      grade = grade;
      expectedValue = backtest.avgReturn;
      compositeConfidence = compositeConfidence;
      reasoning = reasoning;
      bias = confluence.finalBias;
      riskRewardRatio = riskRewardRatio;
      recommendedPositionSize = positionSize;
      expectedMovePercent = expectedMovePercent;
      confluenceBreakdown = confluence.votes;
      regime = volatility.regime;
      regimeLabel = volatility.regimeLabel;
      keyLevels = [
        { name = "Entry"; price = entryPrice; kind = "entry" },
        { name = "Target"; price = targetPrice; kind = "target" },
        { name = "Stop Loss"; price = stopLoss; kind = "stop" },
        { name = "VWAP"; price = indicators.vwap.value; kind = "vwap" },
      ];
      // ── Engine-upgrade extensions (defaults; enriched by the API mixin) ──
      model = #auto;
      modelSignal = neutralModelSignal;
      volumeProfile = null;
      regimeAssessment = null;
      calibratedConfidence = null;
      honestDisclaimer = honestDisclaimer;
    };
  };

  public func getPredictionHistory(store : PredictionStore) : [Types.PredictionRecord] {
    store.records;
  };

  public func getFilteredPredictionHistory(store : PredictionStore, filter : Types.PredictionFilter) : [Types.PredictionRecord] {
    store.records.filter(func(r) {
      let assetMatch = switch (filter.assetId) {
        case (?id) r.assetId == id;
        case null true;
      };
      let signalMatch = switch (filter.signalType) {
        case (?st) r.signal == st;
        case null true;
      };
      let gradeMatch = switch (filter.grade) {
        case (?g) r.grade == g;
        case null true;
      };
      let timeframeMatch = switch (filter.timeframe) {
        case (?tf) r.timeframe == tf;
        case null true;
      };
      let outcomeMatch = switch (filter.outcome) {
        case (?o) r.outcome == ?o;
        case null true;
      };
      let dateMatch = switch (filter.startDate, filter.endDate) {
        case (?start, ?end) r.timestamp >= start and r.timestamp <= end;
        case (?start, null) r.timestamp >= start;
        case (null, ?end) r.timestamp <= end;
        case (null, null) true;
      };
      assetMatch and signalMatch and gradeMatch and timeframeMatch and outcomeMatch and dateMatch;
    });
  };

  public func getPredictionStats(store : PredictionStore) : Types.PredictionStats {
    let resolved = store.records.filter(func(r) {
      switch (r.outcome) {
        case (?_) true;
        case null false;
      };
    });

    var wins = 0;
    var totalPnl = 0.0;
    var bestTrade = 0.0;
    var worstTrade = 0.0;
    var totalRR = 0.0;
    var gradeA = 0;
    var gradeB = 0;
    var gradeC = 0;
    var gradeD = 0;
    var gradeF = 0;
    var hitTarget = 0;
    var hitStop = 0;
    var openCount = 0;
    var i = 0;

    // Grade distribution is computed over the full record set (resolved + open),
    // since grade is assigned at signal-generation time, not at resolution time.
    while (i < store.records.size()) {
      switch (store.records[i].grade) {
        case (#A) { gradeA += 1 };
        case (#B) { gradeB += 1 };
        case (#C) { gradeC += 1 };
        case (#D) { gradeD += 1 };
        case (#F) { gradeF += 1 };
      };
      switch (store.records[i].outcome) {
        case (?#HitTarget) { hitTarget += 1 };
        case (?#HitStop) { hitStop += 1 };
        case (?#Open) { openCount += 1 };
        case null { openCount += 1 };
      };
      i += 1;
    };

    i := 0;
    while (i < resolved.size()) {
      let pnl = switch (resolved[i].pnl) {
        case (?p) p;
        case null 0.0;
      };
      if (pnl > 0.0) { wins += 1 };
      totalPnl += pnl;
      if (pnl > bestTrade) { bestTrade := pnl };
      if (pnl < worstTrade) { worstTrade := pnl };
      let risk = Float.abs(resolved[i].entryPrice - resolved[i].stopLoss);
      let reward = Float.abs(resolved[i].targetPrice - resolved[i].entryPrice);
      let rr = if (risk == 0.0) 0.0 else reward / risk;
      totalRR += rr;
      i += 1;
    };

    let winRate = if (resolved.size() > 0) Float.fromInt64(wins.toInt64()) / Float.fromInt64(resolved.size().toInt64()) else 0.0;
    let avgPnl = if (resolved.size() > 0) totalPnl / Float.fromInt64(resolved.size().toInt64()) else 0.0;
    let avgRR = if (resolved.size() > 0) totalRR / Float.fromInt64(resolved.size().toInt64()) else 0.0;
    let sharpeLike = if (worstTrade == 0.0) 0.0 else avgPnl / Float.abs(worstTrade);

    {
      totalPredictions = store.records.size();
      resolvedCount = resolved.size();
      winRate = winRate;
      avgRiskReward = avgRR;
      sharpeLikeRatio = sharpeLike;
      avgPnl = avgPnl;
      bestTrade = bestTrade;
      worstTrade = worstTrade;
      gradeDistribution = {
        gradeA = gradeA;
        gradeB = gradeB;
        gradeC = gradeC;
        gradeD = gradeD;
        gradeF = gradeF;
      };
      outcomeBreakdown = {
        hitTarget = hitTarget;
        hitStop = hitStop;
        open = openCount;
      };
    };
  };

  public func addPredictionRecord(
    store : PredictionStore,
    record : Types.PredictionRecord,
  ) : Nat {
    let id = store.nextId;
    store.nextId += 1;
    let newRecord = { record with id; timestamp = Int.abs(Time.now()) };
    store.records := store.records.concat([newRecord]);
    id;
  };

  public func resolvePredictionOutcome(
    store : PredictionStore,
    id : Nat,
    outcome : Types.Outcome,
    pnl : Float,
  ) {
    store.records := store.records.map(
      func(r) {
        if (r.id == id) {
          { r with outcome = ?outcome; pnl = ?pnl; resolvedAt = ?Int.abs(Time.now()) };
        } else { r };
      },
    );
  };

  // ─── Automatic price-based resolution ───────────────────────────────────
  // Given the latest market price for a prediction's asset, decide whether the
  // prediction has hit its target, hit its stop, or is still open. The decision
  // respects the signal direction:
  //   - Bullish signals (#BuyCall, #BuyFutures): target is above entry, stop is
  //     below entry. Win if price >= target, loss if price <= stop.
  //   - Bearish signals (#BuyPut, #Sell): target is below entry, stop is above
  //     entry. Win if price <= target, loss if price >= stop.
  //   - #Hold: no directional risk; left open unless an explicit outcome is
  //     supplied via manualResolvePredictionOutcome.
  // Returns the resolved record id and outcome so the caller can persist it,
  // or null if the prediction is not resolvable from price alone.
  public func resolveFromPrice(
    store : PredictionStore,
    id : Nat,
    currentPrice : Float,
  ) : ?(Nat, Types.Outcome, Float) {
    let found = store.records.find(func(r) { r.id == id });
    switch (found) {
      case null { null };
      case (?r) {
        if (r.outcome != null) { return null };
        let bullish = switch (r.signal) {
          case (#BuyCall) true;
          case (#BuyFutures) true;
          case (#BuyPut) false;
          case (#Sell) false;
          case (#Hold) { return null };
        };
        let outcome = if (bullish) {
          if (currentPrice >= r.targetPrice) { ?#HitTarget }
          else if (currentPrice <= r.stopLoss) { ?#HitStop }
          else { null };
        } else {
          if (currentPrice <= r.targetPrice) { ?#HitTarget }
          else if (currentPrice >= r.stopLoss) { ?#HitStop }
          else { null };
        };
        switch (outcome) {
          case null { null };
          case (?o) {
            let pnl = computePnl(r, o, currentPrice);
            resolvePredictionOutcome(store, id, o, pnl);
            ?(id, o, pnl);
          };
        };
      };
    };
  };

  // PnL expressed as a fraction of the entry price (positive = profit).
  // For bullish trades: (exit - entry) / entry.
  // For bearish trades: (entry - exit) / entry.
  private func computePnl(r : Types.PredictionRecord, outcome : Types.Outcome, currentPrice : Float) : Float {
    let bullish = switch (r.signal) {
      case (#BuyCall) true;
      case (#BuyFutures) true;
      case (#BuyPut) false;
      case (#Sell) false;
      case (#Hold) { return 0.0 };
    };
    let exitPrice = switch (outcome) {
      case (#HitTarget) r.targetPrice;
      case (#HitStop) r.stopLoss;
      case (#Open) currentPrice;
    };
    if (r.entryPrice == 0.0) { return 0.0 };
    if (bullish) { (exitPrice - r.entryPrice) / r.entryPrice }
    else { (r.entryPrice - exitPrice) / r.entryPrice };
  };

  // ─── Manual outcome override ────────────────────────────────────────────
  // For predictions that need human judgment beyond automatic price-based
  // resolution (e.g. partial fills, gap events, manual close). Forces the
  // given outcome and pnl onto the record regardless of market price.
  public func manualResolvePredictionOutcome(
    store : PredictionStore,
    id : Nat,
    outcome : Types.Outcome,
    pnl : Float,
  ) : Bool {
    let exists = store.records.find(func(r) { r.id == id });
    switch (exists) {
      case null { false };
      case (?_) {
        resolvePredictionOutcome(store, id, outcome, pnl);
        true;
      };
    };
  };

  // ─── Win/loss payoff ratio from OHLC history ───────────────────────────
  // Computes the historical win rate and average win/loss payoff ratio
  // from per-candle returns. Used by the Kelly criterion formula below.
  private func computeWinLossStats(ohlc : [MarketDataTypes.OHLC]) : { winRate : Float; payoffRatio : Float } {
    if (ohlc.size() < 2) {
      return { winRate = 0.5; payoffRatio = 1.0 };
    };
    var wins = 0;
    var totalGains = 0.0;
    var totalLosses = 0.0;
    var i = 1;
    while (i < ohlc.size()) {
      let ret = ohlc[i].close - ohlc[i - 1].close;
      if (ret > 0.0) {
        wins += 1;
        totalGains += ret;
      } else if (ret < 0.0) {
        totalLosses += Float.abs(ret);
      };
      i += 1;
    };
    let totalMoves = Int.abs(ohlc.size()) - 1;
    let winRate = Float.fromInt64(wins.toInt64()) / Float.fromInt64(totalMoves.toInt64());
    let avgWin = if (wins > 0) totalGains / Float.fromInt64(wins.toInt64()) else 0.0;
    let lossCount = totalMoves - wins;
    let avgLoss = if (lossCount > 0) totalLosses / Float.fromInt64(lossCount.toInt64()) else 0.0;
    let payoffRatio = if (avgLoss == 0.0) (if (avgWin > 0.0) 1.0 else 1.0) else avgWin / avgLoss;
    { winRate = winRate; payoffRatio = payoffRatio };
  };

  public func getVolatilityOverlay(
    ohlc : [MarketDataTypes.OHLC],
    accountSize : Float,
    maxRiskPercent : Float,
  ) : Types.VolatilityOverlay {
    let atr = computeATR(ohlc);
    let lastClose = if (ohlc.size() > 0) ohlc[ohlc.size() - 1].close else 0.0;
    let atrPercent = if (lastClose > 0.0) (atr.value / lastClose) * 100.0 else 0.0;

    // Volatility regime classification from ATR/price ratio thresholds.
    //   < 1.0%  → LowVolatility
    //   1.0–3.0% → Normal
    //   3.0–5.0% → HighVolatility
    //   > 5.0%  → Extreme
    let regime : Types.VolatilityRegime = if (atrPercent > 5.0) #Extreme
      else if (atrPercent > 3.0) #HighVolatility
      else if (atrPercent < 1.0) #LowVolatility
      else #Normal;

    let regimeLabel = switch (regime) {
      case (#Extreme) "Extreme — Reduce position size by 50%";
      case (#HighVolatility) "High — Wider stops, smaller size";
      case (#LowVolatility) "Low — Tight stops, normal size";
      case (#Normal) "Normal — Standard risk parameters";
    };

    // Leverage recommendation capped by volatility regime:
    //   Extreme → 1x, High → 2x, Normal → 3x, Low → 5x
    let recommendedLeverage : Float = switch (regime) {
      case (#Extreme) 1.0;
      case (#HighVolatility) 2.0;
      case (#Normal) 3.0;
      case (#LowVolatility) 5.0;
    };

    // Kelly fraction from historical win rate and payoff ratio:
    //   f* = W - (1 - W) / R
    // where W = win rate, R = average win / average loss.
    let stats = computeWinLossStats(ohlc);
    let winRate = stats.winRate;
    let payoffRatio = stats.payoffRatio;
    let kellyFraction : Float = if (payoffRatio <= 0.0) 0.0
      else winRate - ((1.0 - winRate) / payoffRatio);
    // Clamp Kelly to a sane [0.0, 1.0] band — negative edge means no position.
    let clampedKelly = if (kellyFraction < 0.0) 0.0 else if (kellyFraction > 1.0) 1.0 else kellyFraction;

    // Regime scaling factor — reduce exposure as volatility rises.
    let regimeScale : Float = switch (regime) {
      case (#Extreme) 0.5;
      case (#HighVolatility) 0.7;
      case (#Normal) 1.0;
      case (#LowVolatility) 1.0;
    };

    // Risk-adjusted position size combines Kelly fraction, max risk percent,
    // and volatility regime into a single sizing recommendation (in units of
    // the asset). Base risk budget = accountSize * (maxRiskPercent / 100).
    // Kelly-adjusted risk = base risk * clampedKelly (when Kelly is 0, size
    // collapses to 0; full Kelly uses the entire risk budget). The regime
    // scale further tightens exposure in high/extreme regimes. ATR per unit
    // converts the risk budget into asset units.
    let baseRiskBudget = accountSize * (maxRiskPercent / 100.0);
    let kellyAdjustedRisk = baseRiskBudget * clampedKelly;
    let regimeAdjustedRisk = kellyAdjustedRisk * regimeScale;
    let riskAdjustedPositionSize : Float = if (atr.value == 0.0) 0.0
      else regimeAdjustedRisk / atr.value;

    // Max drawdown estimate — ATR-scaled, amplified in higher regimes.
    let maxDrawdownEstimate : Float = atr.value * 10.0 * regimeScale;

    {
      regime = regime;
      regimeLabel = regimeLabel;
      riskAdjustedPositionSize = riskAdjustedPositionSize;
      kellyFraction = clampedKelly;
      maxDrawdownEstimate = maxDrawdownEstimate;
      atrValue = atr.value;
      recommendedLeverage = recommendedLeverage;
    };
  };
};
