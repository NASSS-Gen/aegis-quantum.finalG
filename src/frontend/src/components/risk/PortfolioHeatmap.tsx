import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TILES = [
  { sym: "AAPL", chg: +1.24 },
  { sym: "TSLA", chg: -3.48 },
  { sym: "NVDA", chg: +4.12 },
  { sym: "AMD", chg: +2.76 },
  { sym: "BTC", chg: -1.89 },
  { sym: "ETH", chg: -4.22 },
  { sym: "GOOG", chg: +0.87 },
  { sym: "META", chg: +3.14 },
  { sym: "MSFT", chg: +1.53 },
  { sym: "AMZN", chg: -0.62 },
  { sym: "NFLX", chg: -2.91 },
  { sym: "COIN", chg: +5.44 },
];

/**
 * Monochrome intensity mapping — magnitude of the move drives surface tone.
 * Gains use darker ink (heavier), losses use lighter ink (lighter weight).
 * No color anywhere; weight + opacity encode direction and strength.
 */
function tileStyle(chg: number): { bg: string; text: string; weight: string } {
  const abs = Math.abs(chg);
  if (chg >= 0) {
    // Gains: darker fill, bold text
    if (abs >= 4)
      return {
        bg: "oklch(var(--foreground) / 0.16)",
        text: "oklch(var(--foreground))",
        weight: "700",
      };
    if (abs >= 2)
      return {
        bg: "oklch(var(--foreground) / 0.10)",
        text: "oklch(var(--foreground))",
        weight: "600",
      };
    return {
      bg: "oklch(var(--foreground) / 0.05)",
      text: "oklch(var(--foreground) / 0.75)",
      weight: "500",
    };
  }
  // Losses: lighter fill, medium text
  if (abs >= 4)
    return {
      bg: "oklch(var(--foreground) / 0.04)",
      text: "oklch(var(--muted-foreground))",
      weight: "500",
    };
  if (abs >= 2)
    return {
      bg: "oklch(var(--surface-3))",
      text: "oklch(var(--muted-foreground))",
      weight: "500",
    };
  return {
    bg: "oklch(var(--surface-2))",
    text: "oklch(var(--muted-foreground) / 0.8)",
    weight: "400",
  };
}

export function PortfolioHeatmap() {
  return (
    <Card className="shadow-card" data-ocid="risk.portfolio_heatmap_panel">
      <CardHeader>
        <CardTitle className="text-base">Portfolio Heat Map</CardTitle>
        <CardDescription>
          Per-asset daily change. Darker tiles indicate stronger moves.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {TILES.map((t, idx) => {
            const c = tileStyle(t.chg);
            return (
              <div
                key={t.sym}
                className="flex flex-col items-center justify-center gap-0.5 py-3 rounded-lg border border-border transition-smooth hover:shadow-subtle"
                style={{ backgroundColor: c.bg }}
                data-ocid={`risk.heatmap_tile.${idx + 1}`}
              >
                <span
                  className="text-xs font-semibold tracking-wide"
                  style={{ color: c.text, fontWeight: c.weight }}
                >
                  {t.sym}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: c.text, opacity: 0.85 }}
                >
                  {t.chg >= 0 ? "+" : ""}
                  {t.chg.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Scale bar */}
        <div className="flex items-center gap-3 mt-4">
          <span className="label-apple">−5%</span>
          <div
            className="flex-1 h-2 rounded-full border border-border"
            style={{
              background:
                "linear-gradient(to right, oklch(var(--surface-2)), oklch(var(--surface-4)), oklch(var(--foreground) / 0.5))",
            }}
          />
          <span className="label-apple">+5%</span>
        </div>
      </CardContent>
    </Card>
  );
}
