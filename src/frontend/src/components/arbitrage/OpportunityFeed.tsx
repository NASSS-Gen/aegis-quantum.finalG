import { Badge } from "@/components/ui/badge";
import {
  INITIAL_OPPORTUNITIES,
  NEW_OPPORTUNITY_POOL,
  type OppTag,
  type OpportunityCard,
} from "@/lib/arbitrageData";
import { useEffect, useRef, useState } from "react";

const TAG_VARIANT: Record<OppTag, "default" | "secondary" | "outline"> = {
  HIGH_YIELD_ALERT: "default",
  TRIANGULAR_NODE: "secondary",
  STALE_MARKET: "outline",
  LIQUIDITY_GAP: "outline",
  FAST_EXEC: "secondary",
};

const TAG_LABEL: Record<OppTag, string> = {
  HIGH_YIELD_ALERT: "High Yield",
  TRIANGULAR_NODE: "Triangular",
  STALE_MARKET: "Stale Market",
  LIQUIDITY_GAP: "Liquidity Gap",
  FAST_EXEC: "Fast Exec",
};

let poolIdx = 0;

function getTimestamp() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

/**
 * Live opportunity feed — streaming list of arbitrage opportunities with a
 * tag badge, pair, profit, and detection timestamp. New entries prepend to
 * the top; the list caps at 20 rows.
 */
export default function OpportunityFeed() {
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>(
    INITIAL_OPPORTUNITIES.map((o) => ({ ...o, detectedAt: o.detectedAt })),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = NEW_OPPORTUNITY_POOL[poolIdx % NEW_OPPORTUNITY_POOL.length];
      poolIdx++;
      const newOpp: OpportunityCard = {
        ...next,
        id: `live_${Date.now()}`,
        detectedAt: getTimestamp(),
      };
      setOpportunities((prev) => [newOpp, ...prev.slice(0, 19)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={scrollRef}
      data-ocid="opportunity.feed"
      className="flex max-h-[480px] flex-col gap-1.5 overflow-y-auto pr-1"
    >
      {opportunities.map((opp, i) => (
        <div
          key={opp.id}
          data-ocid={`opportunity.item.${i + 1}`}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-smooth hover:bg-muted/60"
        >
          <Badge
            variant={TAG_VARIANT[opp.tag]}
            className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
          >
            {TAG_LABEL[opp.tag]}
          </Badge>
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {opp.pair.replace(/_/g, " ")}
          </span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
            +{opp.profit.toFixed(2)}%
          </span>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {opp.detectedAt}
          </span>
        </div>
      ))}
    </div>
  );
}
