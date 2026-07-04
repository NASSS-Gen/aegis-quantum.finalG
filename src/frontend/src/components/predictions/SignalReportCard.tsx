import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExperienceMode } from "@/store/appStore";
import { QuantModel } from "../../backend";
import type {
  CalibratedConfidence,
  RegimeAssessment,
  VolumeProfile,
} from "../../backend";
import { useSignalReportCard } from "../../hooks/useMarketData";

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

type MarketScope = "india" | "crypto" | "forex";

interface SignalReportCardProps {
  assetId: string;
  timeframe: Timeframe;
  scope: MarketScope;
  mode: ExperienceMode;
  confluenceScore: number;
  backtestLookback?: number;
  model?: QuantModel;
}

function gradeLabel(grade: string): string {
  if (grade === "A") return "Institutional Quality";
  if (grade === "B") return "Professional Grade";
  if (grade === "C") return "Marginal Edge";
  return "Weak Signal";
}

function modelLabel(model: QuantModel): string {
  switch (model) {
    case QuantModel.meanReversion:
      return "Mean Reversion";
    case QuantModel.momentum:
      return "Momentum";
    case QuantModel.pairs:
      return "Pairs";
    default:
      return "Auto";
  }
}

function regimeLabel(regime: string): string {
  if (!regime) return "—";
  // Normalize the candid variant string (e.g. "trendingUp" → "Trending Up").
  const map: Record<string, string> = {
    trendingUp: "Trending Up",
    trendingDown: "Trending Down",
    volatile: "Volatile",
    ranging: "Ranging",
  };
  return map[regime] ?? regime;
}

function SkeletonMetric() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-14" />
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-20" />
    </div>
  );
}

/**
 * Calibrated confidence row. Shows the calibrated value when calibration is
 * available; otherwise shows an "Uncalibrated — low sample count" warning
 * with the backend's warning text. Always present in every mode tier.
 */
function CalibratedConfidenceRow({
  calibrated,
  rawConfidence,
}: {
  calibrated?: CalibratedConfidence;
  rawConfidence: number;
}) {
  if (!calibrated || !calibrated.isCalibrated) {
    return (
      <div
        className="rounded-lg border border-border bg-muted/40 p-3"
        data-ocid="signal.calibrated_confidence"
      >
        <div className="label-apple">Calibrated Confidence</div>
        <div className="mt-1 text-sm font-medium text-foreground">
          Uncalibrated — low sample count
        </div>
        {calibrated?.warning ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {calibrated.warning}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Not enough past predictions to calibrate {rawConfidence}%
            confidence.
          </p>
        )}
      </div>
    );
  }
  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-3"
      data-ocid="signal.calibrated_confidence"
    >
      <div className="label-apple">Calibrated Confidence</div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">
        {calibrated.calibratedConfidence.toFixed(1)}%
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Calibrated from {rawConfidence}% raw · bucket{" "}
        {Math.round(calibrated.bucket.minConfidence * 100)}–
        {Math.round(calibrated.bucket.maxConfidence * 100)}% · N=
        {Number(calibrated.bucket.sampleCount)}
      </p>
    </div>
  );
}

/**
 * Regime row. Shows the detected regime label + regime confidence. Beginner
 * sees a plain-language label; higher tiers also see the numeric confidence.
 */
