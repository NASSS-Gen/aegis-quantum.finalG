import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";

interface DataPoint {
  t: number;
  v: number;
}

function generateReadings(): DataPoint[] {
  return Array.from({ length: 20 }, (_, i) => ({
    t: i,
    v: Math.floor(Math.random() * 8) + 8,
  }));
}

export function LatencyGraph() {
  const [data, setData] = useState<DataPoint[]>(generateReadings);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const next = prev.slice(1);
        next.push({
          t: prev[prev.length - 1].t + 1,
          v: Math.floor(Math.random() * 8) + 8,
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card data-ocid="terminal.latency_graph" className="shadow-card gap-0 py-0">
      <CardHeader className="px-4 py-3 border-b flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium label-apple">
          Latency
        </CardTitle>
        <span className="label-apple">20 readings · ms</span>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap={2}>
              <YAxis domain={[0, 24]} hide />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.99 0 0)",
                  border: "1px solid oklch(0.9 0 0)",
                  borderRadius: "0.5rem",
                  fontSize: "11px",
                  color: "oklch(0.21 0 0)",
                }}
                formatter={(val: number) => [`${val}ms`, "Latency"]}
                cursor={{ fill: "oklch(0.96 0 0)" }}
              />
              <Bar dataKey="v" maxBarSize={14}>
                {data.map((entry) => (
                  <Cell key={`cell-${entry.t}`} fill="oklch(0.21 0 0)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
