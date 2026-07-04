import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVolatilityOverlay } from "../../hooks/useMarketData";
import { useTechnicalIndicators } from "../../hooks/useMarketData";

type MarketScope = "india" | "crypto" | "forex";

interface RiskOverlayProps {
  assetId: string;
  timeframe: string;
  scope: MarketScope;
  mode: "beginner" | "advanced" | "power";
  accountSize?: number;
  maxRiskPercent?: number;
}

// Normalize regime label to one of: Low / Normal / High / Extreme
function normalizeRegime(label: string | undefined): string {
  if (!label) return "Normal";
  const l = label.toLowerCase();
  if (l.includes("extreme")) return "Extreme";
  if (l.includes("high")) return "High";
  if (l.includes("low")) return "Low";
  if (l.includes("normal") || l.includes("medium")) return "Normal";
  return "Normal";
}

function regimeTone(regime: string): "default" | "secondary" | "outline" {
  if (regime === "Low" || regime === "Normal") return "default";
  if (regime === "High") return "secondary";
  return "outline";
}

export default function RiskOverlay({
  assetId,
  timeframe,
  scope,
  mode,
  accountSize = 100000,
  maxRiskPercent = 1,
}: RiskOverlayProps) {
  const { data: volData } = useVolatilityOverlay(
    assetId,
    timeframe,
    scope,
    accountSize,
    maxRiskPercent,
  );

  const { data: indicators } = useTechnicalIndicators(
    assetId,
    timeframe,
    scope,
  );

  const regime = normalizeRegime(volData?.regimeLabel);
  const atr = volData?.atrValue ?? 0;
  const price = indicators?.vwap?.value ?? 0;
  const positionSize = volData?.riskAdjustedPositionSize ?? 0;
  const kelly = volData?.kellyFraction ?? 0;
  const drawdown = volData?.maxDrawdownEstimate ?? 0;
  const leverage = volData?.recommendedLeverage ?? 0;

  const regimeTooltip =
    regime === "Low"
      ? "Low volatility: tight stops, larger position sizes possible."
      : regime === "Normal"
        ? "Normal volatility: standard risk parameters apply."
        : regime === "High"
          ? "High volatility: wider stops, reduce position size."
          : "Extreme volatility: high risk, minimal position size, consider staying out.";

  const vwap = indicators?.vwap;
  const vwapDev = vwap ? ((price - vwap.value) / vwap.value) * 100 : 0;

  return (
    <Card data-ocid="risk.overlay" className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Volatility Regime
        </CardTitle>
        <Badge variant={regimeTone(regime)} className="font-mono text-xs">
          {regime}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground" title={regimeTooltip}>
          {regimeTooltip}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            ATR:{" "}
            <span className="font-mono font-medium text-foreground">
              {atr.toFixed(2)}
            </span>
          </span>
        </div>

        {vwap && mode !== "beginner" && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="label-apple mb-1">VWAP Deviation</div>
            <div className="font-mono text-sm font-semibold text-foreground">
              {vwapDev >= 0 ? "+" : ""}
              {vwapDev.toFixed(2)}%
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              VWAP: {vwap.value.toFixed(2)} · Upper: {vwap.upperBand.toFixed(2)}{" "}
              · Lower: {vwap.lowerBand.toFixed(2)}
            </div>
          </div>
        )}

        {mode === "beginner" ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Current risk level is{" "}
            <span className="font-semibold text-foreground">{regime}</span>.
            Suggested position:{" "}
            <span className="font-mono font-semibold text-foreground">
              {positionSize}
            </span>{" "}
            units.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Risk-Adjusted Position"
                value={`${positionSize}`}
                sub="units"
              />
              <Metric
                label="Kelly Fraction"
                value={`${(kelly * 100).toFixed(1)}%`}
                sub="optimal bet size"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Recommended Leverage"
                value={`${leverage.toFixed(2)}x`}
                sub="max safe multiplier"
              />
              <Metric
                label="Max Drawdown Estimate"
                value={`${drawdown.toFixed(2)}%`}
                sub="based on 3x ATR / price"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span>
                Price:{" "}
                <span className="font-mono text-foreground">
                  {price.toFixed(2)}
                </span>
              </span>
              <span>
                ATR:{" "}
                <span className="font-mono text-foreground">
                  {atr.toFixed(2)}
                </span>
              </span>
              <span>
                Account:{" "}
                <span className="font-mono text-foreground">
                  ₹{accountSize.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="label-apple">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
