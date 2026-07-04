import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type BacktestTrade, Direction } from "@/hooks/useBacktest";

interface Props {
  trades: BacktestTrade[];
}

const COLS = [
  { key: "entry", label: "Entry Time", align: "left" as const },
  { key: "dir", label: "Dir", align: "left" as const },
  { key: "entryPrice", label: "Entry", align: "right" as const },
  { key: "exitPrice", label: "Exit", align: "right" as const },
  { key: "return", label: "Return", align: "right" as const },
  { key: "hold", label: "Hold", align: "right" as const },
  { key: "pnl", label: "PnL", align: "right" as const },
];

export function TradeLogTable({ trades }: Props) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      data-ocid="backtest.trade_log_table"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          Trade Log
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {trades.length} executions
        </span>
      </div>

      <div className="overflow-auto" style={{ maxHeight: 360 }}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="border-border">
              {COLS.map((c) => (
                <TableHead
                  key={c.key}
                  className={c.align === "right" ? "text-right" : "text-left"}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLS.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                  data-ocid="backtest.trade_log_empty"
                >
                  No trades executed
                </TableCell>
              </TableRow>
            ) : (
              trades.map((t, i) => {
                const isLong = t.direction === Direction.Long;
                const isWin = t.returnPercent >= 0;
                return (
                  <TableRow
                    key={`${t.entryTimestamp.toString()}-${t.exitTimestamp.toString()}-${i}`}
                    className="trade-log-row"
                    data-ocid={`backtest.trade_log.row.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatTs(t.entryTimestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isLong ? "default" : "secondary"}>
                        {t.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {t.entryPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {t.exitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {isWin ? "+" : ""}
                      {t.returnPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {t.holdingPeriod.toString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {t.pnl >= 0 ? "+" : ""}
                      {t.pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatTs(ts: bigint): string {
  const d = new Date(Number(ts) * 1000);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const mo = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${mo}/${day} ${h}:${m}`;
}
