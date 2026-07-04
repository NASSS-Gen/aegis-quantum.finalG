import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

/**
 * Execution node panel — shows the active arbitrage pair, source/target
 * prices, slippage tolerance, and estimated net. The execute button runs a
 * short simulated confirmation. Monochrome: emphasis via weight, not color.
 */
export default function ExecutionNode() {
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);

  function handleExecute() {
    setExecuting(true);
    setDone(false);
    setTimeout(() => {
      setExecuting(false);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 1800);
  }

  const rows = [
    { label: "Pair", value: "BTC-ARBITRAGE-01" },
    { label: "Source Price", value: "$42,180.22" },
    { label: "Target Price", value: "$42,261.44" },
    { label: "Slippage Tolerance", value: "0.05%" },
  ];

  return (
    <Card data-ocid="execution.node.panel" className="shadow-subtle">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">
          Execution Node
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {row.label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Estimated Net
          </div>
          <div className="text-2xl font-semibold tabular-nums text-foreground">
            +$1,020.72
          </div>
        </div>

        {done && (
          <div
            data-ocid="execution.success_state"
            className="text-center text-xs font-medium uppercase tracking-wide text-foreground"
          >
            ✓ Quantum swap executed
          </div>
        )}

        <Button
          type="button"
          variant="default"
          size="default"
          data-ocid="execution.execute_button"
          disabled={executing}
          onClick={handleExecute}
          className="w-full text-xs font-semibold uppercase tracking-wide"
        >
          {executing ? "Executing…" : "Execute Quantum Swap"}
        </Button>
      </CardContent>
    </Card>
  );
}
