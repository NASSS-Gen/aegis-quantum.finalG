import AdvancedArbitrage from "@/components/arbitrage/AdvancedArbitrage";
import ExecutionNode from "@/components/arbitrage/ExecutionNode";
import OpportunityFeed from "@/components/arbitrage/OpportunityFeed";
import RoutingTopology from "@/components/arbitrage/RoutingTopology";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const EXPERIMENTAL_TOGGLES = [
  {
    id: "auto_hedge",
    label: "Auto-Hedge",
    desc: "Automatically open offsetting positions to neutralize directional risk on every executed arbitrage.",
  },
  {
    id: "flash_loans",
    label: "Flash Loan Routing",
    desc: "Borrow entry capital on-chain and repay in the same transaction to execute without posting collateral.",
  },
  {
    id: "mev_protection",
    label: "MEV Protection",
    desc: "Route DEX legs through private mempools to prevent sandwich attacks on atomic arbitrage.",
  },
  {
    id: "triangular_mode",
    label: "Triangular Mode",
    desc: "Scan three-leg currency cycles within a single exchange for intra-venue arbitrage.",
  },
];

const POWER_CONTROLS = [
  { label: "Entry Size", value: "$125,000", hint: "Max capital per leg" },
  { label: "Leverage", value: "3.0×", hint: "Cross-exchange leverage" },
  { label: "Gas Priority", value: "Fast", hint: "On-chain tx priority" },
  { label: "Min Profit", value: "0.15%", hint: "Execution threshold" },
];

/**
 * PowerUserArbitrage — the Optional-mode surface. Composes the full advanced
 * scanner plus the live feed, execution stack, experimental feature toggles,
 * and power-user tuning controls. Everything available in the arbitrage
 * module, surfaced for users who want maximum control.
 *
 * Monochrome Apple aesthetic — emphasis via weight, not color.
 */
export default function PowerUserArbitrage() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    auto_hedge: true,
    flash_loans: false,
    mev_protection: true,
    triangular_mode: false,
  });

  function setToggle(id: string, next: boolean) {
    setToggles((prev) => ({ ...prev, [id]: next }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Power-user controls */}
      <Card className="shadow-subtle" data-ocid="poweruser.controls_panel">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Power-User Controls
          </CardTitle>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold uppercase tracking-wide"
          >
            Optional Mode
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {POWER_CONTROLS.map((ctrl) => (
              <div
                key={ctrl.label}
                data-ocid={`poweruser.control.${ctrl.label.toLowerCase().replace(/\s+/g, "_")}`}
                className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-3"
              >
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {ctrl.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {ctrl.value}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {ctrl.hint}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live feed + execution stack */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-subtle" data-ocid="poweruser.feed_panel">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-tight">
              Live Opportunity Feed
            </CardTitle>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Scanning
            </span>
          </CardHeader>
          <CardContent>
            <OpportunityFeed />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <ExecutionNode />
          <RoutingTopology />
        </div>
      </div>

      {/* Experimental features */}
      <Card className="shadow-subtle" data-ocid="poweruser.experimental_panel">
        <CardHeader className="flex-row items-center gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Experimental Features
          </CardTitle>
          <Badge
            variant="secondary"
            className="text-[10px] font-semibold uppercase tracking-wide"
          >
            Beta
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {EXPERIMENTAL_TOGGLES.map((feature) => (
              <div
                key={feature.id}
                data-ocid={`poweruser.toggle.${feature.id}`}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-xs font-semibold tracking-tight text-foreground">
                    {feature.label}
                  </span>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </span>
                </div>
                <Switch
                  checked={!!toggles[feature.id]}
                  onCheckedChange={(next) => setToggle(feature.id, next)}
                  aria-label={feature.label}
                  data-ocid={`poweruser.switch.${feature.id}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="default"
              size="sm"
              data-ocid="poweruser.apply_config_button"
              className="text-xs font-semibold uppercase tracking-wide"
            >
              Apply Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full advanced scanner */}
      <AdvancedArbitrage />
    </div>
  );
}
