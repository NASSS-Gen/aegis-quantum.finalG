export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function lcg(seed: number): number {
  return (seed * 1103515245 + 12345) % 2147483648;
}

function lcgFloat(seed: number): number {
  return seed / 2147483647;
}

export function generateOHLC(seed: string, count: number): OHLC[] {
  const hash = fnv1a(seed);
  let state = hash;

  const assetClass = seed.toLowerCase();
  let basePrice = 100;
  let volatility = 0.02;

  if (
    assetClass.includes("btc") ||
    assetClass.includes("eth") ||
    assetClass.includes("crypto")
  ) {
    basePrice = 45000;
    volatility = 0.035;
  } else if (
    assetClass.includes("forex") ||
    assetClass.includes("eur") ||
    assetClass.includes("usd")
  ) {
    basePrice = 1.15;
    volatility = 0.008;
  } else if (
    assetClass.includes("gold") ||
    assetClass.includes("xau") ||
    assetClass.includes("commodity")
  ) {
    basePrice = 1950;
    volatility = 0.015;
  } else if (
    assetClass.includes("nifty") ||
    assetClass.includes("sensex") ||
    assetClass.includes("index")
  ) {
    basePrice = 19500;
    volatility = 0.012;
  } else if (
    assetClass.includes("reliance") ||
    assetClass.includes("tcs") ||
    assetClass.includes("infy")
  ) {
    basePrice = 2500;
    volatility = 0.018;
  }

  const ohlc: OHLC[] = [];
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    state = lcg(state);
    const change = (lcgFloat(state) - 0.5) * 2 * volatility;
    price = price * (1 + change);

    state = lcg(state);
    const highWick = lcgFloat(state) * volatility * price * 0.5;
    state = lcg(state);
    const lowWick = lcgFloat(state) * volatility * price * 0.5;

    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) + highWick;
    const low = Math.min(open, close) - lowWick;

    ohlc.push({ open, high, low, close });
    price = close;
  }

  return ohlc;
}

export function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[closes.length - i] - closes[closes.length - i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const idx = closes.length - i - 1;
    if (idx < 0) break;
    const change = closes[closes.length - i] - closes[closes.length - i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function computeMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): { macdLine: number; signalLine: number; histogram: number } {
  const ema = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };

  const fastEma = ema(closes, fast);
  const slowEma = ema(closes, slow);

  const macdLineValues: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLineValues.push(fastEma[i] - slowEma[i]);
  }

  // signalLine is the 9-period EMA of the MACD line — correct institutional formula
  const signalLineValues = ema(macdLineValues, signal);

  const lastIdx = closes.length - 1;
  const macdLine = macdLineValues[lastIdx];
  const signalLine = signalLineValues[lastIdx];
  const histogram = macdLine - signalLine;

  return { macdLine, signalLine, histogram };
}

// NOTE: This file is a thin utility library for indicator math ONLY.
// All signal generation lives in the backend (predictions.mo).
// Frontend components MUST call backend endpoints via useMarketData hooks.
// generateOHLC is DEPRECATED — do not use for signal computation.
// It is kept only for local chart helpers where backend data is unavailable.
//
// REMOVED: computeSignal — frontend no longer generates signals.
// Use useSignalReportCard() or usePrediction() hooks instead.
//
// CRITICAL: Prediction Test Log must call backend /predict endpoint.
// Never use generateOHLC for signal computation — only for chart rendering.

export function computeVWAP(
  ohlc: Array<{ high: number; low: number; close: number; volume: number }>,
): { value: number; deviation: number; upperBand: number; lowerBand: number } {
  if (ohlc.length === 0) {
    return { value: 0, deviation: 0, upperBand: 0, lowerBand: 0 };
  }
  let cumulativeTPV = 0;
  let cumulativeVol = 0;
  const typicalPrices: number[] = [];
  for (const c of ohlc) {
    const tp = (c.high + c.low + c.close) / 3;
    typicalPrices.push(tp);
    cumulativeTPV += tp * c.volume;
    cumulativeVol += c.volume;
  }
  const vwap =
    cumulativeVol > 0
      ? cumulativeTPV / cumulativeVol
      : typicalPrices[typicalPrices.length - 1];
  const deviations = typicalPrices.map((tp) => Math.abs(tp - vwap));
  const avgDev = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  return {
    value: vwap,
    deviation: avgDev,
    upperBand: vwap + 2 * avgDev,
    lowerBand: vwap - 2 * avgDev,
  };
}

export function computeBollingerBands(
  closes: number[],
  period = 20,
  stdDev = 2,
): { upper: number; middle: number; lower: number; percentB: number } {
  if (closes.length < period) {
    const last = closes[closes.length - 1];
    return {
      upper: last * 1.02,
      middle: last,
      lower: last * 0.98,
      percentB: 0.5,
    };
  }

  const slice = closes.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  const middle = sum / period;

  const squaredDiffs = slice.map((c) => (c - middle) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(variance);

  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;

  const lastClose = closes[closes.length - 1];
  const percentB = (lastClose - lower) / (upper - lower);

  return { upper, middle, lower, percentB };
}

export function computeATR(ohlc: OHLC[], period = 14): number {
  if (ohlc.length < 2) return 0;

  const trValues: number[] = [];
  for (let i = 1; i < ohlc.length; i++) {
    const current = ohlc[i];
    const previous = ohlc[i - 1];
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    trValues.push(Math.max(tr1, tr2, tr3));
  }

  if (trValues.length < period) {
    return trValues.reduce((a, b) => a + b, 0) / trValues.length;
  }

  let atr = trValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
  }

  return atr;
}

export function computeStochastic(
  ohlc: OHLC[],
  kPeriod = 14,
  dPeriod = 3,
): { percentK: number; percentD: number } {
  if (ohlc.length < kPeriod) return { percentK: 50, percentD: 50 };

  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < ohlc.length; i++) {
    const slice = ohlc.slice(i - kPeriod + 1, i + 1);
    const lowestLow = Math.min(...slice.map((c) => c.low));
    const highestHigh = Math.max(...slice.map((c) => c.high));
    const currentClose = ohlc[i].close;

    if (highestHigh === lowestLow) {
      kValues.push(50);
    } else {
      kValues.push(
        ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100,
      );
    }
  }

  const percentK = kValues[kValues.length - 1];

  if (kValues.length < dPeriod) return { percentK, percentD: percentK };

  const dSlice = kValues.slice(-dPeriod);
  const percentD = dSlice.reduce((a, b) => a + b, 0) / dPeriod;

  return { percentK, percentD };
}

export function computeCCI(ohlc: OHLC[], period = 20): number {
  if (ohlc.length < period) return 0;

  const tpValues: number[] = ohlc.map((c) => (c.high + c.low + c.close) / 3);

  const smaValues: number[] = [];
  for (let i = period - 1; i < tpValues.length; i++) {
    const slice = tpValues.slice(i - period + 1, i + 1);
    smaValues.push(slice.reduce((a, b) => a + b, 0) / period);
  }

  const lastIdx = smaValues.length - 1;
  const lastTP = tpValues[tpValues.length - 1];
  const sma = smaValues[lastIdx];

  const meanDeviation =
    tpValues
      .slice(-period)
      .map((tp) => Math.abs(tp - sma))
      .reduce((a, b) => a + b, 0) / period;

  if (meanDeviation === 0) return 0;

  return (lastTP - sma) / (0.015 * meanDeviation);
}
