import AdvancedArbitrage from "@/components/arbitrage/AdvancedArbitrage";
import BeginnerArbitrage from "@/components/arbitrage/BeginnerArbitrage";
import ExecutionNode from "@/components/arbitrage/ExecutionNode";
import IntermediateArbitrage from "@/components/arbitrage/IntermediateArbitrage";
import OpportunityFeed from "@/components/arbitrage/OpportunityFeed";
import PowerUserArbitrage from "@/components/arbitrage/PowerUserArbitrage";
import RoutingTopology from "@/components/arbitrage/RoutingTopology";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExperienceMode } from "@/store/appStore";

interface ArbitrageViewProps {
  mode: ExperienceMode;
}

/**
 * Arbitrage view — switches layout based on the user-selected experience mode.
 *
 * - beginner: explainer panels + simplified opportunity cards only.
 * - intermediate: live feed + simplified opportunity cards with key metrics
 *   (no advanced tables).
 * - advanced: live feed + execution stack + full sports & financial arbitrage
 *   tables with detailed metrics.
 * - optional: everything above plus experimental controls and power-user
 *   tuning surfaces.
 *
 * All in the monochrome Apple aesthetic.
 */
export default function ArbitrageView({ mode }: ArbitrageViewProps) {
  if (mode === "beginner") {
    return (
      <div data-ocid="arbitrage.view" className="flex flex-col gap-6">
        <BeginnerArbitrage />
      </div>
    );
  }

  if (mode === "intermediate") {
    return (
      <div data-ocid="arbitrage.view" className="flex flex-col gap-6">
        <IntermediateArbitrage />
      </div>
    );
  }

  if (mode === "optional") {
    return (
      <div data-ocid="arbitrage.view" className="flex flex-col gap-6">
        <PowerUserArbitrage />
      </div>
    );
  }

  // advanced (default)
  return (
    <div data-ocid="arbitrage.view" className="flex flex-col gap-6">
      {/* Live feed + execution stack */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-subtle" data-ocid="arbitrage.feed_panel">
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

      {/* Sports + financial arbitrage scanner */}
      <AdvancedArbitrage />
    </div>
  );
}
