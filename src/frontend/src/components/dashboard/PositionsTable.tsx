import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

type Position = {
  pair: string;
  side: "LONG" | "SHORT";
  size: string;
  entry: number;
  current: number;
  pnl: number;
  pnlPct: number;
};

const INITIAL: Position[] = [
  {
    pair: "BTC-PERP",
    side: "LONG",
    size: "+0.85 BTC",
    entry: 41200.0,
    current: 42312.45,
    pnl: 945.9,
    pnlPct: 2.7,
  },
  {
    pair: "ETH-PERP",
    side: "SHORT",
    size: "12.0 ETH",
    entry: 3960.0,
    current: 3892.15,
    pnl: 814.2,
    pnlPct: 1.71,
  },
  {
    pair: "SOL-PERP",
    side: "LONG",
    size: "450 SOL",
    entry: 178.0,
    current: 182.44,
    pnl: 1998.0,
    pnlPct: 2.49,
  },
  {
    pair: "XRP-PERP",
    side: "SHORT",
    size: "85k XRP",
    entry: 0.62,
    current: 0.638,
    pnl: -1530.0,
    pnlPct: -2.9,
  },
];

function nudge(p: Position): Position {
  const delta = (Math.random() - 0.5) * 0.002;
  const newCurrent = p.current * (1 + delta);
  const newPnl =
    p.side === "LONG"
      ? (newCurrent - p.entry) * Number.parseFloat(p.size)
      : (p.entry - newCurrent) * Number.parseFloat(p.size);
  const newPnlPct =
    ((newCurrent - p.entry) / p.entry) * 100 * (p.side === "SHORT" ? -1 : 1);
  return { ...p, current: newCurrent, pnl: newPnl, pnlPct: newPnlPct };
}

export function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>(INITIAL);

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) => prev.map(nudge));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-card" data-ocid="positions_table.panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
          <span className="text-xs text-muted-foreground">
            Binance Futures · Cross 10×
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">Unreal. P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((p, i) => (
              <TableRow
                key={p.pair}
                data-ocid={`positions_table.item.${i + 1}`}
              >
                <TableCell className="font-medium">{p.pair}</TableCell>
                <TableCell>
                  <Badge
                    variant={p.side === "LONG" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {p.side}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.size}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {p.entry.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {p.current.toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                  })}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    p.pnl >= 0
                      ? "metric-value-positive"
                      : "metric-value-negative"
                  }`}
                >
                  {p.pnl >= 0 ? "+" : ""}
                  {p.pnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
