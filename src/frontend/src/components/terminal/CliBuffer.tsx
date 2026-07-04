import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

type SignalKind = "info" | "ok" | "warn" | "auth" | "data";

interface SignalEntry {
  id: string;
  tag: string;
  kind: SignalKind;
  message: string;
}

const KIND_LABEL: Record<SignalKind, string> = {
  info: "Info",
  ok: "OK",
  warn: "Warn",
  auth: "Auth",
  data: "Data",
};

const INITIAL_SIGNALS: SignalEntry[] = [
  { id: "s1", tag: "INIT", kind: "info", message: "Boot sequence complete" },
  {
    id: "s2",
    tag: "AUTH",
    kind: "auth",
    message: "Internet Identity verified",
  },
  { id: "s3", tag: "NET", kind: "ok", message: "API latency 12ms" },
  {
    id: "s4",
    tag: "POOL",
    kind: "ok",
    message: "Quantum pool alpha-01 active",
  },
  { id: "s5", tag: "EXEC", kind: "ok", message: "HFT core engine started" },
  { id: "s6", tag: "FEED", kind: "data", message: "Market feed connected" },
  { id: "s7", tag: "SYS", kind: "ok", message: "Heartbeat ok" },
  { id: "s8", tag: "ML", kind: "warn", message: "Model retraining 88%" },
];

const ROTATION_SIGNALS: Omit<SignalEntry, "id">[] = [
  { tag: "NET", kind: "ok", message: "Packet loss 0.0% — nominal" },
  { tag: "EXEC", kind: "ok", message: "Signal dispatch queue depth 4" },
  { tag: "SYS", kind: "ok", message: "Heartbeat ok — uptime 99.06%" },
  { tag: "ML", kind: "warn", message: "Model retraining 91%" },
  { tag: "POOL", kind: "ok", message: "Quantum pool beta-02 standby" },
  { tag: "AUTH", kind: "auth", message: "Session token refreshed" },
  { tag: "FEED", kind: "data", message: "Tick stream ok — 14ms avg" },
  { tag: "EXEC", kind: "ok", message: "Arb scanner pass #1842" },
  { tag: "NET", kind: "ok", message: "Latency spike cleared — 9ms" },
  { tag: "SYS", kind: "ok", message: "GC sweep complete — mem ok" },
];

let rotateIdx = 0;

export function CliBuffer() {
  const [signals, setSignals] = useState<SignalEntry[]>(INITIAL_SIGNALS);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const base = ROTATION_SIGNALS[rotateIdx % ROTATION_SIGNALS.length];
      rotateIdx++;
      const entry: SignalEntry = {
        ...base,
        id: `dyn-${Date.now()}-${rotateIdx}`,
      };
      setSignals((prev) => [...prev.slice(-40), entry]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom on append
  useEffect(() => {
    const vp = viewportRef.current;
    if (vp) vp.scrollTop = vp.scrollHeight;
  }, [signals]);

  return (
    <Card
      data-ocid="terminal.cli_buffer"
      className="shadow-card h-[360px] gap-0 py-0"
    >
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-sm font-medium label-apple">
          Signal Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={viewportRef}
          data-ocid="terminal.cli_buffer.scroll"
          className="h-[300px] overflow-y-auto"
        >
          <ul className="divide-y divide-border">
            {signals.map((entry, i) => (
              <li
                key={entry.id}
                data-ocid={`terminal.cli_buffer.item.${i + 1}`}
                className="flex items-center gap-3 px-4 py-2 text-sm"
              >
                <Badge
                  variant="outline"
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wide"
                >
                  {entry.tag}
                </Badge>
                <span className="text-muted-foreground text-xs shrink-0 w-12">
                  {KIND_LABEL[entry.kind]}
                </span>
                <span className="truncate text-foreground/90">
                  {entry.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
