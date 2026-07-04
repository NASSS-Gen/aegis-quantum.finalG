import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface VitalProps {
  label: string;
  value: string;
  pct: number;
}

function Vital({ label, value, pct }: VitalProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="label-apple uppercase">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

interface TelemetryRowProps {
  label: string;
  value: string;
}

function TelemetryRow({ label, value }: TelemetryRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="label-apple uppercase">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

interface SystemVitalsProps {
  extended?: boolean;
}

export function SystemVitals({ extended = false }: SystemVitalsProps) {
  const [cpu, setCpu] = useState(42.0);
  const [temp, setTemp] = useState(52.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu((v) => Math.min(99, Math.max(10, v + (Math.random() - 0.5) * 3)));
      setTemp((v) =>
        Math.min(80, Math.max(40, v + (Math.random() - 0.5) * 1.5)),
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const memPct = (14.2 / 32) * 100;
  const networkLoad = extended ? "88%" : "40%";

  const telemetry: TelemetryRowProps[] = extended
    ? [
        { label: "Network load", value: networkLoad },
        { label: "API uptime", value: "99.9%" },
        { label: "Success rate", value: "94.2%" },
        { label: "Drawdown", value: "1.04%" },
      ]
    : [
        { label: "Network load", value: networkLoad },
        { label: "API uptime", value: "99.06%" },
        { label: "Latency", value: "12ms" },
        { label: "Threads", value: "1,924" },
      ];

  return (
    <Card data-ocid="terminal.system_vitals" className="shadow-card gap-0 py-0">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-sm font-medium label-apple">
          System Vitals
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4 space-y-4">
        <Vital label="CPU" value={`${cpu.toFixed(1)}%`} pct={cpu} />
        <Vital label="Memory" value="14.2 GB / 32 GB" pct={memPct} />

        <div className="flex items-baseline justify-between">
          <span className="label-apple uppercase">Network I/O</span>
          <span className="text-sm font-semibold tabular-nums">
            ↑1.2 GB/s ↓0.8 GB/s
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="label-apple uppercase">Temp</span>
          <span className="text-sm font-semibold tabular-nums">
            {temp.toFixed(1)}°C
          </span>
        </div>

        <Separator />

        <div className="space-y-0">
          <div className="label-apple uppercase mb-2">Telemetry</div>
          {telemetry.map((row) => (
            <TelemetryRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
