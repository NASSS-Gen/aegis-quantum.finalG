import { useEffect, useRef, useState } from "react";

const TICKERS = [
  { symbol: "BTC/USD", price: "72,450.31", change: "+1.24%", up: true },
  { symbol: "ETH/USD", price: "3,892.15", change: "+0.67%", up: true },
  { symbol: "NIFTY", price: "24,812.45", change: "+0.82%", up: true },
  { symbol: "GOLD", price: "2,341.80", change: "-0.12%", up: false },
  { symbol: "DXY", price: "104.32", change: "+0.09%", up: true },
  { symbol: "VIX", price: "14.21", change: "-3.40%", up: false },
  { symbol: "SENSEX", price: "81,542.10", change: "+0.77%", up: true },
  { symbol: "ETH/BTC", price: "0.0537", change: "-0.31%", up: false },
  { symbol: "SOL/USD", price: "182.44", change: "+2.10%", up: true },
  { symbol: "BANKNIFTY", price: "52,340.10", change: "-0.43%", up: false },
];

export function TickerStrip() {
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const SPEED = 0.4;
    const TOTAL_W = TICKERS.length * 180;

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      setOffset((elapsed * SPEED) % TOTAL_W);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const items = [...TICKERS, ...TICKERS];

  return (
    <div
      className="w-full overflow-hidden flex-shrink-0 bg-card border-b border-border"
      style={{ height: "36px" }}
      data-ocid="ticker_strip"
      aria-label="Live market ticker"
    >
      <div
        className="flex items-center h-full"
        style={{
          transform: `translateX(-${offset}px)`,
          willChange: "transform",
          whiteSpace: "nowrap",
          width: `${items.length * 180}px`,
        }}
      >
        {items.map((t, i) => (
          <span
            key={`${t.symbol}-${i}`}
            className="inline-flex items-center gap-2 px-4 text-xs font-mono tracking-tight flex-shrink-0"
            style={{ width: "180px" }}
          >
            <span className="font-medium text-foreground">{t.symbol}</span>
            <span className="text-muted-foreground">{t.price}</span>
            <span
              className={
                t.up
                  ? "font-medium text-foreground"
                  : "font-normal text-muted-foreground"
              }
            >
              {t.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
