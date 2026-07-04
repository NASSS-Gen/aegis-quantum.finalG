import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

type HeatTile = {
  symbol: string;
  pct: number;
};

const BASE_TILES: HeatTile[] = [
  { symbol: "BTC", pct: 4.2 },
  { symbol: "ETH", pct: 2.1 },
  { symbol: "SOL", pct: -1.8 },
  { symbol: "DOT", pct: 0.4 },
  { symbol: "LINK", pct: 0.0 },
  { symbol: "MATIC", pct: 5.9 },
  { symbol: "XRP", pct: -8.2 },
  { symbol: "ADA", pct: 0.1 },
  { symbol: "AVAX", pct: -0.9 },
  { symbol: "UNI", pct: 1.4 },
  { symbol: "ATOM", pct: -0.1 },
  { symbol: "AAVE", pct: 12.4 },
];

// Monochrome intensity: positive → darker fill, negative → lighter fill.
// Magnitude scales opacity. Hierarchy via weight, not color.
function tileStyle(pct: number): { bg: string; text: string } {
  const mag = Math.min(Math.abs(pct) / 12, 1);
  if (pct >= 0) {
    return {
      bg: `oklch(0.21 0 0 / ${0.05 + mag * 0.18})`,
      text: "oklch(0.21 0 0)",
    };
  }
  return {
    bg: `oklch(0.9 0 0 / ${0.1 + mag * 0.25})`,
    text: "oklch(0.45 0 0)",
  };
}

export function SystemHeatmap() {
  const [tiles, setTiles] = useState<HeatTile[]>(BASE_TILES);

  useEffect(() => {
    const interval = setInterval(() => {
      setTiles((prev) =>
        prev.map((t) => ({
          ...t,
          pct: t.pct + (Math.random() - 0.5) * 0.4,
        })),
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-card" data-ocid="system_heatmap.panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Market Heatmap</CardTitle>
          <span className="text-xs text-muted-foreground">12 assets</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(3, 1fr)",
          }}
        >
          {tiles.map((t, i) => {
            const s = tileStyle(t.pct);
            return (
              <div
                key={t.symbol}
                className="flex flex-col items-center justify-center rounded-lg py-2"
                style={{ backgroundColor: s.bg }}
                data-ocid={`system_heatmap.item.${i + 1}`}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: s.text }}
                >
                  {t.symbol}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: s.text }}
                >
                  {t.pct >= 0 ? "+" : ""}
                  {t.pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
