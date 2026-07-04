import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DepthBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label.replace(/_/g, " ")}
        </span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label.replace(/_/g, " ")}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

/**
 * Market depth panel — P/C ratio, total volume, OI change, momentum, and
 * call/put volume bars. Monochrome: weight encodes emphasis, not color.
 */
export default function MarketDepth() {
  return (
    <Card data-ocid="market.depth_panel" className="shadow-subtle">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold tracking-tight">
          Market Depth
        </CardTitle>
        <Badge
          variant="outline"
          className="text-[10px] font-semibold uppercase tracking-wide"
        >
          NSE F&amp;O
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Stat label="P/C Ratio" value="1.12" />
          <Stat label="Total Vol" value="12.4K" />
          <Stat label="OI Change" value="+2.3%" />
          <Stat label="Momentum" value="0.74" />
        </div>

        <div className="flex flex-col gap-3">
          <DepthBar label="Call Vol" value={7200} max={12400} />
          <DepthBar label="Put Vol" value={5200} max={12400} />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Sentiment
          </span>
          <Badge className="text-[10px] font-semibold uppercase tracking-wide">
            Bullish
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
