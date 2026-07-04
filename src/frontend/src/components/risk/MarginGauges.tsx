import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GAUGES = [
  { id: "spot", label: "Spot margin", pct: 62 },
  { id: "futures", label: "Futures margin", pct: 42 },
];

function DonutGauge({ pct, label }: { pct: number; label: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gap = circ - dash;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ transform: "rotate(-90deg)" }}
          aria-label={`${label}: ${pct}%`}
        >
          <title>{`${label}: ${pct}%`}</title>
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="oklch(var(--surface-4))"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="oklch(var(--foreground))"
            strokeWidth="8"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold font-display">{pct}%</span>
          <span className="label-apple uppercase tracking-wide">Used</span>
        </div>
      </div>
      <span className="label-apple">{label}</span>
    </div>
  );
}

export function MarginGauges() {
  return (
    <Card className="shadow-card" data-ocid="risk.margin_gauges_panel">
      <CardHeader>
        <CardTitle className="text-base">Margin Utilization</CardTitle>
        <CardDescription>
          How much of your available margin is currently deployed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-around py-4">
          {GAUGES.map((g) => (
            <DonutGauge key={g.id} pct={g.pct} label={g.label} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {GAUGES.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background"
            >
              <span className="label-apple">Free</span>
              <span className="text-sm font-semibold">{100 - g.pct}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
