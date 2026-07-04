import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// 30 days of deterministic drawdown data
const DATA = Array.from({ length: 30 }, (_, i) => {
  const seed = ((i * 7 + 13) % 17) / 17;
  const val = -(0.5 + seed * 2.7);
  return {
    day: i + 1,
    drawdown: Number(val.toFixed(2)),
  };
});

const MAX_DD = Math.min(...DATA.map((d) => d.drawdown)); // most negative
const AVG_DD = (DATA.reduce((a, d) => a + d.drawdown, 0) / DATA.length).toFixed(
  2,
);

interface TooltipPayload {
  payload: { day: number; drawdown: number };
}

function CustomTooltip({
  active,
  payload,
}: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-lg border border-border bg-popover shadow-elevated text-xs">
      <div className="label-apple">Day {d.day}</div>
      <div className="font-semibold mt-0.5">DD: {d.drawdown}%</div>
    </div>
  );
}

export function DrawdownChart() {
  return (
    <Card className="shadow-card" data-ocid="risk.drawdown_chart_panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Historical Drawdown</CardTitle>
            <CardDescription>30-day peak-to-trough decline.</CardDescription>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="label-apple">Max DD</span>
              <span className="text-sm font-semibold">
                {MAX_DD.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="label-apple">Avg DD</span>
              <span className="text-sm font-semibold">{AVG_DD}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: "180px", willChange: "transform" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={DATA}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              barCategoryGap="10%"
            >
              <XAxis
                dataKey="day"
                tick={{
                  fill: "oklch(var(--chart-axis))",
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={{ stroke: "oklch(var(--chart-grid))" }}
                interval={4}
                tickFormatter={(v: number) => `D${v}`}
              />
              <YAxis
                tick={{
                  fill: "oklch(var(--chart-axis))",
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={{ stroke: "oklch(var(--chart-grid))" }}
                domain={[-4, 0]}
                tickFormatter={(v: number) => `${v}%`}
                width={36}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "oklch(var(--surface-3) / 0.5)" }}
              />
              <Bar dataKey="drawdown" radius={[3, 3, 0, 0]} maxBarSize={16}>
                {DATA.map((entry) => (
                  <Cell
                    key={`dd-day-${entry.day}`}
                    fill={
                      entry.drawdown < -2
                        ? "oklch(var(--foreground))"
                        : "oklch(var(--foreground) / 0.45)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
