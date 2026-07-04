import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FibonacciLevelsProps {
  entryPrice: number;
  target2: number;
  stopLoss: number;
}

type FibStatus = "Strong" | "Moderate" | "Weak";

interface FibLevel {
  pct: string;
  ratio: number;
  status: FibStatus;
}

const FIB_LEVELS: FibLevel[] = [
  { pct: "0%", ratio: 0, status: "Strong" },
  { pct: "23.6%", ratio: 0.236, status: "Moderate" },
  { pct: "38.2%", ratio: 0.382, status: "Strong" },
  { pct: "50%", ratio: 0.5, status: "Moderate" },
  { pct: "61.8%", ratio: 0.618, status: "Strong" },
  { pct: "100%", ratio: 1.0, status: "Weak" },
];

const STATUS_TONE: Record<FibStatus, "default" | "secondary" | "outline"> = {
  Strong: "default",
  Moderate: "secondary",
  Weak: "outline",
};

export function FibonacciLevels({
  entryPrice,
  target2,
  stopLoss,
}: FibonacciLevelsProps) {
  const swing = target2 - stopLoss;

  return (
    <Card data-ocid="predictions.fibonacci_levels" className="shadow-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Fibonacci Confluence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {FIB_LEVELS.map((fib) => {
            const price = stopLoss + swing * fib.ratio;
            const isEntry = Math.abs(price - entryPrice) < swing * 0.05;
            return (
              <div
                key={fib.pct}
                data-ocid={`predictions.fibonacci_levels.item.${fib.pct}`}
                className={`rounded-lg border p-2.5 transition-smooth ${
                  isEntry
                    ? "border-foreground/30 bg-accent"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {fib.pct}
                  </span>
                  {isEntry && (
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      Entry
                    </Badge>
                  )}
                </div>
                <div className="mt-1 font-mono text-sm tabular-nums text-foreground">
                  ₹{price.toFixed(2)}
                </div>
                <div className="mt-1.5">
                  <Badge
                    variant={STATUS_TONE[fib.status]}
                    className="px-1.5 py-0 text-[10px] font-medium"
                  >
                    {fib.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
