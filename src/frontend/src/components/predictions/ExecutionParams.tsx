import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExecutionParamsProps {
  entryPrice: number;
  target1: number;
  target2: number;
  stopLoss: number;
}

interface ParamRow {
  label: string;
  value: number;
  emphasis: boolean;
}

export function ExecutionParams({
  entryPrice,
  target1,
  target2,
  stopLoss,
}: ExecutionParamsProps) {
  const rows: ParamRow[] = [
    { label: "Entry", value: entryPrice, emphasis: false },
    { label: "Target 1", value: target1, emphasis: true },
    { label: "Target 2", value: target2, emphasis: true },
    { label: "Stop loss", value: stopLoss, emphasis: false },
  ];

  return (
    <Card data-ocid="predictions.execution_params" className="shadow-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Execution Parameters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="label-apple">Level</TableHead>
              <TableHead className="label-apple text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="text-sm text-muted-foreground">
                  {row.label}
                </TableCell>
                <TableCell
                  className={`text-right font-mono tabular-nums ${
                    row.emphasis
                      ? "font-semibold text-foreground"
                      : "text-foreground"
                  }`}
                >
                  {row.value.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
