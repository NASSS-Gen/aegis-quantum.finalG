import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExperienceMode } from "@/store/appStore";
import type { Timeframe } from "../../backend";
import { useCalibrationTable } from "../../hooks/useQuantEngine";

interface CalibrationTableProps {
  assetClass?: string | null;
  timeframe?: Timeframe | null;
  mode: ExperienceMode;
}

/**
 * Reliability grade → badge variant. Monochrome only — we encode grade by
 * weight (A = solid, B = secondary, C = outline, insufficient = muted).
 */
function gradeVariant(grade: string): "default" | "secondary" | "outline" {
  if (grade === "A") return "default";
  if (grade === "B") return "secondary";
  return "outline";
}

function gradeLabel(grade: string): string {
  if (grade === "A") return "A · Reliable";
  if (grade === "B") return "B · Usable";
  if (grade === "C") return "C · Weak";
  return "Insufficient";
}

function bucketRange(min: number, max: number): string {
  return `${Math.round(min * 100)}–${Math.round(max * 100)}%`;
}

/**
 * Calibration table — shows how stated confidence maps to realized win rate
 * across confidence buckets. Two display tiers:
 *  - beginner/intermediate: a single plain-language summary line
 *  - advanced/optional: the full bucket table with sample counts + grades
 */
export default function CalibrationTable({
  assetClass = null,
  timeframe = null,
  mode,
}: CalibrationTableProps) {
  const { data, isLoading } = useCalibrationTable(assetClass, timeframe);

  const showFull = mode === "advanced" || mode === "optional";

  if (isLoading) {
    return (
      <Card className="shadow-card" data-ocid="calibration.card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Signal Calibration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-card" data-ocid="calibration.card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Signal Calibration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Calibration data unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSamples = Number(data.totalSamples);
  const buckets = data.buckets ?? [];

  // Aggregate accuracy for the simplified view: weighted realized win rate.
  const weightedWin = buckets.reduce(
    (acc, b) => acc + b.realizedWinRate * Number(b.sampleCount),
    0,
  );
  const overallAccuracy = totalSamples > 0 ? weightedWin / totalSamples : 0;

  return (
    <Card className="shadow-card" data-ocid="calibration.card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Signal Calibration
        </CardTitle>
        <Badge variant="outline" className="font-mono text-[10px]">
          N={totalSamples}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!showFull ? (
          <div
            className="rounded-lg border border-border bg-muted/40 p-3"
            data-ocid="calibration.summary"
          >
            <p className="text-sm text-foreground">
              Signal accuracy:{" "}
              <span className="font-mono font-semibold">
                {(overallAccuracy * 100).toFixed(1)}%
              </span>{" "}
              based on{" "}
              <span className="font-mono font-semibold">{totalSamples}</span>{" "}
              past predictions.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {data.disclaimer}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="label-apple">Overall Realized Accuracy</div>
              <div className="mt-1 font-mono text-lg font-semibold text-foreground">
                {(overallAccuracy * 100).toFixed(1)}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.disclaimer}
              </p>
            </div>
            <div data-ocid="calibration.table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Samples</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead>Reliability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buckets.length === 0 ? (
                    <TableRow data-ocid="calibration.empty_state">
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No calibration samples yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    buckets.map((b, i) => (
                      <TableRow
                        key={`bucket-${b.minConfidence}-${b.maxConfidence}`}
                        data-ocid={`calibration.row.${i + 1}`}
                        className="trade-log-row"
                      >
                        <TableCell className="font-mono text-xs">
                          {bucketRange(b.minConfidence, b.maxConfidence)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {Number(b.sampleCount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {(b.realizedWinRate * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={gradeVariant(b.reliabilityGrade)}
                            className="font-mono text-[10px]"
                          >
                            {gradeLabel(b.reliabilityGrade)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
