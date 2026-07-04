import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";

type LineKind = "prompt" | "output" | "error";

interface CliLine {
  id: string;
  kind: LineKind;
  text: string;
}

const COMMANDS: Record<string, string[]> = {
  "quant --fetch-market-depth": [
    "Fetching order book depth — NIFTY 50",
    "Bid 22,147.50  qty 4,200",
    "Bid 22,146.25  qty 3,840",
    "Bid 22,145.00  qty 2,100",
    "Ask 22,148.75  qty 4,500",
    "Ask 22,150.00  qty 2,980",
    "Ask 22,151.25  qty 1,420",
    "Spread 1.25 pts — liquidity high",
  ],
  "strategy --run": [
    "Loading strategy pack",
    "Strategy: momentum breakout v3",
    "Timeframe 5m  asset NIFTY 50",
    "Signal score 87.4 / 100",
    "Entry 22,148  target 22,310  stop 22,080",
    "Dispatched.",
  ],
  help: [
    "Available commands",
    "  quant --fetch-market-depth   fetch live order book",
    "  strategy --run               run active strategy",
    "  risk --status                risk exposure snapshot",
    "  arb --scan                   scan arbitrage ops",
    "  sys --status                 system health check",
    "  clear                        clear terminal",
  ],
  "risk --status": [
    "Risk exposure  2.1%",
    "Margin used    38.4%",
    "Kill switch    off",
    "Max drawdown   5.0%",
    "Current dd     1.04% — safe",
  ],
  "arb --scan": [
    "Scanning arbitrage opportunities",
    "NIFTY spot vs NIFTY fut — spread 12.5 pts",
    "BTC INR vs BTC USD — spread $142",
    "GOLD MCX vs GOLD COMEX — spread ₹48.20",
    "3 opportunities detected",
  ],
  "sys --status": [
    "System status nominal",
    "Uptime 99.06%  latency 12ms  threads 1,924",
    "HFT core live  ML sentiment retraining 88%",
    "Quantum integrity secure",
  ],
};

const QUICK_COMMANDS = [
  { label: "Run strategy", cmd: "strategy --run" },
  { label: "Risk status", cmd: "risk --status" },
  { label: "Arb scan", cmd: "arb --scan" },
  { label: "Market depth", cmd: "quant --fetch-market-depth" },
];

const INIT_LINES: CliLine[] = [
  { id: "init-0", kind: "output", text: "Aegis Quantum terminal v4.0.2" },
  { id: "init-1", kind: "output", text: "Type 'help' for available commands" },
];

export function InteractiveCli() {
  const [lines, setLines] = useState<CliLine[]>(INIT_LINES);
  const [input, setInput] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom on append
  useEffect(() => {
    const vp = viewportRef.current;
    if (vp) vp.scrollTop = vp.scrollHeight;
  }, [lines]);

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const promptLine: CliLine = {
      id: `cmd-${Date.now()}`,
      kind: "prompt",
      text: `admin@aegis ~ $ ${cmd}`,
    };

    if (trimmed === "clear") {
      setLines(INIT_LINES);
      setInput("");
      return;
    }

    const outputs = COMMANDS[trimmed];
    const outLines: CliLine[] = outputs
      ? outputs.map((t, i) => ({
          id: `out-${Date.now()}-${i}`,
          kind: "output" as const,
          text: t,
        }))
      : [
          {
            id: `err-${Date.now()}`,
            kind: "error" as const,
            text: `Command not found: '${cmd}' — type 'help'`,
          },
        ];

    setLines((prev) => [...prev, promptLine, ...outLines]);
    setInput("");
  };

  const handleQuick = (cmd: string) => {
    runCommand(cmd);
    inputRef.current?.focus();
  };

  return (
    <Card
      data-ocid="terminal.interactive_cli"
      className="shadow-card h-full gap-0 py-0"
    >
      <CardHeader className="px-4 py-3 border-b flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium label-apple">
          Command Console
        </CardTitle>
        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
          Secure
        </Badge>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b">
          {QUICK_COMMANDS.map((q, i) => (
            <Button
              key={q.cmd}
              type="button"
              variant="outline"
              size="sm"
              data-ocid={`terminal.quick_cmd.${i + 1}`}
              onClick={() => handleQuick(q.cmd)}
              className="h-7 text-xs"
            >
              {q.label}
            </Button>
          ))}
        </div>

        {/* Buffer */}
        <div
          ref={viewportRef}
          data-ocid="terminal.interactive_cli.scroll"
          className="flex-1 min-h-0 overflow-y-auto"
        >
          <div className="px-4 py-3 space-y-1 font-mono text-xs">
            {lines.map((line) => (
              <div
                key={line.id}
                data-ocid={
                  line.kind === "prompt"
                    ? "terminal.interactive_cli.prompt"
                    : line.kind === "error"
                      ? "terminal.interactive_cli.error_state"
                      : "terminal.interactive_cli.output"
                }
                className={
                  line.kind === "prompt"
                    ? "text-foreground font-medium"
                    : line.kind === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t">
          <span className="font-mono text-xs text-muted-foreground shrink-0">
            $
          </span>
          <Input
            ref={inputRef}
            data-ocid="terminal.cli_input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runCommand(input);
            }}
            placeholder="Enter command…"
            autoComplete="off"
            spellCheck={false}
            className="h-8 border-0 shadow-none focus-visible:ring-0 font-mono text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
