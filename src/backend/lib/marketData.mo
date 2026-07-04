import Char "mo:core/Char";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Text "mo:core/Text";
import Time "mo:core/Time";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/marketData";

module {
  public type MarketDataCache = {
    var priceEntries : [(Text, Types.CacheEntry)];
    var ohlcEntries : [(Text, Types.CacheEntry)];
  };

  public func emptyCache() : MarketDataCache {
    { var priceEntries = []; var ohlcEntries = [] };
  };

  // ─── Cache helpers ─────────────────────────────────────────────────────
  private func getCached(entries : [(Text, Types.CacheEntry)], key : Text, ttlSeconds : Nat) : ?Text {
    let now = Int.abs(Time.now());
    switch (entries.find(func(e) { e.0 == key })) {
      case (?entry) {
        let age = Int.abs(now - entry.1.cachedAt);
        if (age < ttlSeconds * 1_000_000_000) {
          ?entry.1.value;
        } else {
          null;
        };
      };
      case null null;
    };
  };

  private func setCached(entries : [(Text, Types.CacheEntry)], key : Text, value : Text) : [(Text, Types.CacheEntry)] {
    let now = Int.abs(Time.now());
    let filtered = entries.filter(func(e) { e.0 != key });
    filtered.concat([(key, { value; cachedAt = now })]);
  };

  // ─── Yahoo Finance: Indian Stock OHLC ──────────────────────────────────
  public func fetchIndianStockOHLC(
    transform : OutCall.Transform,
    cache : MarketDataCache,
    symbol : Text,
    range : Text,
  ) : async Types.Result<[Types.OHLC], Text> {
    let cacheKey = "yahoo:" # symbol # ":" # range;
    let ttlSeconds = 300; // 5 minutes for OHLC

    switch (getCached(cache.ohlcEntries, cacheKey, ttlSeconds)) {
      case (?cached) {
        #Ok(parseOHLCArray(cached));
      };
      case null {
        let url = "https://query1.finance.yahoo.com/v8/finance/chart/" # symbol # ".NS?interval=1d&range=" # range;
        try {
          let _response = await OutCall.httpGetRequest(url, [], transform);
          cache.ohlcEntries := setCached(cache.ohlcEntries, cacheKey, _response);
          #Ok(parseOHLCArray(_response));
        } catch (e) {
          #Err("Failed to fetch Indian stock OHLC: " # symbol);
        };
      };
    };
  };

  // ─── CoinGecko: Crypto OHLC ────────────────────────────────────────────
  public func fetchCryptoOHLC(
    transform : OutCall.Transform,
    cache : MarketDataCache,
    coinId : Text,
    days : Nat,
  ) : async Types.Result<[Types.OHLC], Text> {
    let cacheKey = "coingecko:ohlc:" # coinId # ":" # days.toText();
    let ttlSeconds = 300; // 5 minutes for OHLC

    switch (getCached(cache.ohlcEntries, cacheKey, ttlSeconds)) {
      case (?cached) {
        #Ok(parseCoinGeckoOHLC(cached));
      };
      case null {
        let url = "https://api.coingecko.com/api/v3/coins/" # coinId # "/ohlc?vs_currency=usd&days=" # days.toText();
        try {
          let _response = await OutCall.httpGetRequest(url, [], transform);
          cache.ohlcEntries := setCached(cache.ohlcEntries, cacheKey, _response);
          #Ok(parseCoinGeckoOHLC(_response));
        } catch (e) {
          #Err("Failed to fetch crypto OHLC: " # coinId);
        };
      };
    };
  };

  // ─── CoinGecko: Crypto Price ─────────────────────────────────────────────
  public func fetchCryptoPrice(
    transform : OutCall.Transform,
    cache : MarketDataCache,
    coinId : Text,
  ) : async Types.Result<Float, Text> {
    let cacheKey = "coingecko:price:" # coinId;
    let ttlSeconds = 60; // 60 seconds for prices

    switch (getCached(cache.priceEntries, cacheKey, ttlSeconds)) {
      case (?cached) {
        #Ok(parsePrice(cached));
      };
      case null {
        let url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" # coinId;
        try {
          let _response = await OutCall.httpGetRequest(url, [], transform);
          cache.priceEntries := setCached(cache.priceEntries, cacheKey, _response);
          #Ok(parsePrice(_response));
        } catch (e) {
          #Err("Failed to fetch crypto price: " # coinId);
        };
      };
    };
  };

  // ─── Frankfurter: Forex OHLC ───────────────────────────────────────────
  public func fetchForexOHLC(
    transform : OutCall.Transform,
    cache : MarketDataCache,
    baseCurrency : Text,
    quoteCurrency : Text,
    days : Nat,
  ) : async Types.Result<[Types.OHLC], Text> {
    let cacheKey = "frankfurter:ohlc:" # baseCurrency # ":" # quoteCurrency # ":" # days.toText();
    let ttlSeconds = 300; // 5 minutes for OHLC

    switch (getCached(cache.ohlcEntries, cacheKey, ttlSeconds)) {
      case (?cached) {
        #Ok(parseFrankfurterOHLC(cached));
      };
      case null {
        let url = "https://api.frankfurter.app/" # days.toText() # "..today?from=" # baseCurrency # "&to=" # quoteCurrency;
        try {
          let _response = await OutCall.httpGetRequest(url, [], transform);
          cache.ohlcEntries := setCached(cache.ohlcEntries, cacheKey, _response);
          #Ok(parseFrankfurterOHLC(_response));
        } catch (e) {
          #Err("Failed to fetch forex OHLC: " # baseCurrency # "/" # quoteCurrency);
        };
      };
    };
  };

  // ─── Frankfurter: Forex Price ────────────────────────────────────────────
  public func fetchForexPrice(
    transform : OutCall.Transform,
    cache : MarketDataCache,
    baseCurrency : Text,
    quoteCurrency : Text,
  ) : async Types.Result<Float, Text> {
    let cacheKey = "frankfurter:price:" # baseCurrency # ":" # quoteCurrency;
    let ttlSeconds = 60; // 60 seconds for prices

    switch (getCached(cache.priceEntries, cacheKey, ttlSeconds)) {
      case (?cached) {
        #Ok(parseFrankfurterPrice(cached));
      };
      case null {
        let url = "https://api.frankfurter.app/latest?from=" # baseCurrency # "&to=" # quoteCurrency;
        try {
          let _response = await OutCall.httpGetRequest(url, [], transform);
          cache.priceEntries := setCached(cache.priceEntries, cacheKey, _response);
          #Ok(parseFrankfurterPrice(_response));
        } catch (e) {
          #Err("Failed to fetch forex price: " # baseCurrency # "/" # quoteCurrency);
        };
      };
    };
  };

  // ─── JSON Parsing ──────────────────────────────────────────────────────
  // Minimal hand-rolled JSON parser. Motoko has no JSON library, so we
  // implement just enough to extract the fields these market-data endpoints
  // return. Malformed tokens are skipped gracefully — a bad entry is dropped
  // rather than aborting the whole fetch.

  public type JsonValue = {
    #Null;
    #Bool : Bool;
    #Number : Float;
    #String : Text;
    #Array : [JsonValue];
    #Object : [(Text, JsonValue)];
  };

  // Parser state: the source text and a mutable cursor.
  private type Parser = { src : Text; var pos : Nat };

  private func isSpace(c : Char) : Bool {
    c == ' ' or c == '\t' or c == '\n' or c == '\r';
  };

  // Double-quote char literal ('"') trips the Motoko lexer; compare by ASCII
  // code point 34 instead.
  private func isQuote(c : Char) : Bool {
    c.toNat32() == 34;
  };

  // Map a JSON escape char to its unescaped form. Avoids tricky char literals
  // like '\b' / '\f' that confuse the lexer by using Char.fromNat with the
  // ASCII code point directly. Unknown escapes keep the literal char.
  private func unescape(esc : Char) : Char {
    switch (esc.toNat32()) {
      case 34 esc; // "  -> "
      case 92 esc; // \  -> \
      case 47 esc; // /  -> /
      case 110 Char.fromNat32(10); // n  -> \n
      case 116 Char.fromNat32(9); // t  -> \t
      case 114 Char.fromNat32(13); // r  -> \r
      case 98 Char.fromNat32(8); // b  -> \b
      case 102 Char.fromNat32(12); // f  -> \f
      case _ esc; // unknown — keep literal
    };
  };

  private func isDigit(c : Char) : Bool {
    c >= '0' and c <= '9';
  };

  // Convert a decimal digit char to its Nat value (0..9). Returns 0 for
  // non-digits — callers guard with isDigit first.
  private func digitValue(c : Char) : Nat {
    c.toNat32().toNat() - 48;
  };

  private func peek(p : Parser) : ?Char {
    let chars = p.src.toArray();
    if (p.pos < chars.size()) ?chars[p.pos] else null;
  };

  private func advance(p : Parser) : ?Char {
    let chars = p.src.toArray();
    if (p.pos < chars.size()) {
      let c = chars[p.pos];
      p.pos += 1;
      ?c;
    } else null;
  };

  private func skipWhitespace(p : Parser) {
    while (true) {
      switch (peek(p)) {
        case (?c) {
          if (isSpace(c)) { p.pos += 1 } else return;
        };
        case null return;
      };
    };
  };

  // Parse a JSON number (supports optional leading '-', integer part, optional
  // fractional part, optional exponent). Returns 0.0 on malformed input.
  private func parseNumber(p : Parser) : Float {
    let chars = p.src.toArray();
    let start = p.pos;
    if (p.pos < chars.size() and chars[p.pos] == '-') { p.pos += 1 };
    while (p.pos < chars.size() and isDigit(chars[p.pos])) { p.pos += 1 };
    if (p.pos < chars.size() and chars[p.pos] == '.') {
      p.pos += 1;
      while (p.pos < chars.size() and isDigit(chars[p.pos])) { p.pos += 1 };
    };
    if (p.pos < chars.size() and (chars[p.pos] == 'e' or chars[p.pos] == 'E')) {
      p.pos += 1;
      if (p.pos < chars.size() and (chars[p.pos] == '+' or chars[p.pos] == '-')) { p.pos += 1 };
      while (p.pos < chars.size() and isDigit(chars[p.pos])) { p.pos += 1 };
    };
    let numText = Text.fromArray(chars.sliceToArray(start, p.pos));
    textToFloat(numText);
  };

  // Parse a JSON string (handles basic escapes). Returns "" on malformed.
  private func parseString(p : Parser) : Text {
    let chars = p.src.toArray();
    // Expect opening quote already consumed by caller; here we read until closing quote.
    var result : Text = "";
    while (p.pos < chars.size()) {
      let c = chars[p.pos];
      p.pos += 1;
      if (isQuote(c)) { return result };
      if (c == '\\' and p.pos < chars.size()) {
        let esc = chars[p.pos];
        p.pos += 1;
        let ch = unescape(esc);
        result := result # ch.toText();
      } else {
        result := result # c.toText();
      };
    };
    result;
  };

  // Parse any JSON value at the current cursor.
  private func parseValue(p : Parser) : JsonValue {
    skipWhitespace(p);
    let chars = p.src.toArray();
    if (p.pos >= chars.size()) { return #Null };
    let c = chars[p.pos];
    if (isQuote(c)) {
      p.pos += 1;
      let s = parseString(p);
      #String(s);
    } else if (c == '{') {
      p.pos += 1;
      parseObject(p);
    } else if (c == '[') {
      p.pos += 1;
      parseArray(p);
    } else if (c == 't') {
      // true
      p.pos += 4;
      #Bool(true);
    } else if (c == 'f') {
      // false
      p.pos += 5;
      #Bool(false);
    } else if (c == 'n') {
      // null
      p.pos += 4;
      #Null;
    } else {
      // number (or invalid)
      #Number(parseNumber(p));
    };
  };

  private func parseObject(p : Parser) : JsonValue {
    var entries : List.List<(Text, JsonValue)> = List.empty();
    let chars = p.src.toArray();
    while (p.pos < chars.size()) {
      skipWhitespace(p);
      if (p.pos >= chars.size()) { return #Object(entries.toArray()) };
      if (chars[p.pos] == '}') { p.pos += 1; return #Object(entries.toArray()) };
      if (chars[p.pos] == ',') { p.pos += 1; continue };
      // Expect a string key
      skipWhitespace(p);
      if (p.pos >= chars.size() or not isQuote(chars[p.pos])) {
        // Malformed — skip to next comma or brace
        skipTo(p, ',');
        continue;
      };
      p.pos += 1;
      let key = parseString(p);
      skipWhitespace(p);
      // Expect ':'
      if (p.pos < chars.size() and chars[p.pos] == ':') { p.pos += 1 } else {
        skipTo(p, ',');
        continue;
      };
      let val = parseValue(p);
      entries.add((key, val));
    };
    #Object(entries.toArray());
  };

  private func parseArray(p : Parser) : JsonValue {
    var items : List.List<JsonValue> = List.empty();
    let chars = p.src.toArray();
    while (p.pos < chars.size()) {
      skipWhitespace(p);
      if (p.pos >= chars.size()) { return #Array(items.toArray()) };
      if (chars[p.pos] == ']') { p.pos += 1; return #Array(items.toArray()) };
      if (chars[p.pos] == ',') { p.pos += 1; continue };
      let val = parseValue(p);
      items.add(val);
    };
    #Array(items.toArray());
  };

  // Advance cursor until we hit one of the delimiter chars (used to skip
  // malformed entries without aborting the whole parse).
  private func skipTo(p : Parser, delim : Char) {
    let chars = p.src.toArray();
    var depth : Nat = 0;
    while (p.pos < chars.size()) {
      let c = chars[p.pos];
      if (depth == 0 and (c == delim or c == '}' or c == ']')) { return };
      if (c == '{' or c == '[') { depth += 1 };
      if (c == '}' or c == ']') {
        if (depth > 0) { depth -= 1 };
      };
      p.pos += 1;
    };
  };

  // ─── JSON accessors ────────────────────────────────────────────────────

  private func getField(obj : JsonValue, key : Text) : ?JsonValue {
    switch (obj) {
      case (#Object(entries)) {
        switch (entries.find(func((k, _v) : (Text, JsonValue)) : Bool { k == key })) {
          case (?(_, v)) ?v;
          case null null;
        };
      };
      case _ null;
    };
  };

  private func asNumber(v : JsonValue) : ?Float {
    switch (v) {
      case (#Number(n)) ?n;
      case (#String(s)) {
        let f = textToFloat(s);
        if (f == 0.0 and s != "0" and s != "0.0") null else ?f;
      };
      case _ null;
    };
  };

  private func asString(v : JsonValue) : ?Text {
    switch (v) {
      case (#String(s)) ?s;
      case _ null;
    };
  };

  private func asArray(v : JsonValue) : ?[JsonValue] {
    switch (v) {
      case (#Array(a)) ?a;
      case _ null;
    };
  };

  // ─── Float parsing helper ──────────────────────────────────────────────
  // Motoko core has no Float.fromText. Parse sign, integer part, fractional
  // part, and optional exponent manually. Returns 0.0 on malformed input.
  private func textToFloat(t : Text) : Float {
    let chars = t.toArray();
    if (chars.size() == 0) { return 0.0 };
    var i = 0;
    var negative = false;
    if (chars[0] == '-') { negative := true; i := 1 }
    else if (chars[0] == '+') { i := 1 };
    var intPart : Float = 0.0;
    while (i < chars.size() and isDigit(chars[i])) {
      intPart := intPart * 10.0 + digitValue(chars[i]).toFloat();
      i += 1;
    };
    var fracPart : Float = 0.0;
    var fracDivisor : Float = 10.0;
    if (i < chars.size() and chars[i] == '.') {
      i += 1;
      while (i < chars.size() and isDigit(chars[i])) {
        fracPart += digitValue(chars[i]).toFloat() / fracDivisor;
        fracDivisor *= 10.0;
        i += 1;
      };
    };
    var value = intPart + fracPart;
    // Exponent
    if (i < chars.size() and (chars[i] == 'e' or chars[i] == 'E')) {
      i += 1;
      var expNeg = false;
      if (i < chars.size() and chars[i] == '-') { expNeg := true; i += 1 }
      else if (i < chars.size() and chars[i] == '+') { i += 1 };
      var exp : Nat = 0;
      while (i < chars.size() and isDigit(chars[i])) {
        exp := exp * 10 + digitValue(chars[i]);
        i += 1;
      };
      var multiplier : Float = 1.0;
      var e = 0;
      while (e < exp) { multiplier *= 10.0; e += 1 };
      if (expNeg) { value := value / multiplier } else { value := value * multiplier };
    };
    if (negative) { -value } else { value };
  };

  // ─── Yahoo Finance: Indian Stock OHLC parser ───────────────────────────
  // Shape: {"chart":{"result":[{"timestamp":[...],"indicators":{"quote":[{"open":[...],"high":[...],"low":[...],"close":[...],"volume":[...]}]}}]}}
  private func parseOHLCArray(_json : Text) : [Types.OHLC] {
    let p : Parser = { src = _json; var pos = 0 };
    let root = parseValue(p);
    let result = getField(root, "chart");
    let resultArr = switch (result) {
      case (?r) getField(r, "result");
      case null null;
    };
    let firstResult = switch (resultArr) {
      case (?(#Array(arr))) {
        if (arr.size() > 0) ?arr[0] else null;
      };
      case _ null;
    };
    let timestamps = switch (firstResult) {
      case (?fr) getField(fr, "timestamp");
      case null null;
    };
    let indicators = switch (firstResult) {
      case (?fr) getField(fr, "indicators");
      case null null;
    };
    let quoteArr = switch (indicators) {
      case (?ind) getField(ind, "quote");
      case null null;
    };
    let quote = switch (quoteArr) {
      case (?(#Array(qa))) {
        if (qa.size() > 0) ?qa[0] else null;
      };
      case _ null;
    };
    let opens = switch (quote) { case (?q) getField(q, "open"); case null null };
    let highs = switch (quote) { case (?q) getField(q, "high"); case null null };
    let lows = switch (quote) { case (?q) getField(q, "low"); case null null };
    let closes = switch (quote) { case (?q) getField(q, "close"); case null null };
    let volumes = switch (quote) { case (?q) getField(q, "volume"); case null null };

    let tsArr = switch (timestamps) { case (?(#Array(a))) a; case _ [] };
    let oArr = switch (opens) { case (?(#Array(a))) a; case _ [] };
    let hArr = switch (highs) { case (?(#Array(a))) a; case _ [] };
    let lArr = switch (lows) { case (?(#Array(a))) a; case _ [] };
    let cArr = switch (closes) { case (?(#Array(a))) a; case _ [] };
    let vArr = switch (volumes) { case (?(#Array(a))) a; case _ [] };

    let n = tsArr.size();
    if (n == 0) { return [] };
    var candles : List.List<Types.OHLC> = List.empty();
    var i = 0;
    while (i < n) {
      // Skip entries where any required field is missing/null
      let ts = asNumber(tsArr[i]);
      let o = if (i < oArr.size()) asNumber(oArr[i]) else null;
      let h = if (i < hArr.size()) asNumber(hArr[i]) else null;
      let l = if (i < lArr.size()) asNumber(lArr[i]) else null;
      let c = if (i < cArr.size()) asNumber(cArr[i]) else null;
      let v = if (i < vArr.size()) asNumber(vArr[i]) else null;
      switch (ts, o, h, l, c) {
        case (?t, ?open, ?high, ?low, ?close) {
          let volume = switch (v) { case (?vol) vol; case null 0.0 };
          candles.add({
              timestamp = Int.abs(t.toInt());
              open = open;
              high = high;
              low = low;
              close = close;
              volume = volume;
            });
        };
        case (_, _, _, _, _) {}; // skip malformed entry
      };
      i += 1;
    };
    candles.toArray();
  };

  // ─── CoinGecko OHLC parser ──────────────────────────────────────────────
  // Shape: [[timestamp, open, high, low, close], ...]
  private func parseCoinGeckoOHLC(_json : Text) : [Types.OHLC] {
    let p : Parser = { src = _json; var pos = 0 };
    let root = parseValue(p);
    let arr = switch (root) {
      case (#Array(a)) a;
      case _ return [];
    };
    var candles : List.List<Types.OHLC> = List.empty();
    for (entry in arr.values()) {
      let candleArr = switch (entry) {
        case (#Array(ca)) ca;
        case _ continue; // skip malformed entry
      };
      if (candleArr.size() < 5) { continue };
      let ts = asNumber(candleArr[0]);
      let o = asNumber(candleArr[1]);
      let h = asNumber(candleArr[2]);
      let l = asNumber(candleArr[3]);
      let c = asNumber(candleArr[4]);
      switch (ts, o, h, l, c) {
        case (?t, ?open, ?high, ?low, ?close) {
          candles.add({
              timestamp = Int.abs(t.toInt());
              open = open;
              high = high;
              low = low;
              close = close;
              volume = 0.0; // CoinGecko OHLC endpoint has no volume
            });
        };
        case (_, _, _, _, _) {}; // skip malformed entry
      };
    };
    candles.toArray();
  };

  // ─── CoinGecko price parser ────────────────────────────────────────────
  // Shape: [{"current_price": 123.45, ...}]
  private func parsePrice(_json : Text) : Float {
    let p : Parser = { src = _json; var pos = 0 };
    let root = parseValue(p);
    let arr = switch (root) {
      case (#Array(a)) {
        if (a.size() > 0) ?a[0] else null;
      };
      case _ null;
    };
    let price = switch (arr) {
      case (?first) getField(first, "current_price");
      case null null;
    };
    switch (price) {
      case (?pr) {
        switch (asNumber(pr)) {
          case (?n) n;
          case null 0.0;
        };
      };
      case null 0.0;
    };
  };

  // ─── Frankfurter forex OHLC parser ─────────────────────────────────────
  // Shape: {"rates":{"2024-01-01":{"USD":1.08},...}}
  // Frankfurter returns daily rates (close-only); we synthesize OHLC where
  // open=high=low=close=rate and volume=0.
  private func parseFrankfurterOHLC(_json : Text) : [Types.OHLC] {
    let p : Parser = { src = _json; var pos = 0 };
    let root = parseValue(p);
    let rates = switch (getField(root, "rates")) {
      case (?r) r;
      case null return [];
    };
    let entries = switch (rates) {
      case (#Object(e)) e;
      case _ return [];
    };
    var candles : List.List<Types.OHLC> = List.empty();
    for ((dateStr, rateObj) in entries.values()) {
      // rateObj is an object like {"USD": 1.08}; take the first (only) value.
      let rateValue = switch (rateObj) {
        case (#Object(pairs)) {
          if (pairs.size() > 0) {
            let (_, v) = pairs[0];
            ?v;
          } else null;
        };
        case _ null;
      };
      switch (rateValue) {
        case (?rv) {
          switch (asNumber(rv)) {
            case (?rate) {
              let ts = dateStrToTimestamp(dateStr);
              candles.add({
                  timestamp = ts;
                  open = rate;
                  high = rate;
                  low = rate;
                  close = rate;
                  volume = 0.0;
                });
            };
            case null {}; // skip malformed rate
          };
        };
        case null {}; // skip malformed entry
      };
    };
    candles.toArray();
  };

  // ─── Frankfurter forex price parser ─────────────────────────────────────
  // Shape: {"rates":{"USD":1.08}}
  private func parseFrankfurterPrice(_json : Text) : Float {
    let p : Parser = { src = _json; var pos = 0 };
    let root = parseValue(p);
    let rates = switch (getField(root, "rates")) {
      case (?r) r;
      case null return 0.0;
    };
    let pairs = switch (rates) {
      case (#Object(e)) e;
      case _ return 0.0;
    };
    if (pairs.size() == 0) { return 0.0 };
    let (_, v) = pairs[0];
    switch (asNumber(v)) {
      case (?n) n;
      case null 0.0;
    };
  };

  // ─── Date string (YYYY-MM-DD) to Unix timestamp ─────────────────────────
  // Frankfurter returns dates as "YYYY-MM-DD". Convert to a Unix timestamp
  // (seconds) using a simple proleptic Gregorian calculation. Returns 0 on
  // malformed input.
  private func dateStrToTimestamp(dateStr : Text) : Nat {
    let parts = dateStr.split(#char '-').toArray();
    if (parts.size() < 3) { return 0 };
    let year = Nat.fromText(parts[0]);
    let month = Nat.fromText(parts[1]);
    let day = Nat.fromText(parts[2]);
    switch (year, month, day) {
      case (?y, ?m, ?d) {
        // Days since Unix epoch (1970-01-01). Proleptic Gregorian.
        // daysFromCivil algorithm (Howard Hinnant).
        let y0 = if (m <= 2) y - 1 else y;
        let era = if (y0 >= 0) y0 / 400 else (y0 - 399) / 400;
        let yoe = y0 - era * 400; // [0, 399]
        let mAdjusted = if (m > 2) m - 3 else m + 9; // [0, 11]
        let doy = (153 * mAdjusted + 2) / 5 + d - 1; // [0, 365]
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy; // [0, 146096]
        let daysSinceEpoch = era * 146097 + doe - 719468;
        Int.abs(daysSinceEpoch) * 86400;
      };
      case (_, _, _) 0;
    };
  };
};
