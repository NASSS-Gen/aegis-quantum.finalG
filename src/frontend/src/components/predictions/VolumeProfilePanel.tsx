import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NodeClass, PricePosition } from "../../backend";
import { useVolumeProfile } from "../../hooks/useQuantEngine";

interface VolumeProfilePanelProps {
  assetId: string;
  scope: string;
}

function pricePositionLabel(p: PricePosition): string {
  switch (p) {
    case PricePosition.InVA:
      return "Inside Value Area";
    case PricePosition.AboveVA:
      return "Above Value Area";
    case PricePosition.BelowVA:
      return "Below Value Area";
    default:
      return "—";
  }
}

function nodeClassLabel(n: NodeClass): string {
  switch (n) {
    case NodeClass.HVN:
      return "HVN";
    case NodeClass.LVN:
      return "LVN";
    case NodeClass.POC:
      return "POC";
    default:
      return "—";
  }
}

/**
 * Horizontal volume-profile histogram. Each price bin is a row; the bar width
 * is proportional to that bin's volume relative to the max bin volume. POC,
 * VAH, and VAL are marked with thin vertical rules + labels. Buy/sell
 * pressure is rendered as a stacked horizontal bar at the top.
 *
 * Monochrome only — bar fill uses the foreground token at varying opacities,
 * POC marker uses the strongest weight, VAH/VAL use mid weights.
 */
export default function VolumeProfilePanel({
  assetId,
  scope,
}: VolumeProfilePanelProps) {
  const { data, isLoading } = useVolumeProfile(assetId, scope);

  if (isLoading) {
    return (
      <Card className="shadow-card" data-ocid="volume_profile.card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Volume Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-card" data-ocid="volume_profile.card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Volume Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className="text-sm text-muted-foreground"
            data-ocid="volume_profile.empty_state"
          >
            Volume profile unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const bins = data.bins ?? [];
  const maxVolume = bins.reduce((m, b) => Math.max(m, b.volume), 0) || 1;
  const totalVolume = data.totalVolume || 0;
  const buyPct = totalVolume > 0 ? (data.buyPressure / totalVolume) * 100 : 0;
  const sellPct = totalVolume > 0 ? (data.sellPressure / totalVolume) * 100 : 0;

  // Sort bins high→low price so the histogram reads top (high) → bottom (low).
  const sortedBins = [...bins].sort((a, b) => b.price - a.price);

  return (
    <Card className="shadow-card" data-ocid="volume_profile.card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Volume Profile</CardTitle>
        <Badge variant="outline" className="font-mono text-[10px]">
          {Number(data.binCount)} bins
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Key levels: POC / VAH / VAL */}
        <div className="grid grid-cols-3 gap-2">
          <LevelTile label="POC" value={data.poc} emphasis />
          <LevelTile label="VAH" value={data.vah} />
          <LevelTile label="VAL" value={data.val} />
        </div>

        {/* Current node classification + price position */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Current node:{" "}
            <span className="font-mono text-foreground">
              {nodeClassLabel(data.nodeClass)}
            </span>
          </span>
          <span>
            Price:{" "}
            <span className="font-mono text-foreground">
              {pricePositionLabel(data.pricePosition)}
            </span>
          </span>
        </div>

        {/* Buy / sell pressure bar */}
        <div data-ocid="volume_profile.pressure">
          <div className="label-apple mb-1">Buy / Sell Pressure</div>
          <div className="flex h-3 w-full overflow-hidden rounded-[2px] border border-border">
            <div
              className="bg-[oklch(var(--foreground))]"
              style={{ width: `${buyPct}%` }}
              aria-label={`Buy pressure ${buyPct.toFixed(1)}%`}
            />
            <div
              className="bg-[oklch(var(--surface-4))]"
              style={{ width: `${sellPct}%` }}
              aria-label={`Sell pressure ${sellPct.toFixed(1)}%`}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span className="font-mono">Buy {buyPct.toFixed(1)}%</span>
            <span className="font-mono">Sell {sellPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Horizontal histogram */}
        <div data-ocid="volume_profile.histogram">
          <div className="label-apple mb-2">Volume by Price</div>
          <div className="flex flex-col gap-0.5">
            {sortedBins.length === 0 ? (
              <p className="text-xs text-muted-foreground">No bins.</p>
            ) : (
              sortedBins.map((b, i) => {
                const widthPct = (b.volume / maxVolume) * 100;
                const isPoc = Math.abs(b.price - data.poc) < 1e-6;
                return (
                  <div
                    key={`bin-${b.price}`}
                    data-ocid={`volume_profile.row.${i + 1}`}
                    className="flex items-center gap-2"
                  >
                    <span className="w-16 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                      {b.price.toFixed(2)}
                    </span>
                    <div className="relative h-3 flex-1 rounded-[2px] bg-[oklch(var(--surface-3))]">
                      <div
                        className={`h-full rounded-[2px] transition-smooth ${
                          isPoc
                            ? "bg-[oklch(var(--foreground))]"
                            : "bg-[oklch(var(--chart-2))]"
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
        {value.toFixed(2)}
      </div>
    </div>
  );
}
