import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface BacktestMetrics {
    avgReturn: number;
    sharpeRatio: number;
    winRate: number;
    maxDrawdown: number;
    lookbackCandles: bigint;
}
export interface VolatilityOverlay {
    regime: VolatilityRegime;
    recommendedLeverage: number;
    riskAdjustedPositionSize: number;
    kellyFraction: number;
    regimeLabel: string;
    maxDrawdownEstimate: number;
    atrValue: number;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface BacktestMetricsExtended {
    model: QuantModel;
    calibrationTable?: CalibrationTable;
    numberOfTrades: bigint;
    outOfSampleWinRate?: number;
    averageLoss: number;
    sharpeRatio: number;
    inSampleWinRate?: number;
    averageWin: number;
    sortinoRatio: number;
    totalReturn: number;
    regimeBreakdown?: Array<RegimePerformance>;
    winRate: number;
    maxDrawdown: number;
    profitFactor: number;
}
export interface OutcomeBreakdown {
    open: bigint;
    hitTarget: bigint;
    hitStop: bigint;
}
export interface RSI {
    overbought: boolean;
    value: number;
    oversold: boolean;
}
export interface QuantSettings {
    maxRiskPercent: number;
    useRegimeFilter: boolean;
    useVWAP: boolean;
    indicatorSet: IndicatorSet;
    accountSize: number;
    minConfidence: bigint;
    confluenceWeights: ConfluenceWeights;
    backtestLookback: bigint;
}
export interface RegimeStrategyWeights {
    sizeMultiplier: number;
    momentum: number;
    meanReversion: number;
    pairs: number;
}
export interface BollingerBands {
    percentB: number;
    middle: number;
    lower: number;
    upper: number;
}
export interface VWAP {
    value: number;
    deviation: number;
    lowerBand: number;
    upperBand: number;
}
export interface ConfluenceResult {
    primaryTimeframe: Timeframe;
    votes: Array<TimeframeVote>;
    finalBias: string;
    weightedScore: number;
    confluenceScore: bigint;
}
export interface PredictionRecord {
    id: bigint;
    pnl?: number;
    timeframe: Timeframe;
    assetId: string;
    targetPrice: number;
    grade: SignalGrade;
    stopLoss: number;
    timestamp: bigint;
    entryPrice: number;
    signal: SignalType;
    confidence: bigint;
    outcome?: Outcome;
    assetClass: string;
    resolvedAt?: bigint;
}
export interface GradeDistribution {
    gradeA: bigint;
    gradeB: bigint;
    gradeC: bigint;
    gradeD: bigint;
    gradeF: bigint;
}
export interface PredictionStats {
    avgRiskReward: number;
    bestTrade: number;
    worstTrade: number;
    gradeDistribution: GradeDistribution;
    sharpeLikeRatio: number;
    totalPredictions: bigint;
    outcomeBreakdown: OutcomeBreakdown;
    winRate: number;
    resolvedCount: bigint;
    avgPnl: number;
}
export interface PracticeTrade {
    id: bigint;
    pnl?: number;
    status: TradeStatus;
    direction: Direction;
    assetId: string;
    createdAt: bigint;
    targetPrice: number;
    scope: string;
    stopLoss: number;
    timestamp: bigint;
    entryPrice: number;
    assetClass: string;
    resolvedAt?: bigint;
}
export interface Stochastic {
    overbought: boolean;
    percentD: number;
    percentK: number;
    oversold: boolean;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface TechnicalIndicators {
    atr: ATR;
    cci: CCI;
    rsi: RSI;
    bollinger: BollingerBands;
    macd: MACD;
    vwap: VWAP;
    stochastic: Stochastic;
}
export interface BacktestConfig {
    model: QuantModel;
    pairsAssetId?: AssetId;
    walkForwardSplit: number;
    endDate: Timestamp;
    timeframe: Timeframe;
    assetId: AssetId;
    strategyParams: QuantSettings;
    includeRegimeBreakdown: boolean;
    runLabel?: string;
    initialCapital: number;
    assetClass: AssetClass;
    startDate: Timestamp;
}
export type Result = {
    __kind__: "Ok";
    Ok: Array<OHLC>;
} | {
    __kind__: "Err";
    Err: string;
};
export interface VolumeNode {
    kind: string;
    volume: number;
    price: number;
}
export interface UserSettings {
    mode: Mode;
    onboardingComplete: boolean;
}
export interface CalibrationBucket {
    realizedWinRate: number;
    reliabilityGrade: string;
    reliabilityFactor: number;
    sampleCount: bigint;
    maxConfidence: number;
    minConfidence: number;
}
export interface PracticeStats {
    avgRiskReward: number;
    totalTrades: bigint;
    wins: bigint;
    losses: bigint;
    totalPnl: number;
    winRate: number;
    avgPnl: number;
}
export interface ModelSignal {
    model: QuantModel;
    direction: ModelDirection;
    metrics: string;
    takeProfit: number;
    reasoning: string;
    stopLoss: number;
    entryPrice: number;
    confidence: number;
}
export type Timestamp = bigint;
export interface VolumeProfile {
    poc: number;
    vah: number;
    val: number;
    totalVolume: number;
    buyPressure: number;
    bins: Array<VolumeBin>;
    latestClose: number;
    maxPrice: number;
    lvnNodes: Array<VolumeNode>;
    hvnNodes: Array<VolumeNode>;
    pocVolume: number;
    minPrice: number;
    sellPressure: number;
    binCount: bigint;
    pricePosition: PricePosition;
    nodeClass: NodeClass;
    avgBinVolume: number;
}
export interface PredictionFilter {
    endDate?: bigint;
    timeframe?: Timeframe;
    assetId?: string;
    grade?: SignalGrade;
    outcome?: Outcome;
    signalType?: SignalType;
    startDate?: bigint;
}
export interface BacktestTrade {
    pnl: number;
    direction: BacktestDirection;
    returnPercent: number;
    entryTimestamp: Timestamp;
    holdingPeriod: bigint;
    exitTimestamp: Timestamp;
    entryPrice: number;
    exitPrice: number;
}
export interface CCI {
    overbought: boolean;
    value: number;
    oversold: boolean;
}
export type AssetClass = string;
export interface EquityPoint {
    drawdown: number;
    timestamp: Timestamp;
    equity: number;
}
export interface SignalReportCard {
    regime: VolatilityRegime;
    volumeProfile?: VolumeProfile;
    model: QuantModel;
    backtest: BacktestMetrics;
    expectedValue: number;
    keyLevels: Array<KeyLevel>;
    bias: string;
    honestDisclaimer: string;
    recommendedPositionSize: number;
    regimeAssessment?: RegimeAssessment;
    reasoning: string;
    grade: SignalGrade;
    modelSignal: ModelSignal;
    regimeLabel: string;
    expectedMovePercent: number;
    confluenceBreakdown: Array<TimeframeVote>;
    riskRewardRatio: number;
    compositeConfidence: bigint;
    calibratedConfidence?: CalibratedConfidence;
}
export type Result_1 = {
    __kind__: "Ok";
    Ok: number;
} | {
    __kind__: "Err";
    Err: string;
};
export interface BacktestSummary {
    id: bigint;
    status: BacktestStatus;
    metrics: BacktestMetricsExtended;
    tradeCount: bigint;
    runLabel?: string;
    config: BacktestConfig;
    runAt: Timestamp;
}
export interface MACD {
    histogram: number;
    macdLine: number;
    signalLine: number;
}
export interface ATR {
    value: number;
}
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface RegimePerformance {
    regime: MarketRegime;
    tradeCount: bigint;
    winRate: number;
}
export interface KeyLevel {
    kind: string;
    name: string;
    price: number;
}
export interface CalibrationTable {
    totalSamples: bigint;
    lastUpdated: Timestamp;
    disclaimer: string;
    buckets: Array<CalibrationBucket>;
}
export interface CalibratedConfidence {
    warning: string;
    isCalibrated: boolean;
    rawConfidence: number;
    bucket: CalibrationBucket;
    calibratedConfidence: number;
}
export interface BacktestResult {
    metrics: BacktestMetricsExtended;
    trades: Array<BacktestTrade>;
    equityCurve: Array<EquityPoint>;
    config: BacktestConfig;
    runAt: Timestamp;
}
export interface OHLC {
    low: number;
    high: number;
    close: number;
    open: number;
    volume: number;
    timestamp: bigint;
}
export interface ModelComparison {
    timeframe: Timeframe;
    assetId: AssetId;
    results: Array<ModelComparisonEntry>;
    dateRange: string;
}
export interface RegimeHistoryEntry {
    regime: MarketRegime;
    timestamp: Timestamp;
}
export interface TimeframeVote {
    rsi: number;
    macdSignal: number;
    timeframe: Timeframe;
    bias: string;
    strength: bigint;
    keyLevel: number;
    vwapDev: number;
}
export interface ConfluenceWeights {
    d1: bigint;
    h1: bigint;
    h4: bigint;
    m15: bigint;
    lowerTimeframe: bigint;
    higherTimeframe: bigint;
    selectedTimeframe: bigint;
}
export interface ModelComparisonEntry {
    totalTrades: bigint;
    model: QuantModel;
    sharpe: number;
    outOfSampleWinRate?: number;
    winRate: number;
    maxDrawdown: number;
    profitFactor: number;
}
export interface VolumeBin {
    volume: number;
    price: number;
}
export type AssetId = string;
export interface RegimeAssessment {
    adx: number;
    regime: MarketRegime;
    plusDI: number;
    minusDI: number;
    reasoning: string;
    atrPercentile: number;
    priceVsEma200: Variant_above_near_below;
    confidence: number;
}
export enum BacktestStatus {
    Failed = "Failed",
    Partial_ = "Partial",
    Completed = "Completed"
}
export enum Direction {
    Short = "Short",
    Long = "Long"
}
export enum IndicatorSet {
    Minimal = "Minimal",
    Full = "Full"
}
export enum MarketRegime {
    trendingUp = "trendingUp",
    trendingDown = "trendingDown",
    volatile_ = "volatile",
    ranging = "ranging"
}
export enum Mode {
    Beginner = "Beginner",
    Advanced = "Advanced",
    PowerUser = "PowerUser",
    Intermediate = "Intermediate",
    Optional = "Optional"
}
export enum ModelDirection {
    long_ = "long",
    short_ = "short",
    neutral = "neutral"
}
export enum NodeClass {
    HVN = "HVN",
    LVN = "LVN",
    POC = "POC",
    Other = "Other"
}
export enum Outcome {
    Open = "Open",
    HitTarget = "HitTarget",
    HitStop = "HitStop"
}
export enum PricePosition {
    InVA = "InVA",
    BelowVA = "BelowVA",
    AboveVA = "AboveVA"
}
export enum QuantModel {
    auto = "auto",
    momentum = "momentum",
    meanReversion = "meanReversion",
    pairs = "pairs"
}
export enum SignalGrade {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    F = "F"
}
export enum SignalType {
    BuyPut = "BuyPut",
    Hold = "Hold",
    Sell = "Sell",
    BuyFutures = "BuyFutures",
    BuyCall = "BuyCall"
}
export enum Timeframe {
    D1 = "D1",
    H1 = "H1",
    H4 = "H4",
    M1 = "M1",
    M5 = "M5",
    W1 = "W1",
    M15 = "M15",
    M30 = "M30"
}
export enum TradeStatus {
    Win = "Win",
    Loss = "Loss",
    Open = "Open"
}
export enum Variant_above_near_below {
    above = "above",
    near = "near",
    below = "below"
}
export enum VolatilityRegime {
    LowVolatility = "LowVolatility",
    HighVolatility = "HighVolatility",
    Extreme = "Extreme",
    Normal = "Normal"
}
export interface backendInterface {
    addPracticeTrade(assetId: string, assetClass: string, scope: string, direction: Direction, entryPrice: number, targetPrice: number, stopLoss: number): Promise<PracticeTrade>;
    addPredictionRecord(record: PredictionRecord): Promise<bigint>;
    adjustConfidenceForVolume(confidence: number, signalDirection: string, volumeProfile: VolumeProfile): Promise<number>;
    calibrateConfidence(rawConfidence: number, assetClass: string | null, timeframe: Timeframe | null): Promise<CalibratedConfidence>;
    computeVolumeProfile(assetId: string, scope: string, binCount: bigint): Promise<VolumeProfile>;
    detectRegime(assetId: string, scope: string): Promise<RegimeAssessment>;
    generateMeanReversionSignal(ohlc: Array<OHLC>, settings: QuantSettings): Promise<ModelSignal>;
    generateModelSignal(model: QuantModel, ohlcA: Array<OHLC>, ohlcB: Array<OHLC> | null, settings: QuantSettings): Promise<ModelSignal>;
    generateMomentumSignal(ohlc: Array<OHLC>, settings: QuantSettings): Promise<ModelSignal>;
    generatePairsSignal(ohlcA: Array<OHLC>, ohlcB: Array<OHLC>, settings: QuantSettings): Promise<ModelSignal>;
    getBacktestHistory(): Promise<Array<BacktestSummary>>;
    getBacktestResult(id: bigint): Promise<BacktestResult | null>;
    getCalibrationTable(assetClass: string | null, timeframe: Timeframe | null): Promise<CalibrationTable>;
    getConfluenceResult(assetId: string, selectedTimeframe: Timeframe, scope: string): Promise<ConfluenceResult>;
    getCryptoOHLC(coinId: string, days: bigint): Promise<Result>;
    getCryptoPrice(coinId: string): Promise<Result_1>;
    getFilteredPredictionHistory(filter: PredictionFilter): Promise<Array<PredictionRecord>>;
    getForexOHLC(baseCurrency: string, quoteCurrency: string, days: bigint): Promise<Result>;
    getForexPrice(baseCurrency: string, quoteCurrency: string): Promise<Result_1>;
    getIndianStockOHLC(symbol: string, range: string): Promise<Result>;
    getPracticeTradeHistory(): Promise<Array<PracticeTrade>>;
    getPracticeTradeStats(): Promise<PracticeStats>;
    getPredictionHistory(): Promise<Array<PredictionRecord>>;
    getPredictionStats(): Promise<PredictionStats>;
    getQuantSettings(): Promise<QuantSettings>;
    getRegimeHistory(assetId: string, scope: string, lookback: bigint): Promise<Array<RegimeHistoryEntry>>;
    getRegimeStrategyWeights(regime: MarketRegime): Promise<RegimeStrategyWeights>;
    getSignalReportCard(assetId: string, timeframe: Timeframe, scope: string, accountSize: number, maxRiskPercent: number, model: QuantModel | null): Promise<SignalReportCard>;
    getTechnicalIndicators(assetId: string, timeframe: Timeframe, scope: string): Promise<TechnicalIndicators>;
    getUserSettings(): Promise<UserSettings>;
    getVolatilityOverlay(assetId: string, timeframe: Timeframe, scope: string, accountSize: number, maxRiskPercent: number): Promise<VolatilityOverlay>;
    getVolumeProfile(assetId: string, scope: string): Promise<VolumeProfile>;
    manualResolvePredictionOutcome(id: bigint, outcome: Outcome, pnl: number): Promise<boolean>;
    resolvePracticeTradeFromPrice(id: bigint, currentPrice: number): Promise<PracticeTrade | null>;
    resolvePredictionFromPrice(id: bigint, scope: string): Promise<[bigint, Outcome, number] | null>;
    resolvePredictionOutcome(id: bigint, outcome: Outcome, pnl: number): Promise<void>;
    runBacktest(config: BacktestConfig): Promise<BacktestResult>;
    runModelComparison(assetId: AssetId, assetClass: AssetClass, pairsAssetId: AssetId | null, timeframe: Timeframe, startDate: Timestamp, endDate: Timestamp, initialCapital: number, strategyParams: QuantSettings): Promise<ModelComparison>;
    selectBestModel(assetId: AssetId, timeframe: Timeframe): Promise<QuantModel>;
    setMode(mode: Mode): Promise<void>;
    setOnboardingComplete(): Promise<void>;
    setQuantSettings(settings: QuantSettings): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
