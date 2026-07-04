import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOG_TEMPLATES } from "@/lib/indianMarketData";
import { useEffect, useRef, useState } from "react";

interface LogEntry {
  id: string;
  text: string;
  ts: string;
  level: "DATA" | "NET" | "EXEC" | "WARN";
}

function levelOf(text: string): LogEntry["level"] {
  if (text.startsWith("[WARN]")) return "WARN";
  if (text.startsWith("[NET]")) return "NET";
  if (text.startsWith("[EXEC]")) return "EXEC";
  return "DATA";
}

function levelBadgeVariant(
  level: LogEntry["level"],
): "default" | "secondary" | "outline" {
  if (level === "WARN") return "secondary";
  if (level === "EXEC") return "default";
  return "outline";
}

function makeEntry(index: number): LogEntry {
  const now = new Date();
  const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  const text = LOG_TEMPLATES[index % LOG_TEMPLATES.length];
  return {
    id: `log-${Date.now()}-${index}`,
    text,
    ts,
    level: levelOf(text),
  };
}

/**
 * Signal / activity log — replaces the old CRT terminal stream with a clean,
 * readable list of feed events. Each row shows a timestamp, a level badge,
 * and the message text. Auto-scrolls to the latest entry.
 */
export default function TerminalStreamLog() {
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    Array.from({ length: 8 }, (_, i) => makeEntry(i)),
  );
  const logRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(8);

  useEffect(() => {
    const interval = setInterval(() => {
      const entry = makeEntry(counterRef.current);
      counterRef.current += 1;
      setLogs((prev) => [...prev.slice(-19), entry]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new entry
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <Card data-ocid="market.terminal_log" className="shadow-subtle">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold tracking-tight">
          Signal &amp; Activity Log
        </CardTitle>
        <Badge
          variant="outline"
          className="text-[10px] font-semibold uppercase tracking-wide"
        >
          NSE Live Feed
        </Badge>
      </CardHeader>
      <CardContent>
        <div
          ref={logRef}
          data-ocid="market.terminal_log.list"
          className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1"
        >
          {logs.map((log) => (
            <div
              key={log.id}
              data-ocid="market.terminal_log.item"
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60"
            >
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {log.ts}
              </span>
              <Badge
                variant={levelBadgeVariant(log.level)}
                className="shrink-0 text-[10px] font-semibold uppercase tracking-wide"
              >
                {log.level}
              </Badge>
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                {log.text.replace(/^\[(?:WARN|NET|EXEC|DATA)\]\s*/, "")}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
