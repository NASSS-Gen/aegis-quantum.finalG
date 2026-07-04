import Types "../types/volume";
import MarketDataTypes "../types/marketData";
import MarketDataLib "../lib/marketData";
import VolumeLib "../lib/volumeProfile";
import OutCall "mo:caffeineai-http-outcalls/outcall";

mixin (
  cache : MarketDataLib.MarketDataCache,
  transform : OutCall.Transform,
) {
  // ─── Volume Profile API ────────────────────────────────────────────────
  // Public endpoints exposing the OHLCV-derived volume profile. The mixin
  // fetches OHLC for the asset/scope and delegates the pure computation to
  // lib/volumeProfile.mo. The mixin itself holds no state because volume
  // profile is a pure function of the OHLC window.

  // Fetch OHLC for the asset/scope using the same scope convention as the
  // other mixins (predictions-api, backtest-api): "india" → Yahoo Indian
  // stock, "forex" → Frankfurter, anything else → CoinGecko crypto.
  private func fetchOHLCForVolume(assetId : Text, scope : Text) : async [MarketDataTypes.OHLC] {
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

  // Compute the volume profile for an asset/scope by fetching its OHLC
  // window, then delegating to lib/volumeProfile.mo. binCount defaults to
  // 24 when the caller passes 0 (see lib/volumeProfile.mo defaultBinCount).
  public shared func computeVolumeProfile(
    assetId : Text,
    scope : Text,
    binCount : Nat,
  ) : async Types.VolumeProfile {
    let ohlc = await fetchOHLCForVolume(assetId, scope);
    VolumeLib.computeVolumeProfile(ohlc, binCount);
  };

  // Fetch the volume profile for an asset/scope using the default bin count.
  public shared func getVolumeProfile(
    assetId : Text,
    scope : Text,
  ) : async Types.VolumeProfile {
    let ohlc = await fetchOHLCForVolume(assetId, scope);
    VolumeLib.computeVolumeProfile(ohlc, 0);
  };

  // Adjust a signal confidence (0.0-1.0) using a precomputed volume profile.
  // signalDirection is "long" | "short" (case-insensitive). Returns the
  // adjusted confidence clamped to [0, 1]. Pure query — no market data fetch.
  public query func adjustConfidenceForVolume(
    confidence : Float,
    signalDirection : Text,
    volumeProfile : Types.VolumeProfile,
  ) : async Float {
    VolumeLib.adjustConfidenceForVolume(confidence, signalDirection, volumeProfile);
  };
};
