// Static arbitrage data — deterministic, no random values

export type SportLeague = "NBA" | "NFL" | "EPL" | "UFC";

export interface SportsArbRow {
  id: string;
  match: string;
  bookA: string;
  oddsA: number;
  bookB: string;
  oddsB: number;
  profit: number; // percentage
}

export interface FinancialArbRow {
  id: string;
  pair: string;
  exchangeA: string;
  priceA: number;
  exchangeB: string;
  priceB: number;
  gap: number;
  gapPercent: number;
  currency: string;
}

export interface BeginnerPick {
  id: string;
  pair: string;
  buySite: string;
  sellSite: string;
  profitPercent: number;
}

export type OppTag =
  | "HIGH_YIELD_ALERT"
  | "TRIANGULAR_NODE"
  | "STALE_MARKET"
  | "LIQUIDITY_GAP"
  | "FAST_EXEC";

export interface OpportunityCard {
  id: string;
  tag: OppTag;
  pair: string;
  profit: number;
  detectedAt: string;
}

export const BEGINNER_PICKS: BeginnerPick[] = [
  {
    id: "bp1",
    pair: "BTC/USD",
    buySite: "COINBASE",
    sellSite: "KRAKEN",
    profitPercent: 0.32,
  },
  {
    id: "bp2",
    pair: "ETH/USD",
    buySite: "BINANCE",
    sellSite: "COINBASE",
    profitPercent: 0.18,
  },
  {
    id: "bp3",
    pair: "AAPL_ADR",
    buySite: "NYSE",
    sellSite: "LSE",
    profitPercent: 0.41,
  },
];

export const SPORTS_ARB: Record<SportLeague, SportsArbRow[]> = {
  NBA: [
    {
      id: "nba1",
      match: "GOLDEN_STATE vs CELTICS",
      bookA: "DRAFTKINGS",
      oddsA: 2.1,
      bookB: "FANDUEL",
      oddsB: 2.08,
      profit: 3.12,
    },
    {
      id: "nba2",
      match: "BULLS vs HEAT",
      bookA: "BETMGM",
      oddsA: 1.95,
      bookB: "CAESARS",
      oddsB: 2.18,
      profit: 2.71,
    },
    {
      id: "nba3",
      match: "LAKERS vs BUCKS",
      bookA: "FANDUEL",
      oddsA: 1.88,
      bookB: "DRAFTKINGS",
      oddsB: 2.12,
      profit: 2.45,
    },
  ],
  NFL: [
    {
      id: "nfl1",
      match: "PACKERS vs BEARS",
      bookA: "DRAFTKINGS",
      oddsA: 1.85,
      bookB: "BETMGM",
      oddsB: 2.24,
      profit: 2.82,
    },
    {
      id: "nfl2",
      match: "CHIEFS vs EAGLES",
      bookA: "FANDUEL",
      oddsA: 1.92,
      bookB: "CAESARS",
      oddsB: 2.14,
      profit: 3.01,
    },
    {
      id: "nfl3",
      match: "RAVENS vs DOLPHINS",
      bookA: "BETMGM",
      oddsA: 2.05,
      bookB: "FANDUEL",
      oddsB: 1.9,
      profit: 2.14,
    },
  ],
  EPL: [
    {
      id: "epl1",
      match: "LIVERPOOL vs CHELSEA",
      bookA: "BET365",
      oddsA: 2.4,
      bookB: "WILLIAM_HILL",
      oddsB: 2.2,
      profit: 1.94,
    },
    {
      id: "epl2",
      match: "ARSENAL vs MAN_CITY",
      bookA: "BETWAY",
      oddsA: 3.1,
      bookB: "1XBET",
      oddsB: 3.2,
      profit: 2.18,
    },
    {
      id: "epl3",
      match: "TOTTENHAM vs UNITED",
      bookA: "UNIBET",
      oddsA: 2.75,
      bookB: "PADDYPOWER",
      oddsB: 2.6,
      profit: 1.76,
    },
  ],
  UFC: [
    {
      id: "ufc1",
      match: "JONES vs MIOCIC",
      bookA: "DRAFTKINGS",
      oddsA: 1.65,
      bookB: "BETMGM",
      oddsB: 2.55,
      profit: 4.32,
    },
    {
      id: "ufc2",
      match: "POIRIER vs GAETHJE",
      bookA: "FANDUEL",
      oddsA: 1.8,
      bookB: "CAESARS",
      oddsB: 2.3,
      profit: 3.56,
    },
  ],
};

export const FINANCIAL_ARB: FinancialArbRow[] = [
  {
    id: "fin1",
    pair: "BTC/USD_CROSS_EXCHANGE",
    exchangeA: "BINANCE",
    priceA: 42180,
    exchangeB: "COINBASE",
    priceB: 42261,
    gap: 81,
    gapPercent: 0.19,
    currency: "$",
  },
  {
    id: "fin2",
    pair: "AAPL_ADR_SWAP",
    exchangeA: "NYSE",
    priceA: 198.42,
    exchangeB: "LSE",
    priceB: 198.15,
    gap: 0.27,
    gapPercent: 0.14,
    currency: "$",
  },
];

