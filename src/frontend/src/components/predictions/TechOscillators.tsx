import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExperienceMode } from "@/store/appStore";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useTechnicalIndicators } from "../../hooks/useMarketData";

type MarketScope = "india" | "crypto" | "forex";

interface TechOscillatorsProps {
  assetId: string;
  timeframe: string;
  scope: MarketScope;
  indicatorSet: "minimal" | "full";
  mode: ExperienceMode;
}

function buildMacdHistogram(
  macdLine: number,
  signalLine: number,
): { t: string; v: number }[] {
  const hist = macdLine - signalLine;
  return Array.from({ length: 12 }, (_, i) => ({
    t: `T-${11 - i}`,
    v: Number.parseFloat((hist * (0.7 + i * 0.05)).toFixed(3)),
  }));
}

export function TechOscillators({
  assetId,
  timeframe,
  scope,
  indicatorSet,
  mode,
}: TechOscillatorsProps) {
  const { data, isLoading } = useTechnicalIndicators(assetId, timeframe, scope);

  const rsi = data?.rsi?.value ?? 50;
  const macdLine = data?.macd?.macdLine ?? 0;
  const macdSignal = data?.macd?.signalLine ?? 0;
  const macdHist = data?.macd?.histogram ?? 0;
  const bb = data?.bollinger ?? {
    upper: 0,
    middle: 0,
    lower: 0,
    percentB: 0.5,
  };
  const atr = data?.atr?.value ?? 0;
  const stoch = data?.stochastic ?? { percentK: 50, percentD: 50 };
  const cci = data?.cci?.value ?? 0;

  const rsiLabel =
    rsi >= 70 ? "Overbought" : rsi <= 30 ? "Oversold" : "Neutral";
  const rsiTone: "default" | "secondary" | "outline" =
    rsi >= 70 ? "default" : rsi <= 30 ? "secondary" : "outline";

  const macdData = buildMacdHistogram(macdLine, macdSignal);

  /**
   * Indicator set scales with the active ExperienceMode:
   * - beginner     : RSI + MACD only (3-4 key oscillators)
   * - intermediate  : + Bollinger + ATR (6-8 standard oscillators)
   * - advanced/optional : + Stochastic + CCI (full suite)
   * The legacy `indicatorSet` prop ("minimal"|"full") is honored only when
   * it would reduce the set further than the mode allows.
   */
  const minimal = indicatorSet === "minimal";
  const showBollinger = !minimal && mode !== "beginner";
  const showAtr = !minimal && mode !== "beginner";
  const showStochastic =
    !minimal && (mode === "advanced" || mode === "optional");
  const showCci = !minimal && (mode === "advanced" || mode === "optional");
  const showAll = showBollinger && showAtr && showStochastic && showCci;
  const fullGrid = showAll || (showBollinger && showAtr);
  const isBeginner = mode === "beginner";

  return (
    <Card data-ocid="predictions.tech_oscillators" className="shadow-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Technical Oscillators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`grid gap-4 ${fullGrid ? "grid-cols-3" : "grid-cols-2"}`}
        >
          {/* RSI Gauge */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div>
              <div className="label-apple mb-2">RSI (14)</div>
              <div className="relative w-full" style={{ height: "80px" }}>
                <svg
                  viewBox="0 0 100 60"
                  className="h-full w-full"
                  aria-label="RSI gauge"
                >
                  <title>RSI Gauge</title>
                  <path
                    d="M 10 55 A 40 40 0 0 1 90 55"
                    fill="none"
                    stroke="oklch(var(--surface-4))"
                    strokeWidth="8"
                  />
                  <path
                    d="M 10 55 A 40 40 0 0 1 90 55"
                    fill="none"
                    stroke="oklch(var(--chart-1))"
                    strokeWidth="8"
                    strokeDasharray={`${(rsi / 100) * 125.6} 125.6`}
                    strokeLinecap="round"
                  />
                  <text
                    x="50"
                    y="44"
                    textAnchor="middle"
                    fill="oklch(var(--foreground))"
                    fontSize="14"
                    fontWeight="600"
                  >
                    {rsi.toFixed(1)}
                  </text>
                </svg>
              </div>
              <div className="mt-1.5 flex justify-center">
                <Badge variant={rsiTone} className="text-[10px] font-medium">
                  {rsiLabel}
                </Badge>
              </div>
              {isBeginner && (
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {rsi >= 70
                    ? "Price may be too high — possible pullback."
                    : rsi <= 30
                      ? "Price may be too low — possible bounce."
                      : "Momentum is balanced."}
                </div>
              )}
            </div>
          )}

          {/* MACD Histogram */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div>
              <div className="label-apple mb-2">MACD (12,26,9)</div>
              <div style={{ height: "80px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={macdData}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  >
                    <XAxis dataKey="t" hide />
                    <YAxis hide />
                    <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                      {macdData.map((entry) => (
                        <Cell
                          key={`cell-${entry.t}`}
                          fill={
                            entry.v >= 0
                              ? "oklch(var(--chart-1))"
                              : "oklch(var(--chart-2))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span className="font-mono">MACD: {macdLine.toFixed(3)}</span>
                <span className="font-mono">
                  Signal: {macdSignal.toFixed(3)}
                </span>
              </div>
              {isBeginner && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {macdHist > 0
                    ? "Bullish momentum building."
                    : "Bearish momentum building."}
                </div>
              )}
            </div>
          )}

          {/* Standard indicators: Bollinger + ATR (Intermediate and up) */}
          {(showBollinger || showAtr) && (
            <>
              {/* Bollinger Bands */}
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div>
                  <div className="label-apple mb-2">Bollinger (20,2)</div>
                  <div className="space-y-1.5">
                    <Row label="Upper" value={bb.upper.toFixed(2)} />
                    <Row label="Middle" value={bb.middle.toFixed(2)} />
                    <Row label="Lower" value={bb.lower.toFixed(2)} />
                    <Row
                      label="%B"
                      value={`${(bb.percentB * 100).toFixed(1)}%`}
                    />
                  </div>
                </div>
              )}

              {/* ATR */}
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ) : (
                <div>
                  <div className="label-apple mb-2">ATR (14)</div>
                  <div className="font-mono text-lg font-semibold text-foreground">
                    {atr.toFixed(4)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Volatility-based stop-loss reference
                  </div>
                </div>
              )}
            </>
          )}

          {/* Full-suite indicators: Stochastic + CCI (Advanced and Optional only) */}
          {(showStochastic || showCci) && (
            <>
              {/* Stochastic */}
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div>
                  <div className="label-apple mb-2">Stochastic (14,3)</div>
                  <div className="space-y-1.5">
                    <Row label="%K" value={stoch.percentK.toFixed(1)} />
                    <Row label="%D" value={stoch.percentD.toFixed(1)} />
                  </div>
                </div>
              )}

              {/* CCI */}
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ) : (
                <div>
                  <div className="label-apple mb-2">CCI (20)</div>
                  <div className="font-mono text-lg font-semibold text-foreground">
                    {cci.toFixed(1)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {cci > 100
                      ? "Overbought zone"
                      : cci < -100
                        ? "Oversold zone"
                        : "Neutral zone"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}
