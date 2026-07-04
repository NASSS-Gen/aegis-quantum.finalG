import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

type LogTag = "EXEC" | "SYS" | "NET" | "WARN" | "ERR" | "INFO";

type LogEntry = {
  id: number;
  tag: LogTag;
  message: string;
  ts: string;
  isNew?: boolean;
};

const TAG_VARIANT: Record<LogTag, "default" | "secondary" | "outline"> = {
  EXEC: "default",
  SYS: "secondary",
  NET: "secondary",
  WARN: "outline",
  ERR: "default",
  INFO: "outline",
};

const SEED_LOGS: Omit<LogEntry, "id" | "ts" | "isNew">[] = [
  { tag: "EXEC", message: "Order filled BTC-PERP +0.85 BTC @ 42,312.45" },
  { tag: "SYS", message: "Heartbeat OK — latency 12ms" },
  { tag: "NET", message: "API ping success — node: IC mainnet" },
  { tag: "WARN", message: "Margin utilization 62% — monitor" },
  { tag: "EXEC", message: "Order filled ETH-PERP -12.0 ETH @ 3,892.15" },
  { tag: "SYS", message: "Engine tick v4.0 — XENON OK" },
  { tag: "INFO", message: "Signal lock: SOL-PERP 4H candle confirmed" },
  { tag: "NET", message: "WS reconnect OK — feed stable" },
];

const NEW_ENTRY_POOL: Omit<LogEntry, "id" | "ts" | "isNew">[] = [
  { tag: "EXEC", message: "Order placed SOL-PERP +450 SOL @ market" },
  { tag: "SYS", message: "Heartbeat OK — latency 9ms" },
  { tag: "NET", message: "API ping success — RTT 8ms" },
  { tag: "WARN", message: "Drawdown threshold 1.8% — watch" },
  { tag: "EXEC", message: "Stop order triggered XRP-PERP @ 0.638" },
  { tag: "INFO", message: "ML sentiment score BTC: 72% bullish" },
  { tag: "SYS", message: "Memory pool OK — 2.1GB free" },
  { tag: "NET", message: "Exchange feed sync OK — Binance" },
  { tag: "WARN", message: "Volatility spike VIX > 15.0 — caution" },
  { tag: "EXEC", message: "Partial fill ETH-PERP -4.5 ETH @ 3,889.20" },
  { tag: "SYS", message: "Risk guardian check — all clear" },
];

let idCounter = 100;

function makeEntry(template: Omit<LogEntry, "id" | "ts" | "isNew">): LogEntry {
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  return { ...template, id: idCounter++, ts, isNew: true };
}

export function CriticalLogFeed() {
  const [entries, setEntries] = useState<LogEntry[]>(() =>
    SEED_LOGS.map((s, i) => {
      const d = new Date(Date.now() - (SEED_LOGS.length - i) * 5000);
      const ts = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
      return { ...s, id: i, ts };
    }),
  );
  const poolIdx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const template = NEW_ENTRY_POOL[poolIdx.current % NEW_ENTRY_POOL.length];
      poolIdx.current++;
      const entry = makeEntry(template);
      setEntries((prev) => [entry, ...prev].slice(0, 60));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (entries[0]?.isNew) {
      const t = setTimeout(() => {
        setEntries((prev) =>
          prev.map((e, i) => (i === 0 ? { ...e, isNew: false } : e)),
        );
      }, 600);
      return () => clearTimeout(t);
    }
  }, [entries]);

  return (
    <Card className="shadow-card" data-ocid="critical_log.panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Activity Feed</CardTitle>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-foreground"
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "240px" }}
          data-ocid="critical_log.list"
        >
          {entries.map((e, i) => (
            <div
              key={e.id}
              className="flex items-start gap-2 py-1.5 text-xs trade-log-row"
              data-ocid={`critical_log.item.${i + 1}`}
            >
              <span className="flex-shrink-0 font-mono text-muted-foreground">
                {e.ts}
              </span>
              <Badge
                variant={TAG_VARIANT[e.tag]}
                className="flex-shrink-0 text-[10px] px-1.5 py-0"
              >
                {e.tag}
              </Badge>
              <span className="text-foreground min-w-0 break-words">
                {e.message}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