export const INITIAL_OPPORTUNITIES: OpportunityCard[] = [
  {
    id: "op1",
    tag: "HIGH_YIELD_ALERT",
    pair: "BTC/ETH_TRI",
    profit: 1.87,
    detectedAt: "14:22:03",
  },
  {
    id: "op2",
    tag: "TRIANGULAR_NODE",
    pair: "ETH/BNB/USDT",
    profit: 0.94,
    detectedAt: "14:22:01",
  },
  {
    id: "op3",
    tag: "FAST_EXEC",
    pair: "SOL/USD_CEX_DEX",
    profit: 0.61,
    detectedAt: "14:21:58",
  },
  {
    id: "op4",
    tag: "LIQUIDITY_GAP",
    pair: "MATIC/ETH",
    profit: 0.43,
    detectedAt: "14:21:55",
  },
  {
    id: "op5",
    tag: "STALE_MARKET",
    pair: "ADA/USD",
    profit: 0.22,
    detectedAt: "14:21:52",
  },
  {
    id: "op6",
    tag: "HIGH_YIELD_ALERT",
    pair: "BTC/USD_SPOT_PERP",
    profit: 2.14,
    detectedAt: "14:21:49",
  },
  {
    id: "op7",
    tag: "TRIANGULAR_NODE",
    pair: "LINK/ETH/BTC",
    profit: 0.78,
    detectedAt: "14:21:46",
  },
  {
    id: "op8",
    tag: "FAST_EXEC",
    pair: "AVAX/USD_MULTI",
    profit: 0.55,
    detectedAt: "14:21:43",
  },
  {
    id: "op9",
    tag: "LIQUIDITY_GAP",
    pair: "DOT/BTC",
    profit: 0.39,
    detectedAt: "14:21:40",
  },
  {
    id: "op10",
    tag: "STALE_MARKET",
    pair: "XRP/USD",
    profit: 0.17,
    detectedAt: "14:21:37",
  },
];

export const NEW_OPPORTUNITY_POOL: OpportunityCard[] = [
  {
    id: "op_a",
    tag: "HIGH_YIELD_ALERT",
    pair: "ETH/USDT_FLASH",
    profit: 2.31,
    detectedAt: "",
  },
  {
    id: "op_b",
    tag: "TRIANGULAR_NODE",
    pair: "BNB/BTC/ETH",
    profit: 1.12,
    detectedAt: "",
  },
  {
    id: "op_c",
    tag: "FAST_EXEC",
    pair: "SOL/BTC_DELTA",
    profit: 0.88,
    detectedAt: "",
  },
  {
    id: "op_d",
    tag: "LIQUIDITY_GAP",
    pair: "ATOM/USDT",
    profit: 0.67,
    detectedAt: "",
  },
  {
    id: "op_e",
    tag: "HIGH_YIELD_ALERT",
    pair: "BTC/WBTC_BRIDGE",
    profit: 1.94,
    detectedAt: "",
  },
  {
    id: "op_f",
    tag: "TRIANGULAR_NODE",
    pair: "FTM/ETH/USDC",
    profit: 0.73,
    detectedAt: "",
  },
];

export const TICKER_LOG_MESSAGES = [
  "[SCAN] BTC/USD — BINANCE→KRAKEN — GAP: $44.20 — 0.10%",
  "[SCAN] ETH/USD — COINBASE→BINANCE — GAP: $8.15 — 0.21%",
  "[SCAN] AAPL_ADR — NYSE→LSE — GAP: $0.41 — 0.21%",
  "[SCAN] SOL/USD — FTX→BYBIT — GAP: $0.32 — 0.30%",
  "[SCAN] XRP/USDT — HUOBI→OKEX — GAP: $0.002 — 0.14%",
  "[SCAN] BNB/ETH — BINANCE→UNISWAP — GAP: 0.00012 — 0.08%",
  "[SCAN] LINK/USD — KRAKEN→COINBASE — GAP: $0.22 — 0.37%",
  "[SCAN] DOT/BTC — POLONIEX→BINANCE — GAP: 0.000003 — 0.19%",
];

export const EXEC_LOG_MESSAGES = [
  "[EXEC] 14:22:04 — BTC-ARB-01 — QUANTUM_SWAP INITIATED — ENTRY: $42,180.22",
  "[EXEC] 14:22:01 — ETH-ARB-03 — BRIDGE_TX CONFIRMED — PROFIT: +$182.44",
  "[EXEC] 14:21:58 — SOL-ARB-07 — SLIPPAGE_CHECK PASSED — TOLERANCE: 0.05%",
  "[EXEC] 14:21:55 — BTC-ARB-01 — CROSS_LOCK SECURED — LATENCY: 4ms",
  "[EXEC] 14:21:52 — AAPL-ADR-02 — EXECUTION COMPLETE — NET: +$270.00",
  "[EXEC] 14:21:49 — ETH-ARB-03 — ROUTING NODE_02 ACTIVE — TX_HASH: 0xa3f9",
  "[EXEC] 14:21:46 — BTC-ARB-01 — SIGNAL_PACKET 8ms — API_SYNC 12ms",
  "[EXEC] 14:21:43 — LINK-ARB-05 — LIQUIDITY_GAP DETECTED — EXECUTING",
];
