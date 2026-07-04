import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketRegime } from "../../backend";
import { useRegimeHistory } from "../../hooks/useQuantEngine";

interface RegimeHistoryStripProps {
  assetId: string;
  scope: string;
  lookback?: number;
}

/**
 * Map a MarketRegime variant to a monochrome fill class. We encode regime
 * differences using only the existing greyscale tokens — no new colors:
 *  - trendingUp   → lightest (surface-2)
 *  - trendingDown → darkest (foreground)
 *  - ranging      → mid (surface-4)
 *  - volatile     → striped pattern (diagonal hatch via repeating gradient)
 */
function regimeFill(regime: MarketRegime): string {
  switch (regime) {
    case MarketRegime.trendingUp:
      return "bg-[oklch(var(--surface-2))]";
    case MarketRegime.trendingDown:
      return "bg-[oklch(var(--foreground))]";
    case MarketRegime.ranging:
      return "bg-[oklch(var(--surface-4))]";
    default:
      return "regime-volatile-fill";
  }
}

function regimeLabel(regime: MarketRegime): string {
  switch (regime) {
    case MarketRegime.trendingUp:
      return "Trending Up";
    case MarketRegime.trendingDown:
      return "Trending Down";
    case MarketRegime.ranging:
      return "Ranging";
    default:
      return "Volatile";
  }
}

/**
 * Horizontal strip of the last N bars colored by detected regime. Each cell
 * is a square; the strip reads left (oldest) → right (newest). A small legend
 * sits below. Monochrome only — regime is encoded by lightness, not hue.
 */
export default function RegimeHistoryStrip({
  assetId,
  scope,
  lookback = 20,
}: RegimeHistoryStripProps) {
  const { data, isLoading } = useRegimeHistory(
    assetId,
    scope,
    BigInt(lookback),
  );

  const entries = data ?? [];

  return (
    <Card className="shadow-card" data-ocid="regime_history.card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Regime History</CardTitle>
        <span className="label-apple">Last {lookback} bars</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : entries.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="regime_history.empty_state"
          >
            No regime history available.
          </p>
        ) : (
          <div
            className="flex h-8 w-full gap-0.5"
            data-ocid="regime_history.strip"
          >
            {entries.map((e, i) => (
              <div
                key={`regime-${e.timestamp}`}
                data-ocid={`regime_history.item.${i + 1}`}
                title={`${regimeLabel(e.regime)}`}
                aria-label={`Bar ${i + 1}: ${regimeLabel(e.regime)}`}
                className={`flex-1 rounded-[2px] transition-smooth ${regimeFill(
                  e.regime,
                )}`}
              />
            ))}
          </div>
        )}

        {/* Legend — monochrome swatches */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          {(
            [
              [MarketRegime.trendingUp, "Up"],
              [MarketRegime.trendingDown, "Down"],
              [MarketRegime.ranging, "Range"],
              [MarketRegime.volatile_, "Volatile"],
            ] as Array<[MarketRegime, string]>
          ).map(([r, label]) => (
            <div key={r} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-3 w-3 rounded-[2px] ${regimeFill(
                  r,
                )}`}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
