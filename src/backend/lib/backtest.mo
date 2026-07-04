import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

import Common "../types/common";
import QuantTypes "../types/quant";
import MarketDataTypes "../types/marketData";
import ModelTypes "../types/models";
import RegimeTypes "../types/regime";
import PredictionsLib "predictions";
import ModelsLib "models";
import RegimeLib "regime";

module {
  // ─── Stable store for backtest results ─────────────────────────────────
  // Stores the full BacktestResult keyed by id, plus a sequential nextId.
  // Summaries are derived from the stored results on demand.
  public type BacktestStore = {
    var nextId : Nat;
    var results : [(Nat, QuantTypes.BacktestResult)];
  };

  public func emptyStore() : BacktestStore {
    { var nextId = 0; var results = [] };
  };

  // ─── Signal generation ─────────────────────────────────────────────────
  // A Signal tells the engine whether to enter a position, and in which
  // direction, at a given candle. The engine supports two signal sources:
  //   (1) The legacy indicator-confluence strategy (generateSignal), used
  //       when config.model is #auto. This is the default and the backward-
  //       compatible path.
  //   (2) A quant model generator from lib/models.mo (meanReversion /
  //       momentum / pairs), routed through generateSignalFromModel. The
  //       model returns a ModelSignal whose direction maps onto the engine's
  //       #Enter(#Long) / #Enter(#Short) / #Hold.
  public type Signal = {
    #Enter : QuantTypes.BacktestDirection;
    #Exit;
    #Hold;
  };

  // Generate an entry/exit signal for the candle ending at index `i` using a
  // rolling window of the most recent `lookback` candles. The strategy is a
  // confluence of:
  //   - RSI oversold/overbought (long on oversold, short on overbought)
  //   - MACD histogram sign (long on positive, short on negative)
  //   - Bollinger %B (long below lower, short above upper)
  //   - Stochastic (long oversold, short overbought)
  //   - CCI (long below -100, short above 100)
  // A simple majority vote decides direction; ties produce Hold. An open
  // position is exited when the opposite signal reaches a majority, or when
  // the confluence flips to Neutral.
  func generateSignal(ohlc : [MarketDataTypes.OHLC], i : Nat, lookback : Nat) : Signal {
    if (i < 1) { return #Hold };
    let start = if (i >= lookback) i - lookback else 0;
    let slice = ohlc.sliceToArray(start, i + 1);
    if (slice.size() < 15) { return #Hold };

    let indicators = PredictionsLib.getTechnicalIndicators(slice);

    var bullish = 0;
    var bearish = 0;

    // RSI: oversold -> bullish, overbought -> bearish
    if (indicators.rsi.oversold) { bullish += 1 };
    if (indicators.rsi.overbought) { bearish += 1 };

    // MACD histogram sign
    if (indicators.macd.histogram > 0.0) { bullish += 1 };
    if (indicators.macd.histogram < 0.0) { bearish += 1 };

    // Bollinger %B: below lower band -> bullish, above upper -> bearish
    if (indicators.bollinger.percentB < 0.0) { bullish += 1 };
    if (indicators.bollinger.percentB > 1.0) { bearish += 1 };

    // Stochastic: oversold -> bullish, overbought -> bearish
    if (indicators.stochastic.oversold) { bullish += 1 };
    if (indicators.stochastic.overbought) { bearish += 1 };

    // CCI: below -100 -> bullish, above 100 -> bearish
    if (indicators.cci.oversold) { bullish += 1 };
    if (indicators.cci.overbought) { bearish += 1 };

    if (bullish > bearish and bullish >= 3) { #Enter(#Long) }
    else if (bearish > bullish and bearish >= 3) { #Enter(#Short) }
    else { #Hold };
  };

  // Generate a Signal for candle `i` by delegating to the quant model
  // generator in lib/models.mo. The model sees the OHLC slice up to and
  // including `i`; its ModelDirection maps onto the engine's Signal variant.
  // #neutral → #Hold (no entry; an open position is exited only on an
  // opposite-direction signal, so neutral keeps a position open).
  func generateSignalFromModel(
    model : Common.QuantModel,
    ohlc : [MarketDataTypes.OHLC],
    pairsOhlc : ?[MarketDataTypes.OHLC],
    i : Nat,
    settings : QuantTypes.QuantSettings,
  ) : Signal {
    if (i < 1) { return #Hold };
    let slice = ohlc.sliceToArray(0, i + 1);
    let pairsSlice = switch (pairsOhlc) {
      case (?po) ?(po.sliceToArray(0, Int.abs(Int.min(i + 1, po.size()))));
      case null null;
    };
    let signal = ModelsLib.generateModelSignal(model, slice, pairsSlice, settings);
    switch (signal.direction) {
      case (#long) #Enter(#Long);
      case (#short) #Enter(#Short);
      case (#neutral) #Hold;
    };
  };

  // Dispatch signal generation based on the configured model. #auto (and any
  // unrecognized value) falls back to the legacy confluence strategy so the
  // existing frontend keeps working without changes.
  func signalFor(
    config : QuantTypes.BacktestConfig,
    ohlc : [MarketDataTypes.OHLC],
    pairsOhlc : ?[MarketDataTypes.OHLC],
    i : Nat,
  ) : Signal {
    switch (config.model) {
      case (#auto) generateSignal(ohlc, i, config.strategyParams.backtestLookback);
      case (#meanReversion) generateSignalFromModel(#meanReversion, ohlc, pairsOhlc, i, config.strategyParams);
      case (#momentum) generateSignalFromModel(#momentum, ohlc, pairsOhlc, i, config.strategyParams);
      case (#pairs) generateSignalFromModel(#pairs, ohlc, pairsOhlc, i, config.strategyParams);
    };
  };

  // ─── Position tracking ─────────────────────────────────────────────────
  // A simulated open position. Only one position is open at a time (no
  // pyramiding) to keep the engine simple and the metrics honest.
  public type Position = {
    direction : QuantTypes.BacktestDirection;
    entryIndex : Nat;
    entryTimestamp : Common.Timestamp;
    entryPrice : Float;
    size : Float; // units of the asset
  };

  // Close a position at the given candle and produce a BacktestTrade record.
  func closePosition(
    pos : Position,
    exitIndex : Nat,
    ohlc : [MarketDataTypes.OHLC],
    initialCapital : Float,
  ) : QuantTypes.BacktestTrade {
    let exitCandle = ohlc[exitIndex];
    let exitPrice = exitCandle.close;
    let exitTimestamp = exitCandle.timestamp;

    let rawReturn = switch (pos.direction) {
      case (#Long) (exitPrice - pos.entryPrice) / pos.entryPrice;
      case (#Short) (pos.entryPrice - exitPrice) / pos.entryPrice;
    };
    let returnPercent = rawReturn;
    let pnl = pos.size * (exitPrice - pos.entryPrice) * directionSign(pos.direction);
    let holdingPeriod = exitIndex - pos.entryIndex;

    {
      entryTimestamp = pos.entryTimestamp;
      exitTimestamp = exitTimestamp;
      direction = pos.direction;
      entryPrice = pos.entryPrice;
      exitPrice = exitPrice;
      returnPercent = returnPercent;
      holdingPeriod = holdingPeriod;
      pnl = pnl;
    };
  };

  func directionSign(d : QuantTypes.BacktestDirection) : Float {
    switch (d) {
      case (#Long) 1.0;
      case (#Short) -1.0;
    };
  };

  // ─── Equity curve ──────────────────────────────────────────────────────
  // Build the equity curve by walking the OHLC series and marking-to-market
  // the open position (if any) at each candle close. Drawdown is tracked
  // relative to the running peak equity.
  func buildEquityCurve(
    ohlc : [MarketDataTypes.OHLC],
    trades : [QuantTypes.BacktestTrade],
    initialCapital : Float,
  ) : [QuantTypes.EquityPoint] {
    if (ohlc.size() == 0) { return [] };

    // Index trades by their exit index for quick lookup while walking.
    var equity = initialCapital;
    var peak = initialCapital;
    var realizedPnl = 0.0;
    var tradeIdx = 0;
    let sortedTrades = trades.sort(
      func(a, b) { Nat.compare(a.exitTimestamp, b.exitTimestamp) },
    );

    var points : [QuantTypes.EquityPoint] = [];
    var i = 0;
    while (i < ohlc.size()) {
      let candle = ohlc[i];
      // Realize any trades that exited at this candle.
      while (tradeIdx < sortedTrades.size() and sortedTrades[tradeIdx].exitTimestamp == candle.timestamp) {
        realizedPnl += sortedTrades[tradeIdx].pnl;
        tradeIdx += 1;
      };
      equity := initialCapital + realizedPnl;
      if (equity > peak) { peak := equity };
      let drawdown = if (peak > 0.0) (peak - equity) / peak else 0.0;
      points := points.concat([{
        timestamp = candle.timestamp;
        equity = equity;
        drawdown = drawdown;
      }]);
      i += 1;
    };
    points;
  };

  // ─── Walk-forward split ────────────────────────────────────────────────
  // When walkForwardSplit > 0.0, the OHLC series is divided into an in-sample
  // portion (the first (1 - split) of the candles) and an out-of-sample
  // portion (the last split). Trades are partitioned by their entry index:
  // entries before the split index are in-sample, entries at or after it are
  // out-of-sample. Win rates are computed independently for each partition.
  func splitIndex(ohlcCount : Nat, split : Float) : Nat {
    if (split <= 0.0 or split >= 1.0 or ohlcCount == 0) { return ohlcCount };
    let inSampleFraction = 1.0 - split;
    let idx = Int.abs((Float.fromInt64(ohlcCount.toInt64()) * inSampleFraction).toInt());
    if (idx < 1) { 1 } else if (idx >= ohlcCount) { ohlcCount - 1 } else { idx };
  };

  func winRateOf(trades : [QuantTypes.BacktestTrade]) : Float {
    if (trades.size() == 0) { return 0.0 };
    var wins = 0;
    for (t in trades.values()) {
      if (t.pnl > 0.0) { wins += 1 };
    };
    Float.fromInt64(wins.toInt64()) / Float.fromInt64(trades.size().toInt64());
  };

  // ─── Regime breakdown ─────────────────────────────────────────────────
  // When includeRegimeBreakdown is true, classify the regime at each trade
  // entry using lib/regime.mo detectRegime on the OHLC up to that point, and
  // accumulate wins/losses per regime. Returns null when the flag is false.
  // Regime detection is delegated to lib/regime.mo (implemented in the
  // regime domain develop pass); until then this returns an empty breakdown
  // rather than trapping the whole backtest if detectRegime is unavailable.
  func buildRegimeBreakdown(
    config : QuantTypes.BacktestConfig,
    ohlc : [MarketDataTypes.OHLC],
    trades : [QuantTypes.BacktestTrade],
  ) : ?[QuantTypes.RegimePerformance] {
    if (not config.includeRegimeBreakdown) { return null };
    if (trades.size() == 0) { return ?[] };

    // Accumulate per-regime wins and trade counts in a Map keyed by an
    // integer regime tag (0..3) to avoid variant-keyed map friction.
    let counts = Map.empty<Nat, { var wins : Nat; var total : Nat }>();
    let tagOf = func(r : Common.MarketRegime) : Nat {
      switch (r) {
        case (#trendingUp) 0;
        case (#trendingDown) 1;
        case (#ranging) 2;
        case (#volatile) 3;
      };
    };
    let regimeOf = func(tag : Nat) : Common.MarketRegime {
      switch (tag) {
        case 0 #trendingUp;
        case 1 #trendingDown;
        case 2 #ranging;
        case 3 #volatile;
        case _ #ranging;
      };
    };

    for (t in trades.values()) {
      // Locate the entry candle index by matching the entry timestamp.
      let entryIdx = indexOfTimestamp(ohlc, t.entryTimestamp);
      let regime = switch (entryIdx) {
        case (?i) {
          let slice = ohlc.sliceToArray(0, i + 1);
          RegimeLib.detectRegime(slice).regime;
        };
        case null #ranging;
      };
      let tag = tagOf(regime);
      switch (counts.get(tag)) {
        case (?entry) {
          entry.total += 1;
          if (t.pnl > 0.0) { entry.wins += 1 };
        };
        case null {
          let entry = { var wins = 0; var total = 1 };
          if (t.pnl > 0.0) { entry.wins += 1 };
          counts.add(tag, entry);
        };
      };
    };

    var entries : [QuantTypes.RegimePerformance] = [];
    for ((tag, acc) in counts.entries()) {
      let winRate = if (acc.total == 0) 0.0
        else Float.fromInt64(acc.wins.toInt64()) / Float.fromInt64(acc.total.toInt64());
      entries := entries.concat([{
        regime = regimeOf(tag);
        winRate = winRate;
        tradeCount = acc.total;
      }]);
    };
    ?entries;
  };

  // Linear scan for the index of a timestamp in the OHLC series. Returns null
  // when not found. The series is assumed chronologically ordered.
  func indexOfTimestamp(ohlc : [MarketDataTypes.OHLC], ts : Common.Timestamp) : ?Nat {
    var i = 0;
    while (i < ohlc.size()) {
      if (ohlc[i].timestamp == ts) { return ?i };
      i += 1;
    };
    null;
  };

  // ─── Performance metrics ───────────────────────────────────────────────
  // Compute the comprehensive BacktestMetricsExtended from the trade list
  // and equity curve. Returns zeros when there are no trades. The extended
  // fields (model, regimeBreakdown, walk-forward win rates, calibration
  // table) are populated by the caller via computeExtendedMetrics; this core
  // helper fills the legacy numeric fields and the model attribution.
  func computeMetrics(
    trades : [QuantTypes.BacktestTrade],
    equityCurve : [QuantTypes.EquityPoint],
    initialCapital : Float,
  ) : QuantTypes.BacktestMetricsExtended {
    if (trades.size() == 0) {
      return {
        totalReturn = 0.0;
        winRate = 0.0;
        sharpeRatio = 0.0;
        sortinoRatio = 0.0;
        maxDrawdown = 0.0;
        profitFactor = 0.0;
        averageWin = 0.0;
        averageLoss = 0.0;
        numberOfTrades = 0;
        model = #auto;
        regimeBreakdown = null;
        outOfSampleWinRate = null;
        inSampleWinRate = null;
        calibrationTable = null;
      };
    };

    var wins = 0;
    var losses = 0;
    var grossProfit = 0.0;
    var grossLoss = 0.0;
    var sumWinReturns = 0.0;
    var sumLossReturns = 0.0;
    var totalPnl = 0.0;

    for (t in trades.values()) {
      totalPnl += t.pnl;
      if (t.pnl > 0.0) {
        wins += 1;
        grossProfit += t.pnl;
        sumWinReturns += t.returnPercent;
      } else if (t.pnl < 0.0) {
        losses += 1;
        grossLoss += Float.abs(t.pnl);
        sumLossReturns += t.returnPercent;
      };
    };

    let total = trades.size();
    let winRate = Float.fromInt64(wins.toInt64()) / Float.fromInt64(total.toInt64());
    let totalReturn = if (initialCapital > 0.0) totalPnl / initialCapital else 0.0;
    // Caffeine core fork has no Float.infinity(); use a large finite sentinel.
    let profitFactor = if (grossLoss == 0.0) (if (grossProfit > 0.0) 1e12 else 0.0) else grossProfit / grossLoss;
    let averageWin = if (wins > 0) sumWinReturns / Float.fromInt64(wins.toInt64()) else 0.0;
    let averageLoss = if (losses > 0) sumLossReturns / Float.fromInt64(losses.toInt64()) else 0.0;

    // Max drawdown from the equity curve.
    var maxDrawdown = 0.0;
    for (p in equityCurve.values()) {
      if (p.drawdown > maxDrawdown) { maxDrawdown := p.drawdown };
    };

    // Sharpe and Sortino from per-trade returns. Annualization is omitted
    // (no fixed trading frequency across asset classes); the ratios are
    // computed on the trade return series directly.
    let returns = trades.map(
      func(t) { t.returnPercent },
    );
    let mean = returns.foldLeft(0.0, func(acc, r) { acc + r }) / Float.fromInt64(returns.size().toInt64());
    let variance = returns.foldLeft(0.0, func(acc, r) {
      let d = r - mean;
      acc + d * d;
    }) / Float.fromInt64(returns.size().toInt64());
    let stddev = Float.sqrt(variance);
    let sharpeRatio = if (stddev == 0.0) 0.0 else mean / stddev;

    // Sortino: only penalize downside deviation.
    let downsideVariance = returns.foldLeft(0.0, func(acc, r) {
      if (r < 0.0) {
        let d = r - mean;
        acc + d * d;
      } else { acc };
    }) / Float.fromInt64(returns.size().toInt64());
    let downsideDev = Float.sqrt(downsideVariance);
    let sortinoRatio = if (downsideDev == 0.0) 0.0 else mean / downsideDev;

    {
      totalReturn = totalReturn;
      winRate = winRate;
      sharpeRatio = sharpeRatio;
      sortinoRatio = sortinoRatio;
      maxDrawdown = maxDrawdown;
      profitFactor = profitFactor;
      averageWin = averageWin;
      averageLoss = averageLoss;
      numberOfTrades = total;
      model = #auto;
      regimeBreakdown = null;
      outOfSampleWinRate = null;
      inSampleWinRate = null;
      calibrationTable = null;
    };
  };

  // Populate the extended metrics fields (model attribution, regime
  // breakdown, walk-forward in/out-of-sample win rates) on top of the core
  // metrics. The calibration table is left null here — it is computed by
  // lib/calibration.mo from prediction history, not from a single run.
  func withExtendedFields(
    base : QuantTypes.BacktestMetricsExtended,
    model : Common.QuantModel,
    regimeBreakdown : ?[QuantTypes.RegimePerformance],
    outOfSampleWinRate : ?Float,
    inSampleWinRate : ?Float,
  ) : QuantTypes.BacktestMetricsExtended {
    {
      base with
      model = model;
      regimeBreakdown = regimeBreakdown;
      outOfSampleWinRate = outOfSampleWinRate;
      inSampleWinRate = inSampleWinRate;
    };
  };

  // ─── Main engine entry point ───────────────────────────────────────────
  // Run the strategy over the provided OHLC series and return a complete
  // BacktestResult. The OHLC array is assumed to already be filtered to the
  // requested date range and timeframe by the caller (the mixin). For the
  // #pairs model, the second asset's OHLC is supplied via pairsOhlc.
  //
  // The public runBacktest(config, ohlc) preserves the original signature
  // for backward compatibility and delegates here with pairsOhlc = null.
  public func runBacktest(
    config : QuantTypes.BacktestConfig,
    ohlc : [MarketDataTypes.OHLC],
  ) : QuantTypes.BacktestResult {
    runBacktestImpl(config, ohlc, null);
  };

  // Run a backtest with a second asset's OHLC for the #pairs model. For all
  // other models the pairsOhlc argument is ignored.
  public func runBacktestPairs(
    config : QuantTypes.BacktestConfig,
    ohlc : [MarketDataTypes.OHLC],
    pairsOhlc : [MarketDataTypes.OHLC],
  ) : QuantTypes.BacktestResult {
    runBacktestImpl(config, ohlc, ?pairsOhlc);
  };

  func runBacktestImpl(
    config : QuantTypes.BacktestConfig,
    ohlc : [MarketDataTypes.OHLC],
    pairsOhlc : ?[MarketDataTypes.OHLC],
  ) : QuantTypes.BacktestResult {
    let runAt = Int.abs(Time.now());
    let lookback = config.strategyParams.backtestLookback;
    let riskFraction = config.strategyParams.maxRiskPercent / 100.0;

    var trades : [QuantTypes.BacktestTrade] = [];
    // Track the entry index alongside each trade so walk-forward partitioning
    // and regime classification can use it without re-scanning the OHLC.
    var entryIndices : [Nat] = [];
    var openPos : ?Position = null;
    var equity = config.initialCapital;

    var i = 1;
    while (i < ohlc.size()) {
      let candle = ohlc[i];
      let signal = signalFor(config, ohlc, pairsOhlc, i);

      // If a position is open, check for exit conditions first.
      switch (openPos) {
        case (?pos) {
          let shouldExit = switch (signal) {
            case (#Enter(dir)) dir != pos.direction;
            case (#Exit) true;
            case (#Hold) false;
          };
          if (shouldExit) {
            let trade = closePosition(pos, i, ohlc, config.initialCapital);
            trades := trades.concat([trade]);
            entryIndices := entryIndices.concat([pos.entryIndex]);
            equity := equity + trade.pnl;
            openPos := null;
          };
        };
        case null {};
      };

      // If flat, check for entry conditions.
      if (openPos == null) {
        switch (signal) {
          case (#Enter(dir)) {
            let entryPrice = candle.close;
            // Risk a fixed fraction of current equity per trade. Position
            // size in asset units = (equity * riskFraction) / entryPrice.
            let riskAmount = equity * riskFraction;
            let size = if (entryPrice > 0.0) riskAmount / entryPrice else 0.0;
            if (size > 0.0) {
              openPos := ?{
                direction = dir;
                entryIndex = i;
                entryTimestamp = candle.timestamp;
                entryPrice = entryPrice;
                size = size;
              };
            };
          };
          case _ {};
        };
      };

      i += 1;
    };

    // Close any position still open at the last candle.
    switch (openPos) {
      case (?pos) {
        let last = ohlc.size() - 1;
        let trade = closePosition(pos, last, ohlc, config.initialCapital);
        trades := trades.concat([trade]);
        entryIndices := entryIndices.concat([pos.entryIndex]);
      };
      case null {};
    };

    let tradeArray = trades;
    let entryIndexArray = entryIndices;
    let equityCurve = buildEquityCurve(ohlc, tradeArray, config.initialCapital);
    let baseMetrics = computeMetrics(tradeArray, equityCurve, config.initialCapital);

    // ── Walk-forward in/out-of-sample win rates ──────────────────────────
    let (inSampleWinRate, outOfSampleWinRate) = if (config.walkForwardSplit > 0.0) {
      let splitIdx = splitIndex(ohlc.size(), config.walkForwardSplit);
      var inTrades : [QuantTypes.BacktestTrade] = [];
      var outTrades : [QuantTypes.BacktestTrade] = [];
      var k = 0;
      while (k < tradeArray.size()) {
        let entryIdx = if (k < entryIndexArray.size()) entryIndexArray[k] else 0;
        if (entryIdx < splitIdx) {
          inTrades := inTrades.concat([tradeArray[k]]);
        } else {
          outTrades := outTrades.concat([tradeArray[k]]);
        };
        k += 1;
      };
      (?winRateOf(inTrades), ?winRateOf(outTrades));
    } else {
      (null, null);
    };

    // ── Regime breakdown ─────────────────────────────────────────────────
    let regimeBreakdown = buildRegimeBreakdown(config, ohlc, tradeArray);

    let metrics = withExtendedFields(
      baseMetrics,
      config.model,
      regimeBreakdown,
      outOfSampleWinRate,
      inSampleWinRate,
    );

    {
      config = config;
      equityCurve = equityCurve;
      trades = tradeArray;
      metrics = metrics;
      runAt = runAt;
    };
  };

  // ─── Model comparison ─────────────────────────────────────────────────
  // Run all four QuantModel variants over the same asset/date range and
  // return a side-by-side ModelComparison. The OHLC (and pairs OHLC for the
  // #pairs model) must already be fetched by the caller; this function is
  // synchronous and performs no I/O. It reuses runBacktestImpl per model.
  public func runModelComparison(
    ohlc : [MarketDataTypes.OHLC],
    pairsOhlc : ?[MarketDataTypes.OHLC],
    baseConfig : QuantTypes.BacktestConfig,
  ) : QuantTypes.ModelComparison {
    let models : [Common.QuantModel] = [#auto, #meanReversion, #momentum, #pairs];
    var entries : [QuantTypes.ModelComparisonEntry] = [];
    for (model in models.values()) {
      let config = { baseConfig with model = model };
      let result = runBacktestImpl(config, ohlc, pairsOhlc);
      let entry : QuantTypes.ModelComparisonEntry = {
        model = model;
        winRate = result.metrics.winRate;
        sharpe = result.metrics.sharpeRatio;
        maxDrawdown = result.metrics.maxDrawdown;
        profitFactor = result.metrics.profitFactor;
        totalTrades = result.metrics.numberOfTrades;
        outOfSampleWinRate = result.metrics.outOfSampleWinRate;
      };
      entries := entries.concat([entry]);
    };
    {
      assetId = baseConfig.assetId;
      timeframe = baseConfig.timeframe;
      dateRange = dateRangeText(baseConfig.startDate, baseConfig.endDate);
      results = entries;
    };
  };

  // Format the date range as a human-readable label for ModelComparison.
  func dateRangeText(start : Common.Timestamp, end : Common.Timestamp) : Text {
    start.toText() # ".." # end.toText();
  };

  // ─── Persistence helpers ───────────────────────────────────────────────
  // Store a completed BacktestResult and return its assigned id.
  public func storeResult(
    store : BacktestStore,
    result : QuantTypes.BacktestResult,
  ) : Nat {
    let id = store.nextId;
    store.nextId += 1;
    store.results := store.results.concat([(id, result)]);
    id;
  };

  // Derive a lightweight summary from a stored result for history listings.
  public func toSummary(
    id : Nat,
    result : QuantTypes.BacktestResult,
    status : QuantTypes.BacktestStatus,
  ) : QuantTypes.BacktestSummary {
    {
      id = id;
      config = result.config;
      metrics = result.metrics;
      status = status;
      runAt = result.runAt;
      tradeCount = result.trades.size();
      runLabel = result.config.runLabel;
    };
  };

  // Return all stored summaries, ordered by id ascending.
  public func getHistory(store : BacktestStore) : [QuantTypes.BacktestSummary] {
    store.results.map(
      func((id, result)) {
        toSummary(id, result, #Completed);
      },
    );
  };

  // Look up a single stored result by id.
  public func getResult(store : BacktestStore, id : Nat) : ?QuantTypes.BacktestResult {
    switch (store.results.find(func((rid, _r)) { rid == id })) {
      case (?(_, r)) ?r;
      case null null;
    };
  };
};
