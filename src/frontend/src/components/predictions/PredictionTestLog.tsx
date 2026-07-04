import { type PredictionRecord, SignalType } from "@/backend";
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

interface PredictionTestLogProps {
  entries: PredictionRecord[];
  onClear: () => void;
}

export function PredictionTestLog({
  entries,
  onClear,
}: PredictionTestLogProps) {
  return (
    <Card data-ocid="predictions.test_log" className="shadow-card h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Signal Log</CardTitle>
        <button
          type="button"
          data-ocid="predictions.clear_log_button"
          onClick={onClear}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-smooth hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Refresh
        </button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px] pr-2">
          {entries.length === 0 ? (
            <div
              data-ocid="predictions.test_log.empty_state"
              className="flex h-32 items-center justify-center text-sm text-muted-foreground"
            >
              No signals logged yet — generate a forecast to begin.
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead className="label-apple">Time</TableHead>
                  <TableHead className="label-apple">Asset</TableHead>
                  <TableHead className="label-appile">Signal</TableHead>
                  <TableHead className="label-apple text-right">
                    Entry
                  </TableHead>
                  <TableHead className="label-apple text-right">
                    Target
                  </TableHead>
                  <TableHead className="label-apple text-right">Stop</TableHead>
                  <TableHead className="label-apple">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow
                    key={String(entry.id)}
                    data-ocid={`predictions.test_log.item.${i + 1}`}
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
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {entry.entryPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {entry.targetPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {entry.stopLoss.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {entry.grade}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
