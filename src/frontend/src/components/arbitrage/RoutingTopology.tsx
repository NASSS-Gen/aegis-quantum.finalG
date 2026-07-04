import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LATENCY_ROWS = [
  { label: "Signal Packet Arrival", val: "8ms", ok: true },
  { label: "API Endpoint Sync", val: "12ms", ok: true },
  { label: "Cross Revenue Lock", val: "4ms", ok: true },
];

/**
 * Routing topology panel — two execution nodes connected by a liquidity
 * bridge, plus a latency status list. The animated moving dot from the CRT
 * version is replaced with a clean static bridge label.
 */
export default function RoutingTopology() {
  return (
    <Card data-ocid="routing.topology.panel" className="shadow-subtle">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">
          Routing Topology
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Node bridge */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground">
            Node 01
          </div>
          <div className="relative flex-1">
            <div className="h-px w-full bg-border" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              X-Liquid Bridge
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground">
            Node 02
          </div>
        </div>

        {/* Latency status */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Latency Arbitrage Status
          </span>
          {LATENCY_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="flex items-center gap-1.5 font-semibold tabular-nums text-foreground">
                {row.val}
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {row.ok ? "✓" : "✗"}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
