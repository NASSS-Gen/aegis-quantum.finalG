/**
 * TradingViewChart — free TradingView Advanced Chart widget embed.
 *
 * Apple-inspired monochrome: white card, hairline border, rounded corners,
 * subtle shadow, system fonts. Entry / target / stop lines rendered as
 * absolutely-positioned dashed CSS overlays using monochrome tokens.
 */
import { useEffect, useRef, useState } from "react";

export type AssetScope = "india" | "crypto" | "forex";
export type TradeDirection = "Long" | "Short";

export interface TradingViewChartProps {
  assetId: string;
  scope: AssetScope;
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  direction?: TradeDirection;
}

const TV_SCRIPT_SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

export function symbolMapper(assetId: string, scope: AssetScope): string {
  const id = assetId.trim().toUpperCase();
  switch (scope) {
    case "india": {
      if (!id) return "NSE:RELIANCE";
      return id.endsWith(".NS") ? `NSE:${id}` : `NSE:${id}.NS`;
    }
    case "crypto": {
      if (!id) return "BINANCE:BTCUSDT";
      const base = id.replace(/[-/].*$/, "");
      return `BINANCE:${base}USDT`;
    }
    case "forex": {
      if (!id) return "FX:EURUSD";
      const pair = id.replace(/[-./]/g, "");
      return `FX:${pair}`;
    }
    default:
      return "BINANCE:BTCUSDT";
  }
}

interface OverlayLine {
  label: string;
  price: number;
  token: string;
}

function priceToPercent(price: number, min: number, max: number): number {
  if (max === min) return 50;
  const pct = ((price - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, pct));
}

export function TradingViewChart({
  assetId,
  scope,
  entryPrice,
  targetPrice,
  stopLoss,
  direction = "Long",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);

  const tvSymbol = symbolMapper(assetId, scope);

  const overlays: OverlayLine[] = [];
  if (typeof entryPrice === "number" && Number.isFinite(entryPrice)) {
    overlays.push({
      label: "ENTRY",
      price: entryPrice,
      token: "var(--marker-entry)",
    });
  }
  if (typeof targetPrice === "number" && Number.isFinite(targetPrice)) {
    overlays.push({
      label: "TARGET",
      price: targetPrice,
      token: "var(--marker-target)",
    });
  }
  if (typeof stopLoss === "number" && Number.isFinite(stopLoss)) {
    overlays.push({
      label: "STOP",
      price: stopLoss,
      token: "var(--marker-stop)",
    });
  }

  const prices = overlays.map((o) => o.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 100;
  const pad = maxPrice === minPrice ? Math.abs(maxPrice) * 0.05 || 1 : 0;
  const rangeMin = minPrice - pad;
  const rangeMax = maxPrice + pad;

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    host.innerHTML = "";
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }
    setWidgetReady(false);

    const script = document.createElement("script");
    script.src = TV_SCRIPT_SRC;
    script.async = true;
    script.type = "text/javascript";

    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      hide_top_toolbar: false,
      allow_symbol_change: false,
      withdateranges: false,
      hide_side_toolbar: true,
      details: false,
      studies: [],
      container_id: "",
    };
    script.innerHTML = JSON.stringify(config);

    script.onload = () => setWidgetReady(true);

    host.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      if (host) host.innerHTML = "";
      setWidgetReady(false);
    };
  }, [tvSymbol]);

  return (
    <div
      data-ocid="practice.advanced_chart.panel"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
    >
      {/* Header label */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          Advanced Chart
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {tvSymbol}
        </span>
      </div>

      {/* Widget + overlay container */}
      <div className="relative w-full" style={{ height: 420 }}>
        <div
          ref={containerRef}
          data-ocid="practice.advanced_chart.canvas_target"
          className="absolute inset-0"
          style={{ height: "100%", width: "100%" }}
        />

        {!widgetReady && (
          <div
            data-ocid="practice.advanced_chart.loading_state"
            className="absolute inset-0 flex items-center justify-center bg-background"
          >
            <span className="text-sm text-muted-foreground">Loading feed…</span>
          </div>
        )}

        {/* Entry / target / stop overlay lines */}
        {overlays.map((line) => {
          const top = priceToPercent(line.price, rangeMin, rangeMax);
          return (
            <div
              key={line.label}
              data-ocid={`practice.advanced_chart.${line.label.toLowerCase()}_line`}
              className="pointer-events-none absolute left-0 right-0 flex items-center"
              style={{ top: `${top}%`, transform: "translateY(-50%)" }}
            >
              <div
                className="flex-1"
                style={{
                  borderTop: `1px dashed oklch(${line.token})`,
                  opacity: 0.7,
                }}
              />
              <span
                className="rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium"
                style={{
                  color: `oklch(${line.token})`,
                  borderColor: `oklch(${line.token})`,
                }}
              >
                {line.label}{" "}
                {line.price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        })}

        {/* Direction badge */}
        <div className="pointer-events-none absolute right-2 top-2">
          <span className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground">
            {direction === "Long" ? "▲ Long" : "▼ Short"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TradingViewChart;
