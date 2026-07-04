import { Badge } from "@/components/ui/badge";
import {
  type FilterTab,
  type MarketSymbol,
  SYMBOLS,
  fluctuate,
} from "@/lib/indianMarketData";

const FILTER_TABS: FilterTab[] = [
  "ALL",
  "INDICES",
  "LARGE_CAP",
  "TECH",
  "NEW_AGE",
];

const SIGNAL_VARIANT: Record<
  MarketSymbol["signal"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  BUY: { label: "Buy", variant: "default" },
  SELL: { label: "Sell", variant: "secondary" },
  NEUTRAL: { label: "Neutral", variant: "outline" },
};

interface SymbolGridProps {
  filter: FilterTab;
  onFilterChange: (f: FilterTab) => void;
  tick: number;
}

function SymbolCard({ sym, tick }: { sym: MarketSymbol; tick: number }) {
  const price = fluctuate(sym.basePrice, sym.symbol, tick);
  const pos = sym.change >= 0;
  const signal = SIGNAL_VARIANT[sym.signal];

  return (
    <div
      data-ocid={`market.symbol.${sym.symbol.toLowerCase()}`}
      className="metric-card flex flex-col gap-2 rounded-xl bg-card p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {sym.symbol.replace(/_/g, " ")}
          </span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {sym.sector.replace(/_/g, " ")}
          </span>
        </div>
        <Badge
          variant={signal.variant}
          className="text-[10px] font-semibold uppercase tracking-wide"
        >
          {signal.label}
        </Badge>
      </div>

      <span className="text-lg font-semibold tabular-nums text-foreground">
        ₹
        {price < 100
          ? price.toFixed(2)
          : price.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
      </span>

      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {pos ? "▲ +" : "▼ "}
        {sym.change.toFixed(2)}%
      </span>
    </div>
  );
}

export default function SymbolGrid({
  filter,
  onFilterChange,
  tick,
}: SymbolGridProps) {
  const filtered = SYMBOLS.filter((s) => s.category.includes(filter));

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div
        data-ocid="market.filter_tabs"
        className="flex flex-wrap items-center gap-2"
      >
        {FILTER_TABS.map((tab) => {
          const active = filter === tab;
          return (
            <button
              type="button"
              key={tab}
              data-ocid={`market.filter.${tab.toLowerCase()}`}
              onClick={() => onFilterChange(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium tracking-tight transition-smooth ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {tab.replace(/_/g, " ")}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} symbols
        </span>
      </div>

      {/* Grid */}
      <div
        data-ocid="market.symbol_grid"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {filtered.map((sym) => (
          <SymbolCard key={sym.symbol} sym={sym} tick={tick} />
        ))}
      </div>
    </div>
  );
}
