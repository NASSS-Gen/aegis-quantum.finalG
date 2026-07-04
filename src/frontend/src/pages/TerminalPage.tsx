import { Outcome, type SignalGrade, SignalType, Timeframe } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { usePredictionHistory } from "../hooks/usePredictionHistory";

/**
 * Activity view — clean signal log replacing the legacy CRT terminal.
 *
 * Renders the full backend prediction history as a scannable monochrome table
 * with outcome badges and P&L. No CRT effects, no mode gating, no brokerage
 * deploy stub. All surfaces use semantic design tokens.
 */
function formatSignal(signal: SignalType): string {
  const map: Record<SignalType, string> = {
    [SignalType.BuyCall]: "Buy Call",
    [SignalType.BuyPut]: "Buy Put",
    [SignalType.BuyFutures]: "Buy Futures",
    [SignalType.Hold]: "Hold",
    [SignalType.Sell]: "Sell",
  };
  return map[signal] ?? signal;
}

function formatTimeframe(tf: Timeframe): string {
  const map: Record<Timeframe, string> = {
    [Timeframe.M1]: "1M",
    [Timeframe.M5]: "5M",
    [Timeframe.M15]: "15M",
    [Timeframe.M30]: "30M",
    [Timeframe.H1]: "1H",
    [Timeframe.H4]: "4H",
    [Timeframe.D1]: "1D",
    [Timeframe.W1]: "1W",
  };
  return map[tf] ?? tf;
}

function formatTimestamp(ts: bigint): string {
  try {
    const ms = Number(ts / 1000000n);
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  if (outcome === Outcome.HitTarget)
    return (
      <Badge variant="default" className="font-mono text-[10px]">
        Hit target
      </Badge>
    );
  if (outcome === Outcome.HitStop)
    return (
      <Badge variant="secondary" className="font-mono text-[10px]">
        Hit stop
      </Badge>
    );
  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      Open
    </Badge>
  );
}

function GradeBadge({ grade }: { grade: SignalGrade }) {
  return (
    <Badge variant="outline" className="font-mono text-[10px] font-semibold">
      {grade}
    </Badge>
  );
}

export default function TerminalPage() {
  const { history, loading, error, refresh } = usePredictionHistory();

  const rows = useMemo(() => history, [history]);

  return (
    <div className="flex flex-col gap-6" data-ocid="terminal.page">
      <Card className="shadow-card" data-ocid="terminal.activity_card">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Signal log
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {rows.length} {rows.length === 1 ? "entry" : "entries"}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-ocid="terminal.refresh_button"
            onClick={refresh}
            disabled={loading}
            className="bg-card shadow-subtle"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div
              data-ocid="terminal.error_state"
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Couldn’t load the signal log.
              </p>
              <p className="font-mono text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                data-ocid="terminal.retry_button"
                onClick={refresh}
                className="bg-card shadow-subtle"
              >
                Try again
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div
              data-ocid="terminal.empty_state"
              className="flex flex-col items-center gap-3 py-16 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  No signals logged yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Switch to the Signal tab and generate a forecast to populate
                  the activity log.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[560px] pr-2">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="label-apple">Time</TableHead>
                    <TableHead className="label-apple">Asset</TableHead>
                    <TableHead className="label-apple">Signal</TableHead>
                    <TableHead className="label-apple">Grade</TableHead>
                    <TableHead className="label-apple">TF</TableHead>
                    <TableHead className="label-apple text-right">
                      Entry
                    </TableHead>
                    <TableHead className="label-apple text-right">
                      Target
                    </TableHead>
                    <TableHead className="label-apple text-right">
                      Stop
                    </TableHead>
                    <TableHead className="label-apple">Outcome</TableHead>
                    <TableHead className="label-apple text-right">
                      P&amp;L
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((entry, i) => {
                    const pnl = entry.pnl ?? 0;
                    return (
                      <TableRow
                        key={String(entry.id)}
                        data-ocid={`terminal.item.${i + 1}`}
                        className="trade-log-row"
                      >
                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">
                          {entry.assetId}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatSignal(entry.signal)}
                        </TableCell>
                        <TableCell>
                          <GradeBadge grade={entry.grade} />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatTimeframe(entry.timeframe)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {entry.entryPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {entry.targetPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {entry.stopLoss.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <OutcomeBadge
                            outcome={entry.outcome ?? Outcome.Open}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold tabular-nums">
                          {pnl >= 0 ? "+" : ""}
                          {pnl.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
