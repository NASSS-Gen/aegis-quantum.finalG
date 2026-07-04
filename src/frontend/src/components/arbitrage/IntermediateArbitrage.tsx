import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FINANCIAL_ARB,
  SPORTS_ARB,
  type SportLeague,
} from "@/lib/arbitrageData";
import { useState } from "react";

const LEAGUES: SportLeague[] = ["NBA", "NFL", "EPL", "UFC"];

/**
 * Intermediate arbitrage — a moderate view between the beginner explainer and
 * the full advanced tables. Shows opportunity cards with key metrics (match,
 * books, arb %) but collapses the detailed odds columns and the profit
 * rebalancer. Keeps the league selector so users can still filter.
 *
 * Monochrome Apple aesthetic — emphasis via weight, not color.
 */
export default function IntermediateArbitrage() {
  const [activeLeague, setActiveLeague] = useState<SportLeague>("NBA");

  const rows = SPORTS_ARB[activeLeague];

  return (
    <div className="flex flex-col gap-4">
      {/* Sports arbitrage cards */}
      <Card className="shadow-subtle" data-ocid="intermediate.sports_panel">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Sports Arbitrage
          </CardTitle>
          <div className="flex gap-1" data-ocid="intermediate.league.tabs">
            {LEAGUES.map((league) => {
              const active = activeLeague === league;
              return (
                <button
                  key={league}
                  type="button"
                  data-ocid={`intermediate.tab.${league.toLowerCase()}`}
                  onClick={() => setActiveLeague(league)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-smooth ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {league}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((row, i) => (
              <div
                key={row.id}
                data-ocid={`intermediate.sports_card.${i + 1}`}
                className="metric-card flex flex-col gap-3 rounded-xl bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {row.match}
                  </span>
                  <Badge className="text-[10px] font-semibold tabular-nums">
                    +{row.profit.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {row.bookA}
                  </span>
                  <span aria-hidden>↔</span>
                  <span className="font-medium text-foreground">
                    {row.bookB}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid={`intermediate.sports_execute_button.${i + 1}`}
                  className="w-full text-[10px] font-semibold uppercase tracking-wide"
                >
                  Execute
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial arbitrage cards */}
      <Card className="shadow-subtle" data-ocid="intermediate.financial_panel">
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-tight">
            Financial Arbitrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {FINANCIAL_ARB.map((row, i) => (
              <div
                key={row.id}
                data-ocid={`intermediate.financial_card.${i + 1}`}
                className="metric-card flex flex-col gap-3 rounded-xl bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {row.pair.replace(/_/g, " ")}
                  </span>
                  <Badge className="text-[10px] font-semibold tabular-nums">
                    +{row.gapPercent.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span>
                    {row.exchangeA}:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {row.currency}
                      {row.priceA.toLocaleString()}
                    </span>
                  </span>
                  <span aria-hidden>→</span>
                  <span>
                    {row.exchangeB}:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {row.currency}
                      {row.priceB.toLocaleString()}
                    </span>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid={`intermediate.financial_execute_button.${i + 1}`}
                  className="w-full text-[10px] font-semibold uppercase tracking-wide"
                >
                  Execute
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