function RegimeRow({
  regimeAssessment,
  regimeLabelStr,
  mode,
}: {
  regimeAssessment?: RegimeAssessment;
  regimeLabelStr: string;
  mode: ExperienceMode;
}) {
  const confidence = regimeAssessment?.confidence ?? 0;
  const showNumeric = mode !== "beginner";
  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-3"
      data-ocid="signal.regime"
    >
      <div className="label-apple">Detected Regime</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-foreground">
          {regimeLabel(regimeLabelStr)}
        </span>
        {showNumeric && confidence > 0 && (
          <span className="font-mono text-xs text-muted-foreground">
            {confidence.toFixed(1)}% confidence
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Volume profile summary. Beginner sees a plain-language one-liner; higher
 * tiers see POC, value area, current node classification, and a buy/sell
 * pressure bar.
 */
function VolumeProfileRow({
  vp,
  mode,
}: {
  vp?: VolumeProfile;
  mode: ExperienceMode;
}) {
  if (!vp) {
    return null;
  }
  const total = vp.totalVolume || 0;
  const buyPct = total > 0 ? (vp.buyPressure / total) * 100 : 0;
  const sellPct = total > 0 ? (vp.sellPressure / total) * 100 : 0;

  if (mode === "beginner") {
    const posWord =
      vp.pricePosition === "InVA"
        ? "inside the value area"
        : vp.pricePosition === "AboveVA"
          ? "above the value area"
          : "below the value area";
    const pressureWord =
      buyPct >= sellPct ? "buyers in control" : "sellers in control";
    return (
      <div
        className="rounded-lg border border-border bg-muted/40 p-3"
        data-ocid="signal.volume_profile"
      >
        <div className="label-apple">Volume Profile</div>
        <p className="mt-1 text-sm text-foreground">
          Price is {posWord}, with {pressureWord} ({buyPct.toFixed(0)}% buy vs{" "}
          {sellPct.toFixed(0)}% sell).
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-3"
      data-ocid="signal.volume_profile"
    >
      <div className="label-apple mb-2">Volume Profile</div>
      <div className="grid grid-cols-3 gap-2">
        <MiniLevel label="POC" value={vp.poc} emphasis />
        <MiniLevel label="VAH" value={vp.vah} />
        <MiniLevel label="VAL" value={vp.val} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Node:{" "}
          <span className="font-mono text-foreground">{vp.nodeClass}</span>
        </span>
        <span>
          Position:{" "}
          <span className="font-mono text-foreground">{vp.pricePosition}</span>
        </span>
      </div>
      <div className="mt-2">
        <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] border border-border">
          <div
            className="bg-[oklch(var(--foreground))]"
            style={{ width: `${buyPct}%` }}
            aria-label={`Buy ${buyPct.toFixed(1)}%`}
          />
          <div
            className="bg-[oklch(var(--surface-4))]"
            style={{ width: `${sellPct}%` }}
            aria-label={`Sell ${sellPct.toFixed(1)}%`}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span className="font-mono">Buy {buyPct.toFixed(1)}%</span>
          <span className="font-mono">Sell {sellPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function MiniLevel({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-1.5 ${
        emphasis ? "border-foreground/30 bg-accent" : "border-border bg-card"
      }`}
    >
      <div className="label-apple text-[10px]">{label}</div>
      <div className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
        {value.toFixed(2)}
      </div>
    </div>
  );
}

export default function SignalReportCard({
  assetId,
  timeframe,
  scope,
  mode,
  model,
}: SignalReportCardProps) {
  const { data, isLoading } = useSignalReportCard(
    assetId,
    timeframe,
    scope,
    model,
  );

  const backtest = data?.backtest ?? {
    winRate: 0,
    avgReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    lookbackCandles: BigInt(0),
  };
  const grade = data?.grade ?? "D";
  const expectedValue = data?.expectedValue ?? 0;
  const compositeConfidence = data ? Number(data.compositeConfidence) : 0;
  const reasoning = data?.reasoning ?? "Loading signal analysis...";
  const keyLevelsArray = data?.keyLevels ?? [];
  const findLevel = (kind: string): number => {
    const match = keyLevelsArray.find(
      (l) => l.kind.toLowerCase() === kind.toLowerCase(),
    );
    return match ? match.price : 0;
  };
  const entryPrice = findLevel("entry");
  const targetPrice = findLevel("target");
  const stopPrice = findLevel("stop");
  const vwapPrice = findLevel("vwap");
  const recommendedPositionSize = data
    ? Number(data.recommendedPositionSize)
    : 0;
  const riskRewardRatio = data ? Number(data.riskRewardRatio) : 0;

  // New extended fields.
  const signalModel = data?.model ?? QuantModel.auto;
  const calibrated = data?.calibratedConfidence;
  const honestDisclaimer = data?.honestDisclaimer ?? "";
  const regimeAssessment = data?.regimeAssessment;
  const regimeLabelStr = data?.regimeLabel ?? "";
  const volumeProfile = data?.volumeProfile;
  const pairsAsset = data?.modelSignal?.reasoning ?? "";

  /**
   * Four detail tiers driven by the store's ExperienceMode:
   * - beginner     : plain-language summary only (grade + confidence + 1-line takeaway)
   * - intermediate : summary + key metrics (win rate, EV, key levels, position size)
   * - advanced     : full institutional report (all metrics + reasoning)
   * - optional     : everything, including experimental fields (VWAP, R/R, risk per trade)
   */
  const showKeyMetrics =
    mode === "intermediate" || mode === "advanced" || mode === "optional";
  const showFullReport = mode === "advanced" || mode === "optional";
  const showExperimental = mode === "optional";

  // Disclaimer footer — always present, small + muted.
  const DisclaimerFooter = () => (
    <div
      className="mt-2 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground"
      data-ocid="signal.disclaimer"
    >
      {honestDisclaimer ||
        "Signals are probabilistic estimates, not guarantees. Past performance does not predict future results."}
    </div>
  );

  return (
    <Card data-ocid="signal.report_card" className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Institutional Signal Report
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {modelLabel(signalModel)}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {scope}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Beginner: plain-language summary only */}
        {mode === "beginner" && (
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-20 w-20 rounded-full" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {grade}
                </span>
              </div>
            )}
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="mx-auto h-6 w-32" />
              ) : (
                <div className="text-lg font-semibold text-foreground">
                  {compositeConfidence}% Confidence
                </div>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {isLoading
                  ? "Computing signal report..."
                  : `${reasoning.split(". ").slice(0, 2).join(". ")}.`}
              </p>
            </div>
            {!isLoading && (
              <>
                <CalibratedConfidenceRow
                  calibrated={calibrated}
                  rawConfidence={compositeConfidence}
                />
                <RegimeRow
                  regimeAssessment={regimeAssessment}
                  regimeLabelStr={regimeLabelStr}
                  mode={mode}
                />
                <VolumeProfileRow vp={volumeProfile} mode={mode} />
                <DisclaimerFooter />
              </>
            )}
          </div>
        )}

        {/* Intermediate / Advanced / Optional: shared institutional layout */}
        {(showKeyMetrics || showFullReport) && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="h-18 w-18 rounded-full" />
              ) : (
                <div className="flex h-18 w-18 items-center justify-center rounded-full border-2 border-foreground">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {grade}
                  </span>
                </div>
              )}
              <div>
                <div className="label-apple">Signal Grade</div>
                {isLoading ? (
                  <Skeleton className="mt-1 h-5 w-32" />
                ) : (
                  <div className="text-sm font-semibold text-foreground">
                    {gradeLabel(grade)}
                  </div>
                )}
              </div>
            </div>

            {/* Key metrics: Intermediate shows win rate + EV; Advanced/Optional show all four */}
            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                <>
                  <SkeletonMetric />
                  <SkeletonMetric />
                  {showFullReport && (
                    <>
                      <SkeletonMetric />
                      <SkeletonMetric />
                    </>
                  )}
                </>
              ) : (
                <>
                  <Metric
                    label="Win Rate"
                    value={`${(backtest.winRate * 100).toFixed(1)}%`}
                  />
                  <Metric
                    label="Avg Return"
                    value={`${(backtest.avgReturn * 100).toFixed(2)}%`}
                  />
                  {showFullReport && (
                    <>
                      <Metric
                        label="Sharpe Ratio"
                        value={backtest.sharpeRatio.toFixed(2)}
                      />
                      <Metric
                        label="Max Drawdown"
                        value={`${(backtest.maxDrawdown * 100).toFixed(2)}%`}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Expected value: shown from Intermediate up */}
            {isLoading ? (
              <SkeletonBlock />
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="label-apple">Expected Value (per ₹1L)</div>
                <div className="mt-1 font-mono text-lg font-semibold text-foreground">
                  ₹{expectedValue.toFixed(2)}
                </div>
              </div>
            )}

            {/* Composite confidence: shown from Intermediate up */}
            {isLoading ? (
              <SkeletonBlock />
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="label-apple">Composite Confidence</div>
                <div className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {compositeConfidence}%
                </div>
              </div>
            )}

            {/* Calibrated confidence: always present */}
            {!isLoading && (
              <CalibratedConfidenceRow
                calibrated={calibrated}
                rawConfidence={compositeConfidence}
              />
            )}

            {/* Regime: always present */}
            {!isLoading && (
              <RegimeRow
                regimeAssessment={regimeAssessment}
                regimeLabelStr={regimeLabelStr}
                mode={mode}
              />
            )}

            {/* Volume profile: always present */}
            {!isLoading && <VolumeProfileRow vp={volumeProfile} mode={mode} />}

            {/* Key price levels: shown from Intermediate up */}
            {isLoading ? (
              <SkeletonBlock />
            ) : (
              <div data-ocid="signal.key_levels">
                <div className="label-apple mb-2">Key Price Levels</div>
                <div className="grid grid-cols-3 gap-2">
                  <LevelTile label="Entry" value={entryPrice} emphasis />
                  <LevelTile label="Target" value={targetPrice} />
                  <LevelTile label="Stop-Loss" value={stopPrice} />
                </div>
                {/* Experimental: VWAP + R/R only in Optional */}
                {showExperimental && vwapPrice > 0 && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      VWAP:{" "}
                      <span className="font-mono text-foreground">
                        {vwapPrice.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      R/R:{" "}
                      <span className="font-mono text-foreground">
                        1:{riskRewardRatio.toFixed(2)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Position size: shown from Intermediate up; experimental risk-per-trade only in Optional */}
            {isLoading ? (
              <SkeletonBlock />
            ) : (
              <div
                className="rounded-lg border border-border bg-muted/40 p-3"
                data-ocid="signal.position_size"
              >
                <div className="label-apple">Suggested Position Size</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-lg font-semibold text-foreground">
                    {recommendedPositionSize.toFixed(2)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    of capital
                  </span>
                </div>
                {showExperimental && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Risk per trade:{" "}
                    <span className="font-mono text-foreground">
                      ₹{((recommendedPositionSize / 100) * 100000).toFixed(2)}
                    </span>{" "}
                    on ₹1L account
                  </div>
                )}
              </div>
            )}

            {/* Reasoning: full report only (Advanced + Optional). For pairs,
                include the pair asset context from modelSignal.reasoning. */}
            {showFullReport &&
              (isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="label-apple mb-1">Reasoning</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {reasoning}
                  </p>
                  {signalModel === QuantModel.pairs && pairsAsset && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Pair context:{" "}
                      <span className="font-mono text-foreground">
                        {pairsAsset}
                      </span>
                    </p>
                  )}
                </div>
              ))}

            <DisclaimerFooter />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="label-apple">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function LevelTile({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${
        emphasis ? "border-foreground/30 bg-accent" : "border-border bg-card"
      }`}
    >
      <div className="label-apple">{label}</div>
      <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-foreground">
        {value.toFixed(2)}
      </div>
    </div>
  );
}
