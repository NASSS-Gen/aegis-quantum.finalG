import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function GaugeBar({
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
          {value}%
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
 * Risk matrix panel — portfolio exposure, margin utilization, and a small
 * grid of risk metrics. Monochrome gauge bars; status badge encodes state.
 */
export default function RiskMatrix() {
  return (
    <Card data-ocid="market.risk_matrix" className="shadow-subtle">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold tracking-tight">
          Risk Matrix
        </CardTitle>
        <Badge
          variant="secondary"
          className="text-[10px] font-semibold uppercase tracking-wide"
        >
          Nominal
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <GaugeBar label="Portfolio Exposure" value={62} max={100} />
          <GaugeBar label="Margin Utilization" value={42} max={100} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Stat label="Active Alert" value="Nominal" />
          <Stat label="Hedge Coeff" value="0.74" />
          <Stat label="Auto Delever" value="Standby" />
          <Stat label="Risk Score" value="Low" />
        </div>
      </CardContent>
    </Card>
  );
}
