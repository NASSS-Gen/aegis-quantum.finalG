import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BEGINNER_PICKS } from "@/lib/arbitrageData";

const STEPS = [
  {
    num: "01",
    label: "Buy Low",
    desc: "Purchase the asset on the exchange offering the lowest price.",
  },
  {
    num: "02",
    label: "Transfer",
    desc: "Move the asset between exchanges at network speed.",
  },
  {
    num: "03",
    label: "Sell High",
    desc: "Sell the asset on the exchange offering the highest price.",
  },
];

/**
 * Beginner arbitrage explainer — three-step "how to arbitrage" walkthrough
 * plus a row of top arbitrage picks. The legacy "unlock advanced mode"
 * button referenced the removed `setMode` store action and the mode
 * selector itself is out of scope, so the locked panel is removed entirely.
 */
export default function BeginnerArbitrage() {
  return (
    <div className="flex flex-col gap-4">
      {/* How to arbitrage */}
      <Card className="shadow-subtle" data-ocid="beginner.how_to_panel">
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-tight">
            How to Arbitrage
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.num}
                data-ocid={`beginner.step.${step.num}`}
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/40 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                    {step.num}
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {step.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="beginner.watch_tutorial_button"
              className="text-xs font-medium"
            >
              Watch tutorial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top arbitrage picks */}
      <Card className="shadow-subtle" data-ocid="beginner.picks_panel">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Top Arbitrage Picks
          </CardTitle>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold uppercase tracking-wide"
          >
            System 99.9% Sync
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {BEGINNER_PICKS.map((pick, i) => (
              <div
                key={pick.id}
                data-ocid={`beginner.pick.${i + 1}`}
                className="metric-card flex flex-col gap-3 rounded-xl bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {pick.pair}
                  </span>
                  <Badge className="text-[10px] font-semibold tabular-nums">
                    +{pick.profitPercent.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Buy</span>
                  <span className="font-medium text-foreground">
                    {pick.buySite}
                  </span>
                  <span aria-hidden>→</span>
                  <span>Sell</span>
                  <span className="font-medium text-foreground">
                    {pick.sellSite}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  data-ocid={`beginner.execute_button.${i + 1}`}
                  className="w-full text-xs font-medium uppercase tracking-wide"
                >
                  Execute order
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
