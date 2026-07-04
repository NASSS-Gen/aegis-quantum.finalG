import { Badge } from "@/components/ui/badge";

interface TopBarSymbol {
  symbol: string;
  price: number;
  change: number;
}

interface MarketTopBarProps {
  symbols: TopBarSymbol[];
}

/**
 * Live index strip — NIFTY, SENSEX, INDIA_VIX, BANKNIFTY. Clean horizontal
 * scroll of index prices with a small LIVE badge. No CRT effects.
 */
export default function MarketTopBar({ symbols }: MarketTopBarProps) {
  return (
    <div
      data-ocid="market.top_bar"
      className="flex items-center gap-3 overflow-x-auto rounded-xl border border-border bg-card px-4 py-3 shadow-subtle"
    >
      <div className="flex items-center gap-2 pr-3">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full bg-foreground"
        />
        <Badge
          variant="secondary"
          className="text-[10px] font-semibold uppercase tracking-wide"
        >
          Live
        </Badge>
      </div>

      <div className="flex items-center gap-6 overflow-x-auto">
        {symbols.map((s) => {
          const pos = s.change >= 0;
          return (
            <div
              key={s.symbol}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.symbol.replace(/_/g, " ")}
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                ₹
                {s.price.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {pos ? "▲" : "▼"} {pos ? "+" : ""}
                {s.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="ml-auto hidden items-center gap-2 pl-3 sm:flex">
        <Badge
          variant="outline"
          className="text-[10px] font-semibold uppercase tracking-wide"
        >
          NSE
        </Badge>
        <span className="text-xs text-muted-foreground">09:15–15:30 IST</span>
      </div>
    </div>
  );
}
