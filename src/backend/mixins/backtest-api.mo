import Types "../types/quant";
import Common "../types/common";
import BacktestLib "../lib/backtest";
import MarketDataLib "../lib/marketData";
import MarketDataTypes "../types/marketData";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  store : BacktestLib.BacktestStore,
  cache : MarketDataLib.MarketDataCache,
  transform : OutCall.Transform,
) {
  // ─── runBacktest ──────────────────────────────────────────────────────
  // Fetch historical OHLC for the configured asset/date range, run the
  // backtesting engine, persist the result, and return it. For the #pairs
  // model the second asset's OHLC is fetched via pairsAssetId and passed to
  // the engine alongside the primary series.
  public shared func runBacktest(config : Types.BacktestConfig) : async Types.BacktestResult {
    let ohlc = await fetchOHLC(config.assetId, config.assetClass, config.startDate, config.endDate);
    let result = switch (config.model) {
      case (#pairs) {
        switch (config.pairsAssetId) {
          case (?pairsId) {
            let pairsOhlc = await fetchOHLC(pairsId, config.assetClass, config.startDate, config.endDate);
            BacktestLib.runBacktestPairs(config, ohlc, pairsOhlc);
          };
          case null BacktestLib.runBacktest(config, ohlc);
        };
      };
      case _ BacktestLib.runBacktest(config, ohlc);
    };
    ignore BacktestLib.storeResult(store, result);
    result;
  };

  // ─── runModelComparison ───────────────────────────────────────────────
  // Run all four quant models over the same asset/date range and return a
  // side-by-side ModelComparison. The OHLC is fetched once and reused for
  // every model; for the #pairs model the second asset's OHLC is fetched
  // via pairsAssetId (when provided). Nothing is persisted — the comparison
  // is computed on demand.
  public shared func runModelComparison(
    assetId : Common.AssetId,
    assetClass : Common.AssetClass,
    pairsAssetId : ?Common.AssetId,
    timeframe : Common.Timeframe,
    startDate : Common.Timestamp,
    endDate : Common.Timestamp,
    initialCapital : Float,
    strategyParams : Types.QuantSettings,
  ) : async Types.ModelComparison {
    let ohlc = await fetchOHLC(assetId, assetClass, startDate, endDate);
    let pairsOhlc = switch (pairsAssetId) {
      case (?id) {
        let po = await fetchOHLC(id, assetClass, startDate, endDate);
        ?po;
      };
      case null null;
    };
    let baseConfig : Types.BacktestConfig = {
      assetId = assetId;
      assetClass = assetClass;
      timeframe = timeframe;
      startDate = startDate;
      endDate = endDate;
      initialCapital = initialCapital;
      runLabel = null;
      strategyParams = strategyParams;
      model = #auto;
      walkForwardSplit = 0.0;
      includeRegimeBreakdown = false;
      pairsAssetId = pairsAssetId;
    };
    BacktestLib.runModelComparison(ohlc, pairsOhlc, baseConfig);
  };

  // ─── getBacktestHistory ───────────────────────────────────────────────
  // Return all stored backtest summaries (lightweight, no equity curve).
  public query func getBacktestHistory() : async [Types.BacktestSummary] {
    BacktestLib.getHistory(store);
  };

  // ─── getBacktestResult ────────────────────────────────────────────────
  // Return the full stored result for a single backtest by id.
  public query func getBacktestResult(id : Nat) : async ?Types.BacktestResult {
    BacktestLib.getResult(store, id);
  };

  // ─── OHLC fetch dispatch ──────────────────────────────────────────────
  // Selects the right market-data source based on assetClass and fetches the
  // OHLC series for the configured date range. The date range is mapped to a
  // fetch range/days parameter appropriate to each provider.
  func fetchOHLC(
    assetId : Common.AssetId,
    assetClass : Common.AssetClass,
    startDate : Common.Timestamp,
    endDate : Common.Timestamp,
  ) : async [MarketDataTypes.OHLC] {
    let days = daysBetween(startDate, endDate);
    let ohlcResult = if (assetClass == "india") {
      let range = yahooRange(days);
      await MarketDataLib.fetchIndianStockOHLC(transform, cache, assetId, range);
    } else if (assetClass == "forex") {
      await MarketDataLib.fetchForexOHLC(transform, cache, assetId, "USD", days);
    } else {
      await MarketDataLib.fetchCryptoOHLC(transform, cache, assetId, days);
    };
    switch (ohlcResult) {
      case (#Ok(data)) filterByDate(data, startDate, endDate);
      case (#Err(_)) [];
    };
  };

  // Map a day count to a Yahoo Finance `range` parameter. Yahoo accepts
  // fixed tokens; pick the smallest one that covers the requested span.
  // Supports 1-5 year historical ranges (1y/2y/3y/5y) for multi-year
  // backtesting on 3-5 years of data.
  func yahooRange(days : Nat) : Text {
    if (days <= 30) { "1mo" }
    else if (days <= 90) { "3mo" }
    else if (days <= 180) { "6mo" }
    else if (days <= 365) { "1y" }
    else if (days <= 730) { "2y" }
    else if (days <= 1095) { "3y" }
    else if (days <= 1825) { "5y" }
    else { "max" };
  };

  // Compute the number of days between two Unix timestamps (seconds).
  func daysBetween(start : Common.Timestamp, end : Common.Timestamp) : Nat {
    if (end <= start) { 30 } else {
      let seconds = end - start;
      seconds / 86400;
    };
  };

  // Filter an OHLC series to the configured [startDate, endDate] window.
  func filterByDate(
    ohlc : [MarketDataTypes.OHLC],
    start : Common.Timestamp,
    end : Common.Timestamp,
  ) : [MarketDataTypes.OHLC] {
    ohlc.filter(func(c) {
      c.timestamp >= start and c.timestamp <= end;
    });
  };
};
