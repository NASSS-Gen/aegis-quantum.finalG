import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import VarArray "mo:core/VarArray";
import Types "../types/volume";
import MarketDataTypes "../types/marketData";

module {
  // ─── Volume Profile ─────────────────────────────────────────────────────
  // Pure-Motoko volume profile analysis from OHLCV candles. No external
  // libraries — only Float arithmetic.
  //
  // Volume fallback: some market-data sources (CoinGecko OHLC, Frankfurter
  // forex) do not return volume, so candle.volume is 0.0. To keep the model
  // useful in that case, we synthesize a proxy volume of (high - low) * 1.0
  // whenever the real volume is missing or zero. This is documented inline
  // at the point of use below.

  // Default number of horizontal price bins when the caller does not
  // specify one (per the requirements: default 24).
  public let defaultBinCount : Nat = 24;

  // Value area target — standard volume-profile definition: the price range
  // containing 70% of total volume centered on the POC.
  public let valueAreaPercent : Float = 0.70;

  // High-volume node threshold: a bin is an HVN if its volume exceeds 1.5x
  // the average bin volume.
  public let hvnMultiplier : Float = 1.5;

  // Low-volume node threshold: a bin is an LVN if its volume is below 0.5x
  // the average bin volume.
  public let lvnMultiplier : Float = 0.5;

  // Number of top HVN / LVN price levels to return.
  public let topNodeCount : Nat = 3;

  // Proximity band (as a fraction of price) used to classify the latest
  // close as POC / HVN / LVN — within 0.5% of a node.
  public let nodeProximityBand : Float = 0.005;

  // Maximum confidence adjustment magnitude (±0.1) applied by
  // adjustConfidenceForVolume.
  public let maxConfidenceAdjustment : Float = 0.10;

  // ─── Public API ──────────────────────────────────────────────────────────

  // computeVolumeProfile(ohlc, binCount): divide the price range (min low to
  // max high) into binCount horizontal bins. For each candle, distribute its
  // volume across the bins its range (low to high) overlaps, weighted by the
  // fraction of the bin the candle covers. The bin with the highest total
  // volume is the POC. Also derives the value area (70% of volume centered on
  // POC), top-3 HVN/LVN nodes, buy/sell pressure, and the latest close's
  // node classification and value-area position.
  public func computeVolumeProfile(
    ohlc : [MarketDataTypes.OHLC],
    binCount : Nat,
  ) : Types.VolumeProfile {
    // Resolve the effective bin count — caller passes 0 to request the
    // default (see defaultBinCount above).
    let effectiveBins = if (binCount == 0) { defaultBinCount } else { binCount };

    // Degenerate input: no candles, or no price range. Return an empty
    // profile with zeroed aggregates so callers can render a placeholder
    // rather than trap.
    if (ohlc.size() == 0 or effectiveBins == 0) {
      return {
        bins = [];
        binCount = effectiveBins;
        minPrice = 0.0;
        maxPrice = 0.0;
        poc = 0.0;
        pocVolume = 0.0;
        vah = 0.0;
        val = 0.0;
        hvnNodes = [];
        lvnNodes = [];
        buyPressure = 0.0;
        sellPressure = 0.0;
        totalVolume = 0.0;
        avgBinVolume = 0.0;
        nodeClass = #Other;
        pricePosition = #InVA;
        latestClose = 0.0;
      };
    };

    // ── Step 1: find the price range (min low, max high) ──────────────────
    var minLow = ohlc[0].low;
    var maxHigh = ohlc[0].high;
    for (c in ohlc.values()) {
      if (c.low < minLow) { minLow := c.low };
      if (c.high > maxHigh) { maxHigh := c.high };
    };
    // Guard against a flat price range (all candles identical). If the
    // range is zero, every bin collapses to the same price; we still
    // produce a single-bin-equivalent profile.
    let priceRange = maxHigh - minLow;
    if (priceRange <= 0.0) {
      // Flat market: one effective bin at the single price. All volume
      // lands there; POC = that price; VAH = VAL = price; no HVN/LVN
      // contrast (every bin is average).
      var totalVol = 0.0;
      var buyP = 0.0;
      var sellP = 0.0;
      let flatPrice = minLow;
      for (c in ohlc.values()) {
        let v = effectiveVolume(c);
        totalVol += v;
        let (b, s) = buySellPressure(c, v);
        buyP += b;
        sellP += s;
      };
      let (bpFrac, spFrac) = pressureFractions(buyP, sellP);
      let latest = ohlc[ohlc.size() - 1].close;
      return {
        bins = [{ price = flatPrice; volume = totalVol }];
        binCount = effectiveBins;
        minPrice = flatPrice;
        maxPrice = flatPrice;
        poc = flatPrice;
        pocVolume = totalVol;
        vah = flatPrice;
        val = flatPrice;
        hvnNodes = [];
        lvnNodes = [];
        buyPressure = bpFrac;
        sellPressure = spFrac;
        totalVolume = totalVol;
        avgBinVolume = if (totalVol > 0.0) { totalVol / effectiveBins.toFloat() } else { 0.0 };
        nodeClass = #POC;
        pricePosition = #InVA;
        latestClose = latest;
      };
    };

    // ── Step 2: allocate mutable bin volumes and midpoints ────────────────
    let binWidth = priceRange / effectiveBins.toFloat();
    let binVolumes = VarArray.repeat(0.0, effectiveBins);
    let binPrices = VarArray.repeat(0.0, effectiveBins);
    var i = 0;
    while (i < effectiveBins) {
      // Bin midpoint = minLow + (i + 0.5) * binWidth
      binPrices[i] := minLow + (i.toFloat() + 0.5) * binWidth;
      i += 1;
    };

    // ── Step 3: distribute each candle's volume across overlapping bins ──
    // For each candle, walk the bins its [low, high] range overlaps and
    // add volume proportional to the overlap fraction of the bin.
    var totalVolume = 0.0;
    var buyPressureTotal = 0.0;
    var sellPressureTotal = 0.0;
    for (c in ohlc.values()) {
      let v = effectiveVolume(c);
      totalVolume += v;
      let (b, s) = buySellPressure(c, v);
      buyPressureTotal += b;
      sellPressureTotal += s;

      // Candle range, clamped to the global range.
      let cLow = if (c.low < minLow) { minLow } else { c.low };
      let cHigh = if (c.high > maxHigh) { maxHigh } else { c.high };
      if (cHigh <= cLow) {
        // Doji or clamped-flat candle: dump all volume into the single
        // bin whose midpoint is closest to the candle price.
        let idx = priceToBinIndex(cLow, minLow, binWidth, effectiveBins);
        binVolumes[idx] += v;
      } else {
        // Distribute across all bins the candle overlaps.
        let firstBin = priceToBinIndex(cLow, minLow, binWidth, effectiveBins);
        let lastBin = priceToBinIndex(cHigh, minLow, binWidth, effectiveBins);
        var bi = firstBin;
        while (bi <= lastBin) {
          // Bin edges: [binLow, binHigh)
          let binLow = minLow + bi.toFloat() * binWidth;
          let binHigh = binLow + binWidth;
          // Overlap length between [cLow, cHigh] and [binLow, binHigh].
          let overlapLow = if (cLow > binLow) { cLow } else { binLow };
          let overlapHigh = if (cHigh < binHigh) { cHigh } else { binHigh };
          let overlap = overlapHigh - overlapLow;
          if (overlap > 0.0) {
            // Fraction of the bin covered by the candle.
            let frac = overlap / binWidth;
            binVolumes[bi] += v * frac;
          };
          bi += 1;
        };
      };
    };

    // ── Step 4: build the immutable bins array ───────────────────────────
    let bins = Array.tabulate(
      effectiveBins,
      func(j) { { price = binPrices[j]; volume = binVolumes[j] } },
    );

    // ── Step 5: locate the POC (highest-volume bin) ──────────────────────
    var pocIndex = 0;
    var pocVolume = binVolumes[0];
    var k = 1;
    while (k < effectiveBins) {
      if (binVolumes[k] > pocVolume) {
        pocVolume := binVolumes[k];
        pocIndex := k;
      };
      k += 1;
    };
    let poc = binPrices[pocIndex];

    // ── Step 6: value area (70% of total volume centered on POC) ─────────
    // Expand outward from the POC bin, accumulating volume on each side,
    // until we have captured >= 70% of total volume. VAH/VAL are the
    // outer bin midpoints reached on each side.
    let avgBinVolume = if (totalVolume > 0.0) {
      totalVolume / effectiveBins.toFloat();
    } else {
      0.0;
    };
    let valueTarget = totalVolume * valueAreaPercent;
    var vaLowIdx = pocIndex;
    var vaHighIdx = pocIndex;
    var vaVolume = binVolumes[pocIndex];
    while (vaVolume < valueTarget and (vaLowIdx > 0 or vaHighIdx < effectiveBins - 1)) {
      // Choose the side with the larger volume to keep the area tight.
      let leftVol = if (vaLowIdx > 0) { binVolumes[vaLowIdx - 1] } else { 0.0 };
      let rightVol = if (vaHighIdx < effectiveBins - 1) { binVolumes[vaHighIdx + 1] } else { 0.0 };
      if (leftVol >= rightVol and vaLowIdx > 0) {
        vaLowIdx -= 1;
        vaVolume += leftVol;
      } else if (vaHighIdx < effectiveBins - 1) {
        vaHighIdx += 1;
        vaVolume += rightVol;
      } else if (vaLowIdx > 0) {
        vaLowIdx -= 1;
        vaVolume += leftVol;
      } else {
        // Cannot expand further.
        break;
      };
    };
    let vah = binPrices[vaHighIdx];
    let val = binPrices[vaLowIdx];

    // ── Step 7: HVN / LVN nodes (top 3 by volume above/below thresholds) ─
    let hvnThreshold = avgBinVolume * hvnMultiplier;
    let lvnThreshold = avgBinVolume * lvnMultiplier;

    // HVN candidates: bins with volume > 1.5 * average, sorted desc, top 3.
    let hvnCandidates = bins.filter(
      func(b) { b.volume > hvnThreshold },
    );
    let hvnSorted = sortBinsByVolumeDesc(hvnCandidates);
    let hvnNodes = takeTopNodes(hvnSorted, topNodeCount, "HVN");

    // LVN candidates: bins with volume < 0.5 * average, sorted asc, top 3.
    let lvnCandidates = bins.filter(
      func(b) { b.volume < lvnThreshold },
    );
    let lvnSorted = sortBinsByVolumeAsc(lvnCandidates);
    let lvnNodes = takeTopNodes(lvnSorted, topNodeCount, "LVN");

    // ── Step 8: buy/sell pressure fractions ─────────────────────────────
    let (buyPressure, sellPressure) = pressureFractions(buyPressureTotal, sellPressureTotal);

    // ── Step 9: classify the latest close ───────────────────────────────
    let latestClose = ohlc[ohlc.size() - 1].close;
    let nodeClass = classifyNode(latestClose, poc, hvnNodes, lvnNodes, nodeProximityBand);
    let pricePosition = classifyPosition(latestClose, vah, val);

    {
      bins;
      binCount = effectiveBins;
      minPrice = minLow;
      maxPrice = maxHigh;
      poc;
      pocVolume;
      vah;
      val;
      hvnNodes;
      lvnNodes;
      buyPressure;
      sellPressure;
      totalVolume;
      avgBinVolume;
      nodeClass;
      pricePosition;
      latestClose;
    };
  };

  // adjustConfidenceForVolume(confidence, signalDirection, volumeProfile):
  // boost confidence by up to +0.1 if the signal direction aligns with
  // volume pressure (long with buyPressure > 0.6, short with sellPressure >
  // 0.6) and price sits at a supportive node (long near LVN below value area
  // expecting reversion to VA, short near LVN above VA). Dampen by up to
  // -0.1 if the signal contradicts volume pressure or sits on an opposing
  // HVN. Clamp to [0, 1].
  public func adjustConfidenceForVolume(
    confidence : Float,
    signalDirection : Text,
    volumeProfile : Types.VolumeProfile,
  ) : Float {
    // Normalize the direction string (case-insensitive). Anything that is
    // not "long" is treated as "short" — the only two signal directions the
    // engine emits.
    let dir = normalizeDirection(signalDirection);

    // Start from the supplied confidence and accumulate a signed adjustment
    // in [-maxConfidenceAdjustment, +maxConfidenceAdjustment].
    var adj = 0.0;

    // ── Pressure alignment ──────────────────────────────────────────────
    // Long signals benefit from buy pressure > 0.6; short signals benefit
    // from sell pressure > 0.6. Aligned → boost; opposed → dampen.
    let alignedPressure = if (dir == "long") {
      volumeProfile.buyPressure;
    } else {
      volumeProfile.sellPressure;
    };
    let opposedPressure = if (dir == "long") {
      volumeProfile.sellPressure;
    } else {
      volumeProfile.buyPressure;
    };

    if (alignedPressure > 0.6) {
      // Scale the boost by how far above 0.6 the pressure is, capped at
      // maxConfidenceAdjustment. (0.6 → 0, 1.0 → full boost.)
      let strength = (alignedPressure - 0.6) / 0.4;
      adj += maxConfidenceAdjustment * clamp01(strength);
    };
    if (opposedPressure > 0.6) {
      let strength = (opposedPressure - 0.6) / 0.4;
      adj -= maxConfidenceAdjustment * clamp01(strength);
    };

    // ── Node support ─────────────────────────────────────────────────────
    // A long signal near an LVN below the value area is "supported" (price
    // is expected to revert up into the value area). A short signal near
    // an LVN above the value area is similarly supported. Sitting on an
    // opposing HVN dampens confidence.
    let nearLVN = isNearNode(volumeProfile.latestClose, volumeProfile.lvnNodes, nodeProximityBand);
    let nearHVN = isNearNode(volumeProfile.latestClose, volumeProfile.hvnNodes, nodeProximityBand);

    if (dir == "long" and nearLVN and volumeProfile.pricePosition == #BelowVA) {
      adj += maxConfidenceAdjustment * 0.5;
    } else if (dir == "short" and nearLVN and volumeProfile.pricePosition == #AboveVA) {
      adj += maxConfidenceAdjustment * 0.5;
    };

    // Dampen if the signal sits on an opposing HVN: a long at an HVN
    // above VA faces overhead supply; a short at an HVN below VA faces
    // demand support.
    if (dir == "long" and nearHVN and volumeProfile.pricePosition == #AboveVA) {
      adj -= maxConfidenceAdjustment * 0.5;
    } else if (dir == "short" and nearHVN and volumeProfile.pricePosition == #BelowVA) {
      adj -= maxConfidenceAdjustment * 0.5;
    };

    // Clamp the cumulative adjustment to the ±max band, then apply and
    // clamp the final confidence to [0, 1].
    let clampedAdj = if (adj > maxConfidenceAdjustment) {
      maxConfidenceAdjustment;
    } else if (adj < -maxConfidenceAdjustment) {
      -maxConfidenceAdjustment;
    } else {
      adj;
    };
    clamp01(confidence + clampedAdj);
  };

  // ─── Private helpers ─────────────────────────────────────────────────────

  // Return the candle's effective volume: the real volume if present and
  // positive, otherwise a proxy of (high - low) * 1.0. This keeps the
  // profile useful for sources (CoinGecko OHLC, Frankfurter forex) that
  // do not return volume.
  private func effectiveVolume(c : MarketDataTypes.OHLC) : Float {
    if (c.volume > 0.0) { c.volume } else { c.high - c.low };
  };

  // Compute buy/sell pressure for a single candle. For a non-doji candle
  // (high != low): buy = volume * (close - low) / (high - low),
  // sell = volume * (high - close) / (high - low). For a doji (high == low)
  // split the volume 50/50.
  private func buySellPressure(c : MarketDataTypes.OHLC, v : Float) : (Float, Float) {
    let range = c.high - c.low;
    if (range == 0.0) {
      (v * 0.5, v * 0.5);
    } else {
      let buy = v * ((c.close - c.low) / range);
      let sell = v * ((c.high - c.close) / range);
      (buy, sell);
    };
  };

  // Convert raw buy/sell volume totals into 0.0-1.0 fractions of total
  // pressure. If both are zero, returns (0.5, 0.5) — a neutral split.
  private func pressureFractions(buy : Float, sell : Float) : (Float, Float) {
    let total = buy + sell;
    if (total == 0.0) { (0.5, 0.5) } else { (buy / total, sell / total) };
  };

  // Map a price to its bin index, clamped to [0, binCount - 1].
  private func priceToBinIndex(price : Float, minLow : Float, binWidth : Float, binCount : Nat) : Nat {
    if (binWidth <= 0.0) { return 0 };
    var idx = Int.abs(((price - minLow) / binWidth).toInt());
    if (idx < 0) { idx := 0 };
    if (idx >= binCount) { idx := binCount - 1 };
    idx;
  };

  // Sort bins by volume descending (highest volume first). Used for HVN.
  private func sortBinsByVolumeDesc(bins : [Types.VolumeBin]) : [Types.VolumeBin] {
    // Simple insertion sort — node candidate lists are tiny (<= binCount,
    // typically <= 24). Avoids pulling in a sort library.
    let arr : [var Types.VolumeBin] = bins.toVarArray();
    var i = 1;
    while (i < arr.size()) {
      let cur = arr[i];
      var j = i;
      while (j > 0 and arr[j - 1].volume < cur.volume) {
        arr[j] := arr[j - 1];
        j -= 1;
      };
      arr[j] := cur;
      i += 1;
    };
    Array.fromVarArray(arr);
  };

  // Sort bins by volume ascending (lowest volume first). Used for LVN.
  private func sortBinsByVolumeAsc(bins : [Types.VolumeBin]) : [Types.VolumeBin] {
    let arr : [var Types.VolumeBin] = bins.toVarArray();
    var i = 1;
    while (i < arr.size()) {
      let cur = arr[i];
      var j = i;
      while (j > 0 and arr[j - 1].volume > cur.volume) {
        arr[j] := arr[j - 1];
        j -= 1;
      };
      arr[j] := cur;
      i += 1;
    };
    Array.fromVarArray(arr);
  };

  // Take the first `count` bins and project them to VolumeNode records
  // tagged with the given kind ("HVN" | "LVN").
  private func takeTopNodes(sorted : [Types.VolumeBin], count : Nat, kind : Text) : [Types.VolumeNode] {
    let limit = if (sorted.size() < count) { sorted.size() } else { count };
    Array.tabulate(
      limit,
      func(i) { { price = sorted[i].price; volume = sorted[i].volume; kind } },
    );
  };

  // Classify the latest close against the POC and the HVN/LVN node lists.
  // Within 0.5% of the POC → #POC; else within 0.5% of an HVN → #HVN; else
  // within 0.5% of an LVN → #LVN; otherwise #Other.
  private func classifyNode(
    close : Float,
    poc : Float,
    hvnNodes : [Types.VolumeNode],
    lvnNodes : [Types.VolumeNode],
    band : Float,
  ) : Types.NodeClass {
    if (withinBand(close, poc, band)) { return #POC };
    if (isNearNode(close, hvnNodes, band)) { return #HVN };
    if (isNearNode(close, lvnNodes, band)) { return #LVN };
    #Other;
  };

  // Classify the latest close relative to the value area.
  private func classifyPosition(close : Float, vah : Float, val : Float) : Types.PricePosition {
    if (close > vah) { #AboveVA } else if (close < val) { #BelowVA } else { #InVA };
  };

  // True if `close` is within `band` (as a fraction of price) of any node
  // in the list. Guards against zero-price nodes (degenerate profile).
  private func isNearNode(close : Float, nodes : [Types.VolumeNode], band : Float) : Bool {
    for (n in nodes.values()) {
      if (withinBand(close, n.price, band)) { return true };
    };
    false;
  };

  // True if |close - price| / price <= band. Guards against zero price.
  private func withinBand(close : Float, price : Float, band : Float) : Bool {
    if (price == 0.0) { return false };
    let diff = if (close > price) { close - price } else { price - close };
    (diff / price) <= band;
  };

  // Normalize a signal-direction string to "long" | "short". Case-insensitive;
  // any value that does not start with 'l'/'L' is treated as "short".
  private func normalizeDirection(dir : Text) : Text {
    let chars = dir.toArray();
    if (chars.size() == 0) { return "short" };
    let first = chars[0];
    if (first == 'l' or first == 'L') { "long" } else { "short" };
  };

  // Clamp a Float to [0.0, 1.0].
  private func clamp01(x : Float) : Float {
    if (x < 0.0) { 0.0 } else if (x > 1.0) { 1.0 } else { x };
  };
};
