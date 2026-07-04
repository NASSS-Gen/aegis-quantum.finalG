import Common "../types/common";

module {
  // Re-export the canonical Result type from common.mo so this module's
  // historical `Types.Result` references keep working without duplicating
  // the definition (which caused schema drift).
  public type Result<T, E> = Common.Result<T, E>;

  // ─── OHLC Candle ───────────────────────────────────────────────────────
  public type OHLC = {
    timestamp : Nat;
    open : Float;
    high : Float;
    low : Float;
    close : Float;
    volume : Float;
  };

  // ─── Cache Entry ───────────────────────────────────────────────────────
  public type CacheEntry = {
    value : Text;
    cachedAt : Nat;
  };

  // ─── Price Cache ───────────────────────────────────────────────────────
  public type PriceCache = {
    var entries : [(Text, CacheEntry)];
  };
};
