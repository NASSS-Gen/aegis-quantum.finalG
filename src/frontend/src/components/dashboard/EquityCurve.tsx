import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TimeRange = "1D" | "1W" | "1M";

function generateBase(range: TimeRange) {
  const pts = range === "1D" ? 24 : range === "1W" ? 28 : 30;
  const base = 420000;
  const data: { t: string; v: number }[] = [];
  let v = base;
  for (let i = 0; i < pts; i++) {
    v += (Math.random() - 0.42) * 3200;
    const label =
      range === "1D"
        ? `${String(i).padStart(2, "0")}:00`
        : range === "1W"
          ? `D${i + 1}`
          : `${i + 1}/04`;
    data.push({ t: label, v: Math.max(380000, v) });
  }
  return data;
}

export function EquityCurve() {
  const [range, setRange] = useState<TimeRange>("1D");
  const [data, setData] = useState(() => generateBase("1D"));
  const baseRef = useRef(generateBase("1D"));

  const handleRange = (r: TimeRange) => {
    const d = generateBase(r);
    baseRef.current = d;
    setData([...d]);
    setRange(r);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const newV = last.v + (Math.random() - 0.42) * 2800;
        const now = new Date();
        const label = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        return [...prev.slice(-35), { t: label, v: Math.max(380000, newV) }];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const last = data[data.length - 1]?.v ?? 0;
  const first = data[0]?.v ?? 0;
  const pct = (((last - first) / first) * 100).toFixed(2);
  const gain = last - first;

  return (
    <Card className="shadow-card" data-ocid="equity_curve.panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-semibold tracking-tight">
                ${last.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span
                className={
                  gain >= 0
                    ? "text-sm font-medium text-foreground"
                    : "text-sm font-normal text-muted-foreground"
                }
              >
                {gain >= 0 ? "+" : ""}
                {pct}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(["1D", "1W", "1M"] as TimeRange[]).map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => handleRange(r)}
                data-ocid={`equity_curve.range_${r.toLowerCase()}_button`}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height: "220px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="oklch(0.21 0 0)"
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor="oklch(0.21 0 0)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                tick={{ fill: "oklch(0.55 0 0)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "oklch(0.55 0 0)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.99 0 0)",
                  border: "1px solid oklch(0.9 0 0)",
                  borderRadius: "12px",
                  fontSize: 12,
                  color: "oklch(0.21 0 0)",
                }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
                labelStyle={{ color: "oklch(0.55 0 0)" }}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="oklch(0.21 0 0)"
                strokeWidth={1.5}
                fill="url(#equityFill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
