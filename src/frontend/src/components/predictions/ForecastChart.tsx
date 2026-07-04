import { SignalType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ForecastChartProps {
  signal: SignalType;
  entryPrice: number;
  target1: number;
  target2: number;
  stopLoss: number;
  targetEta: string;
}

function buildChartData(
  entry: number,
  target: number,
  stop: number,
  signal: SignalType,
): { t: string; price: number }[] {
  const isBullish =
    signal === SignalType.BuyCall || signal === SignalType.BuyFutures;
  const isBearish = signal === SignalType.BuyPut;
  const points = 20;
  const data: { t: string; price: number }[] = [];

  for (let i = 0; i < points; i++) {
    const frac = i / (points - 1);
    let price: number;
    if (isBullish) {
      price = entry + (target - entry) * frac * frac;
    } else if (isBearish) {
      price = entry - (entry - stop) * frac;
    } else {
      price = entry + Math.sin(frac * Math.PI * 1.5) * (entry * 0.002);
    }
    const h = Math.floor(9 + frac * 7);
    const m = Math.floor((frac * 7 * 60) % 60);
    data.push({
      t: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      price: Number.parseFloat(price.toFixed(2)),
    });
  }
  return data;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-md border border-border bg-card px-2 py-1 text-xs font-mono text-foreground shadow-elevated">
        ₹{payload[0].value.toLocaleString("en-IN")}
      </div>
    );
  }
  return null;
};

export function ForecastChart({
  signal,
  entryPrice,
  target1,
  target2,
  stopLoss,
  targetEta,
}: ForecastChartProps) {
  const data = buildChartData(entryPrice, target1, stopLoss, signal);

  return (
    <Card data-ocid="predictions.forecast_chart" className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">
          Forecast Trajectory
        </CardTitle>
        <Badge variant="outline" className="font-mono text-xs">
          ETA: {targetEta}
        </Badge>
      </CardHeader>
      <CardContent>
        <div style={{ height: "220px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="oklch(var(--chart-grid))"
              />
              <XAxis
                dataKey="t"
                tick={{
                  fill: "oklch(var(--chart-axis))",
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{
                  fill: "oklch(var(--chart-axis))",
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => v.toLocaleString("en-IN")}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={target1}
                stroke="oklch(var(--chart-2))"
                strokeDasharray="4 3"
                label={{
                  value: `T1: ${target1}`,
                  fill: "oklch(var(--chart-2))",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={target2}
                stroke="oklch(var(--chart-3))"
                strokeDasharray="4 3"
                label={{
                  value: `T2: ${target2}`,
                  fill: "oklch(var(--chart-3))",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={stopLoss}
                stroke="oklch(var(--chart-2))"
                strokeDasharray="4 3"
                label={{
                  value: `SL: ${stopLoss}`,
                  fill: "oklch(var(--chart-2))",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="oklch(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
