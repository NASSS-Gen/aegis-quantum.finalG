import MarketDataTypes "../types/marketData";
import ModelsLib "../lib/models";
import QuantTypes "../types/quant";
import Types "../types/models";

mixin () {
  // ─── Public API for quant model signal generation ────────────────────────
  // Thin async pass-throughs to lib/models.mo. Each endpoint takes OHLC[]
  // (and for pairs, two OHLC[] arrays) plus a QuantSettings and returns a
  // ModelSignal. The lib functions are pure (no store dependencies), so the
  // mixin layer simply awaits the call.

  public func generateMeanReversionSignal(
    ohlc : [MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : async Types.ModelSignal {
    ModelsLib.generateMeanReversionSignal(ohlc, settings);
  };

  public func generateMomentumSignal(
    ohlc : [MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : async Types.ModelSignal {
    ModelsLib.generateMomentumSignal(ohlc, settings);
  };

  public func generatePairsSignal(
    ohlcA : [MarketDataTypes.OHLC],
    ohlcB : [MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : async Types.ModelSignal {
    ModelsLib.generatePairsSignal(ohlcA, ohlcB, settings);
  };

  public func generateModelSignal(
    model : Types.QuantModel,
    ohlcA : [MarketDataTypes.OHLC],
    ohlcB : ?[MarketDataTypes.OHLC],
    settings : QuantTypes.QuantSettings,
  ) : async Types.ModelSignal {
    ModelsLib.generateModelSignal(model, ohlcA, ohlcB, settings);
  };
};
