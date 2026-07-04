import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAIRS = ["BTC", "ETH", "XAU", "SPY"];

// Symmetric 4x4 correlation matrix
const CORR: number[][] = [
  [1.0, 0.94, 0.12, 0.55],
  [0.94, 1.0, 0.08, 0.51],
  [0.12, 0.08, 1.0, -0.45],
  [0.55, 0.51, -0.45, 1.0],
];

/**
 * Monochrome correlation encoding — strength of correlation drives ink
 * darkness. Positive = darker fill, negative = lighter outline style.
 */
function corrStyle(v: number): { bg: string; text: string; weight: string } {
  if (v === 1.0)
    return {
      bg: "oklch(var(--surface-3))",
      text: "oklch(var(--muted-foreground))",
      weight: "500",
    };
  if (v >= 0.8)
    return {
      bg: "oklch(var(--foreground) / 0.22)",
      text: "oklch(var(--foreground))",
      weight: "600",
    };
  if (v >= 0.5)
    return {
      bg: "oklch(var(--foreground) / 0.12)",
      text: "oklch(var(--foreground) / 0.85)",
      weight: "500",
    };
  if (v >= 0.1)
    return {
      bg: "oklch(var(--foreground) / 0.06)",
      text: "oklch(var(--foreground) / 0.7)",
      weight: "500",
    };
  if (v >= -0.2)
    return {
      bg: "oklch(var(--surface-2))",
      text: "oklch(var(--muted-foreground))",
      weight: "500",
    };
  return {
    bg: "oklch(var(--surface-1))",
    text: "oklch(var(--muted-foreground) / 0.85)",
    weight: "500",
  };
}

export function CorrelationMatrix() {
  return (
    <Card className="shadow-card" data-ocid="risk.correlation_matrix_panel">
      <CardHeader>
        <CardTitle className="text-base">Asset Correlation Matrix</CardTitle>
        <CardDescription>
          How assets move together. Darker cells indicate stronger positive
          correlation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              {PAIRS.map((p) => (
                <TableHead
                  key={p}
                  className="text-center label-apple uppercase tracking-wide"
                >
                  {p}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PAIRS.map((rowP, ri) => (
              <TableRow key={rowP}>
                <TableCell className="label-apple uppercase tracking-wide font-medium pr-2">
                  {rowP}
                </TableCell>
                {PAIRS.map((colP, ci) => {
                  const v = CORR[ri][ci];
                  const s = corrStyle(v);
                  return (
                    <TableCell
                      key={colP}
                      className="text-center p-1"
                      style={{ backgroundColor: s.bg }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: s.text, fontWeight: s.weight }}
                      >
                        {v === 1.0 ? "—" : (v >= 0 ? "+" : "") + v.toFixed(2)}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Legend */}
        <div className="flex items-center gap-5 pt-4 flex-wrap">
          {[
            { bg: "oklch(var(--foreground) / 0.22)", label: "Strong positive" },
            { bg: "oklch(var(--surface-3))", label: "Neutral" },
            { bg: "oklch(var(--surface-1))", label: "Negative" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm border border-border"
                style={{ backgroundColor: l.bg }}
              />
              <span className="label-apple">{l.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
