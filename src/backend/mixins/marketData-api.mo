import Types "../types/marketData";
import MarketDataLib "../lib/marketData";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  cache : MarketDataLib.MarketDataCache,
  transform : OutCall.Transform,
) {
  public shared func getIndianStockOHLC(
    symbol : Text,
    range : Text,
  ) : async Types.Result<[Types.OHLC], Text> {
    await MarketDataLib.fetchIndianStockOHLC(transform, cache, symbol, range);
  };

  public shared func getCryptoOHLC(
    coinId : Text,
    days : Nat,
  ) : async Types.Result<[Types.OHLC], Text> {
    await MarketDataLib.fetchCryptoOHLC(transform, cache, coinId, days);
  };

  public shared func getForexOHLC(
    baseCurrency : Text,
    quoteCurrency : Text,
    days : Nat,
  ) : async Types.Result<[Types.OHLC], Text> {
    await MarketDataLib.fetchForexOHLC(transform, cache, baseCurrency, quoteCurrency, days);
  };

  public shared func getForexPrice(
    baseCurrency : Text,
    quoteCurrency : Text,
  ) : async Types.Result<Float, Text> {
    await MarketDataLib.fetchForexPrice(transform, cache, baseCurrency, quoteCurrency);
  };

  public shared func getCryptoPrice(
    coinId : Text,
  ) : async Types.Result<Float, Text> {
    await MarketDataLib.fetchCryptoPrice(transform, cache, coinId);
  };
};
