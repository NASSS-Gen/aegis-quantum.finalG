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
import { useConfluenceResult } from "../../hooks/useMarketData";

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

type MarketScope = "india" | "crypto" | "forex";

interface ConfluencePanelProps {
  assetId: string;
  timeframe: Timeframe;
  scope: MarketScope;
  mode: "beginner" | "advanced" | "power";
  onConfluenceChange?: (score: number) => void;
}

function biasTone(bias: string): "default" | "secondary" | "outline" {
  if (bias === "Bullish") return "default";
  if (bias === "Bearish") return "outline";
  return "secondary";
}

function RadialGauge({ score }: { score: number }) {
  const radius = 48;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <title>Confluence Score Gauge</title>
        <circle
          stroke="oklch(var(--surface-4))"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="oklch(var(--chart-1))"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.6s ease",
          }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="text-center">
        <div className="font-mono text-2xl font-semibold text-foreground">
          {score}
        </div>
        <div className="label-apple">Confluence</div>
      </div>
    </div>
  );
}

export default function ConfluencePanel({
  assetId,
  timeframe,
  scope,
  mode,
  onConfluenceChange,
}: ConfluencePanelProps) {
  const { data, isLoading } = useConfluenceResult(assetId, timeframe, scope);

  const confluenceScore = data ? Number(data.confluenceScore) : 0;
  const votes = data?.votes ?? [];
  const _finalBias = data?.finalBias ?? "Neutral";
  void _finalBias;

  // Notify parent of score change
  if (data && onConfluenceChange) {
    onConfluenceChange(confluenceScore);
  }

  const isBeginner = mode === "beginner";

  return (
    <Card data-ocid="confluence.panel" className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Multi-Timeframe Confluence
        </CardTitle>
        <Badge variant="outline" className="font-mono text-xs">
          {scope}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <RadialGauge score={confluenceScore} />
          )}
        </div>

        {isBeginner ? (
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Confluence means checking if different timeframes agree on the same
            direction. A high score means more agreement and a stronger signal.
          </p>
        ) : (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="label-apple">Timeframe</TableHead>
                    <TableHead className="label-apple">Bias</TableHead>
                    <TableHead className="label-apple text-right">
                      Strength
                    </TableHead>
                    <TableHead className="label-apple text-right">
                      Key Level
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votes.map((r, i) => (
                    <TableRow
                      key={r.timeframe}
                      data-ocid={`confluence.panel.item.${i + 1}`}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {r.timeframe}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={biasTone(r.bias)}
                          className="text-xs font-medium"
                        >
                          {r.bias}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {Number(r.strength)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {r.keyLevel.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
