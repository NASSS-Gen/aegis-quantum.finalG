export type SignalType = "BUY" | "SELL" | "NEUTRAL";
export type FilterTab = "ALL" | "INDICES" | "LARGE_CAP" | "TECH" | "NEW_AGE";

export interface MarketSymbol {
  symbol: string;
  sector: string;
  basePrice: number;
  category: FilterTab[];
  signal: SignalType;
  change: number;
}

// Hash-based deterministic signal
function symbolSignal(symbol: string): SignalType {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 31 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const v = Math.abs(h) % 3;
  if (v === 0) return "BUY";
  if (v === 1) return "SELL";
  return "NEUTRAL";
}

// Hash-based deterministic change
function symbolChange(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 17 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const abs = Math.abs(h) % 300;
  const sign = h < 0 ? -1 : 1;
  return sign * (abs / 100);
}

export const SYMBOLS: MarketSymbol[] = [
  // INDICES
  {
    symbol: "NIFTY_50",
    sector: "INDEX",
    basePrice: 22147.25,
    category: ["ALL", "INDICES"],
    signal: symbolSignal("NIFTY_50"),
    change: symbolChange("NIFTY_50"),
  },
  {
    symbol: "BANKNIFTY",
    sector: "INDEX",
    basePrice: 47812.5,
    category: ["ALL", "INDICES"],
    signal: symbolSignal("BANKNIFTY"),
    change: symbolChange("BANKNIFTY"),
  },
  {
    symbol: "SENSEX",
    sector: "INDEX",
    basePrice: 72831.9,
    category: ["ALL", "INDICES"],
    signal: symbolSignal("SENSEX"),
    change: symbolChange("SENSEX"),
  },
  {
    symbol: "INDIA_VIX",
    sector: "VOLATILITY",
    basePrice: 15.42,
    category: ["ALL", "INDICES"],
    signal: symbolSignal("INDIA_VIX"),
    change: symbolChange("INDIA_VIX"),
  },
  {
    symbol: "NIFTY_MIDCAP_100",
    sector: "INDEX",
    basePrice: 48312.7,
    category: ["ALL", "INDICES"],
    signal: symbolSignal("NIFTY_MIDCAP_100"),
    change: symbolChange("NIFTY_MIDCAP_100"),
  },
  {
    symbol: "FINNIFTY",
    sector: "INDEX",
    basePrice: 21043.6,
    category: ["ALL", "INDICES"],
    signal: symbolSignal("FINNIFTY"),
    change: symbolChange("FINNIFTY"),
  },
  {
    symbol: "NIFTY_NEXT_50",
    sector: "INDEX",
    basePrice: 63458.2,
    category: ["ALL", "INDICES"],
    signal: symbolSignal("NIFTY_NEXT_50"),
    change: symbolChange("NIFTY_NEXT_50"),
  },
  // LARGE_CAP F&O
  {
    symbol: "RELIANCE",
    sector: "ENERGY",
    basePrice: 2947.5,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("RELIANCE"),
    change: symbolChange("RELIANCE"),
  },
  {
    symbol: "HDFCBANK",
    sector: "BANKING",
    basePrice: 1612.3,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("HDFCBANK"),
    change: symbolChange("HDFCBANK"),
  },
  {
    symbol: "TCS",
    sector: "IT",
    basePrice: 3854.1,
    category: ["ALL", "LARGE_CAP", "TECH"],
    signal: symbolSignal("TCS"),
    change: symbolChange("TCS"),
  },
  {
    symbol: "ICICIBANK",
    sector: "BANKING",
    basePrice: 1084.7,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("ICICIBANK"),
    change: symbolChange("ICICIBANK"),
  },
  {
    symbol: "INFY",
    sector: "IT",
    basePrice: 1478.9,
    category: ["ALL", "LARGE_CAP", "TECH"],
    signal: symbolSignal("INFY"),
    change: symbolChange("INFY"),
  },
  {
    symbol: "SBIN",
    sector: "BANKING",
    basePrice: 812.45,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("SBIN"),
    change: symbolChange("SBIN"),
  },
  {
    symbol: "BHARTIARTL",
    sector: "TELECOM",
    basePrice: 1542.8,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("BHARTIARTL"),
    change: symbolChange("BHARTIARTL"),
  },
  {
    symbol: "AXISBANK",
    sector: "BANKING",
    basePrice: 1132.6,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("AXISBANK"),
    change: symbolChange("AXISBANK"),
  },
  {
    symbol: "WIPRO",
    sector: "IT",
    basePrice: 487.35,
    category: ["ALL", "LARGE_CAP", "TECH"],
    signal: symbolSignal("WIPRO"),
    change: symbolChange("WIPRO"),
  },
  {
    symbol: "ADANIENT",
    sector: "CONGLOMERATE",
    basePrice: 2415.9,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("ADANIENT"),
    change: symbolChange("ADANIENT"),
  },
  {
    symbol: "LT",
    sector: "INFRA",
    basePrice: 3612.4,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("LT"),
    change: symbolChange("LT"),
  },
  {
    symbol: "ASIANPAINT",
    sector: "CONSUMER",
    basePrice: 2834.15,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("ASIANPAINT"),
    change: symbolChange("ASIANPAINT"),
  },
  {
    symbol: "KOTAKBANK",
    sector: "BANKING",
    basePrice: 1743.2,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("KOTAKBANK"),
    change: symbolChange("KOTAKBANK"),
  },
  {
    symbol: "MM",
    sector: "AUTO",
    basePrice: 2156.8,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("MM"),
    change: symbolChange("MM"),
  },
  {
    symbol: "TITAN",
    sector: "CONSUMER",
    basePrice: 3347.65,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("TITAN"),
    change: symbolChange("TITAN"),
  },
  {
    symbol: "ITC",
    sector: "FMCG",
    basePrice: 436.9,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("ITC"),
    change: symbolChange("ITC"),
  },
  {
    symbol: "SUNPHARMA",
    sector: "PHARMA",
    basePrice: 1587.45,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("SUNPHARMA"),
    change: symbolChange("SUNPHARMA"),
  },
  {
    symbol: "HCLTECH",
    sector: "IT",
    basePrice: 1643.7,
    category: ["ALL", "LARGE_CAP", "TECH"],
    signal: symbolSignal("HCLTECH"),
    change: symbolChange("HCLTECH"),
  },
  {
    symbol: "ULTRACEMCO",
    sector: "CEMENT",
    basePrice: 9871.5,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("ULTRACEMCO"),
    change: symbolChange("ULTRACEMCO"),
  },
  {
    symbol: "TATAMOTORS",
    sector: "AUTO",
    basePrice: 987.3,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("TATAMOTORS"),
    change: symbolChange("TATAMOTORS"),
  },
  {
    symbol: "BAJAJFIN",
    sector: "NBFC",
    basePrice: 6934.2,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("BAJAJFIN"),
    change: symbolChange("BAJAJFIN"),
  },
  {
    symbol: "GRASIM",
    sector: "CONGLOMERATE",
    basePrice: 2314.6,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("GRASIM"),
    change: symbolChange("GRASIM"),
  },
  {
    symbol: "COALINDIA",
    sector: "ENERGY",
    basePrice: 473.85,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("COALINDIA"),
    change: symbolChange("COALINDIA"),
  },
  {
    symbol: "JSWSTEEL",
    sector: "METALS",
    basePrice: 897.4,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("JSWSTEEL"),
    change: symbolChange("JSWSTEEL"),
  },
  {
    symbol: "MARUTI",
    sector: "AUTO",
    basePrice: 12847.3,
    category: ["ALL", "LARGE_CAP"],
    signal: symbolSignal("MARUTI"),
    change: symbolChange("MARUTI"),
  },
  // NEW_AGE
  {
    symbol: "ZOMATO",
    sector: "FOOD_TECH",
    basePrice: 213.45,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("ZOMATO"),
    change: symbolChange("ZOMATO"),
  },
  {
    symbol: "PAYTM",
    sector: "FINTECH",
    basePrice: 387.6,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("PAYTM"),
    change: symbolChange("PAYTM"),
  },
  {
    symbol: "NYKAA",
    sector: "D2C",
    basePrice: 162.3,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("NYKAA"),
    change: symbolChange("NYKAA"),
  },
  {
    symbol: "IRCTC",
    sector: "TRAVEL",
    basePrice: 847.9,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("IRCTC"),
    change: symbolChange("IRCTC"),
  },
  {
    symbol: "DMART",
    sector: "RETAIL",
    basePrice: 4312.5,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("DMART"),
    change: symbolChange("DMART"),
  },
  {
    symbol: "POLICYBZR",
    sector: "INSURTECH",
    basePrice: 1347.2,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("POLICYBZR"),
    change: symbolChange("POLICYBZR"),
  },
  {
    symbol: "NAUKRI",
    sector: "HR_TECH",
    basePrice: 6712.8,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("NAUKRI"),
    change: symbolChange("NAUKRI"),
  },
  {
    symbol: "ANGELONE",
    sector: "BROKING",
    basePrice: 2834.5,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("ANGELONE"),
    change: symbolChange("ANGELONE"),
  },
  {
    symbol: "DELHIVERY",
    sector: "LOGISTICS",
    basePrice: 387.15,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("DELHIVERY"),
    change: symbolChange("DELHIVERY"),
  },
  {
    symbol: "PATANJALI",
    sector: "FMCG",
    basePrice: 1634.7,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("PATANJALI"),
    change: symbolChange("PATANJALI"),
  },
  {
    symbol: "OLA_ELECTRIC",
    sector: "EV",
    basePrice: 87.45,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("OLA_ELECTRIC"),
    change: symbolChange("OLA_ELECTRIC"),
  },
  {
    symbol: "GROWW",
    sector: "FINTECH",
    basePrice: 312.8,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("GROWW"),
    change: symbolChange("GROWW"),
  },
  {
    symbol: "MPOWER",
    sector: "ENERGY",
    basePrice: 234.6,
    category: ["ALL", "NEW_AGE"],
    signal: symbolSignal("MPOWER"),
    change: symbolChange("MPOWER"),
  },
];

