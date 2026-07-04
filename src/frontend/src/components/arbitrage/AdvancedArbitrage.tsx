import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FINANCIAL_ARB,
  SPORTS_ARB,
  type SportLeague,
} from "@/lib/arbitrageData";
import { useState } from "react";

const LEAGUES: SportLeague[] = ["NBA", "NFL", "EPL", "UFC"];

/**
 * Advanced arbitrage scanner — sports arbitrage table (league-tabbed) plus a
 * financial arbitrage list and a profit rebalancer calculator. All
 * monochrome using shadcn Table, Badge, and Card primitives.
 */
export default function AdvancedArbitrage() {
  const [activeLeague, setActiveLeague] = useState<SportLeague>("NBA");
  const [capital, setCapital] = useState("125000");
  const [fees, setFees] = useState("0.1");
  const [netResult, setNetResult] = useState<string | null>(null);

  function calcNet() {
    const cap = Number.parseFloat(capital) || 0;
    const fee = Number.parseFloat(fees) / 100 || 0;
    const net = cap - cap * fee * 2;
    setNetResult(
      `$${net.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    );
  }

  const rows = SPORTS_ARB[activeLeague];

  return (
    <div className="flex flex-col gap-4">
      {/* Sports arbitrage */}
      <Card className="shadow-subtle" data-ocid="sports.panel">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Sports Arbitrage
          </CardTitle>
          <div className="flex gap-1" data-ocid="sports.league.tabs">
            {LEAGUES.map((league) => {
              const active = activeLeague === league;
              return (
                <button
                  key={league}
                  type="button"
                  data-ocid={`sports.tab.${league.toLowerCase()}`}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Match
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Book A / Odds
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Book B / Odds
                </TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground">
                  Arb %
                </TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wide text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id} data-ocid={`sports.row.${i + 1}`}>
                  <TableCell className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {row.match}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {row.bookA}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {row.oddsA.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {row.bookB}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {row.oddsB.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="text-[10px] font-semibold tabular-nums">
                      +{row.profit.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-ocid={`sports.execute_button.${i + 1}`}
                      className="text-[10px] font-semibold uppercase tracking-wide"
                    >
                      Execute
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial arbitrage */}
      <Card className="shadow-subtle" data-ocid="financial.panel">
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-tight">
            Financial Arbitrage
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {FINANCIAL_ARB.map((row, i) => (
            <div
              key={row.id}
              data-ocid={`financial.row.${i + 1}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {row.pair.replace(/_/g, " ")}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
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
                  <span>
                    Gap:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {row.currency}
                      {row.gap}
                    </span>
                  </span>
                </div>
              </div>
              <Badge className="shrink-0 text-[10px] font-semibold tabular-nums">
                +{row.gapPercent.toFixed(2)}%
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid={`financial.execute_button.${i + 1}`}
                className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
              >
                Execute
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Profit rebalancer */}
      <Card className="shadow-subtle" data-ocid="rebalancer.panel">
        <CardHeader className="flex-row items-center gap-2">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Profit Rebalancer
          </CardTitle>
          <Badge
            variant="secondary"
            className="text-[10px] font-semibold uppercase tracking-wide"
          >
            Beta
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rebalancer-capital" className="config-label">
                Entry Capital
              </label>
              <input
                id="rebalancer-capital"
                type="text"
                data-ocid="rebalancer.capital_input"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="config-input rounded-lg px-3 py-2 text-sm font-medium tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rebalancer-fees" className="config-label">
                Exchange Fees %
              </label>
              <input
                id="rebalancer-fees"
                type="text"
                data-ocid="rebalancer.fees_input"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="config-input rounded-lg px-3 py-2 text-sm font-medium tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="config-label">Estimated Net</span>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-semibold tabular-nums text-foreground">
                {netResult ?? "——"}
              </div>
            </div>
            <Button
              type="button"
              variant="default"
              size="default"
              data-ocid="rebalancer.calculate_button"
              onClick={calcNet}
              className="text-xs font-semibold uppercase tracking-wide"
            >
              Calculate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
