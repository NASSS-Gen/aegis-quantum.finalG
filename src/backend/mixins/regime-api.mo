import Types "../types/regime";
import Common "../types/common";
import RegimeLib "../lib/regime";
import MarketDataLib "../lib/marketData";
import MarketDataTypes "../types/marketData";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  cache : MarketDataLib.MarketDataCache,
  transform : OutCall.Transform,
) {
  // ─── Regime API ────────────────────────────────────────────────────────
  // Public endpoints exposing adaptive regime detection. The mixin fetches
  // OHLC for the asset/scope and delegates the pure computation to
  // lib/regime.mo. The mixin itself holds no state because regime detection
  // is a pure function of the OHLC window.

  // Fetch OHLC for the asset/scope, then run adaptive regime detection.
  public shared func detectRegime(
    assetId : Text,
    scope : Text,
  ) : async Types.RegimeAssessment {
    let ohlc = await fetchOHLCForRegime(assetId, scope);
    RegimeLib.detectRegime(ohlc);
  };

  // Fetch OHLC and return the regime history strip over the last `lookback`
  // candles.
  public shared func getRegimeHistory(
    assetId : Text,
    scope : Text,
    lookback : Nat,
  ) : async [Types.RegimeHistoryEntry] {
    let ohlc = await fetchOHLCForRegime(assetId, scope);
    RegimeLib.getRegimeHistory(ohlc, lookback);
  };

  // Pure strategy-weighting adapter — no market data fetch needed.
  public query func getRegimeStrategyWeights(
    regime : Common.MarketRegime,
  ) : async Types.RegimeStrategyWeights {
    RegimeLib.getRegimeStrategyWeights(regime);
  };

  // ─── OHLC fetch helper ─────────────────────────────────────────────────
  // Mirrors the scope-to-fetch mapping used by predictions-api.mo so the
  // regime endpoints see the same OHLC window as the rest of the engine.
  func fetchOHLCForRegime(assetId : Text, scope : Text) : async [MarketDataTypes.OHLC] {
    let ohlcResult = if (scope == "india") {
      await MarketDataLib.fetchIndianStockOHLC(transform, cache, assetId, "1mo");
    } else if (scope == "forex") {
      await MarketDataLib.fetchForexOHLC(transform, cache, assetId, "USD", 30);
    } else {
      await MarketDataLib.fetchCryptoOHLC(transform, cache, assetId, 30);
    };
    switch (ohlcResult) {
      case (#Ok(data)) data;
      case (#Err(_)) [];
    };
  };
};