export const INDEX_SYMBOLS = [
  { symbol: "NIFTY_50", price: 22147.25, change: 0.42 },
  { symbol: "SENSEX", price: 72831.9, change: 0.38 },
  { symbol: "INDIA_VIX", price: 15.42, change: -1.2 },
  { symbol: "BANKNIFTY", price: 47812.5, change: 0.55 },
];

// Deterministic fluctuation seeded by symbol + tick
export function fluctuate(
  basePrice: number,
  symbol: string,
  tick: number,
): number {
  let seed = tick * 9973;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) & 0x7fffffff;
  }
  const delta = ((seed % 1000) / 1000 - 0.5) * 0.003 * basePrice;
  return Math.max(0.01, basePrice + delta);
}

export const LOG_TEMPLATES = [
  "[DATA] NIFTY_FEED_SYNC OK",
  "[NET] NSE_CONNECTION_OK",
  "[NET] BSE_CONNECTION_OK",
  "[EXEC] SIGNAL_GENERATED RELIANCE BUY",
  "[EXEC] SIGNAL_GENERATED TCS NEUTRAL",
  "[DATA] BANKNIFTY_TICK RECEIVED",
  "[WARN] INDIA_VIX ABOVE_THRESHOLD 15.0",
  "[DATA] F&O_OI_UPDATE NIFTY_50",
  "[EXEC] SIGNAL_GENERATED INFY SELL",
  "[NET] MARKET_DATA_STREAM LATENCY_3ms",
  "[DATA] SENSEX_TICK_RECEIVED",
  "[EXEC] SIGNAL_GENERATED HDFCBANK BUY",
  "[DATA] PCR_RATIO_UPDATE 1.12",
  "[EXEC] RISK_CHECK PASSED MARGIN_OK",
  "[DATA] BANKNIFTY_OPTIONS_CHAIN LOADED",
  "[NET] FEED_RECONNECT_ATTEMPT 1",
  "[DATA] NIFTY_MIDCAP_SYNC OK",
  "[EXEC] SIGNAL_GENERATED SBIN NEUTRAL",
  "[DATA] OI_CHANGE_DETECTED FINNIFTY",
  "[EXEC] MOMENTUM_INDEX UPDATED 0.74",
];
