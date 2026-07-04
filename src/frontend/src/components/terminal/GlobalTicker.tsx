import { Separator } from "@/components/ui/separator";

const TICKER_ITEMS = [
  { label: "NIFTY 50", value: "22,147" },
  { label: "SENSEX", value: "72,831" },
  { label: "US 10Y", value: "4.28%" },
  { label: "Gold", value: "$2,318.40" },
  { label: "VIX", value: "15.42" },
  { label: "DXY", value: "104.82" },
  { label: "BTC/USD", value: "$42,261" },
  { label: "ETH/USD", value: "$2,847" },
  { label: "Crude", value: "$78.32" },
  { label: "NIFTY Bank", value: "47,820" },
  { label: "USD/INR", value: "83.42" },
  { label: "Silver", value: "$27.18" },
];

export function GlobalTicker() {
  return (
    <div
      data-ocid="terminal.global_ticker"
      className="w-full bg-card border-t shadow-subtle"
    >
      <div className="max-w-[1280px] mx-auto px-4 py-2.5 flex items-center gap-x-5 gap-y-2 flex-wrap">
        <span className="label-apple uppercase shrink-0">Markets</span>
        <Separator orientation="vertical" className="h-4 shrink-0" />
        {TICKER_ITEMS.map((item, i) => (
          <span
            key={item.label}
            data-ocid={`terminal.global_ticker.item.${i + 1}`}
            className="flex items-baseline gap-1.5 text-xs whitespace-nowrap"
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
