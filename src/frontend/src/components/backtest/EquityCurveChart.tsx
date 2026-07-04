import type { EquityPoint } from "@/hooks/useBacktest";
import { useMemo } from "react";

interface Props {
  data: EquityPoint[];
  initialCapital: number;
}

const CHART_W = 1000;
const CHART_H = 320;
const PAD_L = 56;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;

export function EquityCurveChart({ data, initialCapital }: Props) {
  const { pathD, areaD, ddPathD, points, yTicks, xTicks, minEq, maxEq } =
    useMemo(() => {
      if (data.length === 0) {
        return {
          pathD: "",
          areaD: "",
          ddPathD: "",
          points: [] as { x: number; y: number; eq: number; dd: number }[],
          yTicks: [] as { y: number; label: string }[],
          xTicks: [] as { x: number; label: string }[],
          minEq: 0,
          maxEq: 1,
        };
      }

      const eqs = data.map((d) => d.equity);
      const minE = Math.min(...eqs, initialCapital);
      const maxE = Math.max(...eqs, initialCapital);
      const range = maxE - minE || 1;
      const pad = range * 0.08;
      const lo = minE - pad;
      const hi = maxE + pad;
      const span = hi - lo;

      const innerW = CHART_W - PAD_L - PAD_R;
      const innerH = CHART_H - PAD_T - PAD_B;

      const xFor = (i: number) =>
        PAD_L +
        (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const yFor = (eq: number) => PAD_T + innerH - ((eq - lo) / span) * innerH;

      const pts = data.map((d, i) => ({
        x: xFor(i),
        y: yFor(d.equity),
        eq: d.equity,
        dd: d.drawdown,
      }));

      const path = pts
        .map(
          (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
        )
        .join(" ");
      const area = `M${pts[0].x.toFixed(1)},${(PAD_T + innerH).toFixed(1)} ${pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} L${pts[pts.length - 1].x.toFixed(1)},${(PAD_T + innerH).toFixed(1)} Z`;

      const ddMin = Math.min(...data.map((d) => d.drawdown), 0);
      const ddSpan = Math.abs(ddMin) || 1;
      const ddYFor = (dd: number) =>
        PAD_T + innerH * 0.55 + (Math.abs(dd) / ddSpan) * innerH * 0.4;
      const ddPath = pts
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${ddYFor(data[i].drawdown).toFixed(1)}`,
        )
        .join(" ");

      const yT = Array.from({ length: 5 }, (_, i) => {
        const v = lo + (span * i) / 4;
        return { y: yFor(v), label: formatCompact(v) };
      });

      const xT = Array.from({ length: 6 }, (_, i) => {
        const idx = Math.round((i / 5) * (data.length - 1));
        const d = data[idx];
        return { x: xFor(idx), label: d ? formatTs(d.timestamp) : "" };
      });

      return {
        pathD: path,
        areaD: area,
        ddPathD: ddPath,
        points: pts,
        yTicks: yT,
        xTicks: xT,
        minEq: lo,
        maxEq: hi,
      };
    }, [data, initialCapital]);

  if (data.length === 0) {
    return (
      <div
        className="equity-curve-grid flex items-center justify-center rounded-2xl border border-border bg-card shadow-card"
        style={{ height: CHART_H }}
        data-ocid="backtest.equity_curve_empty"
      >
        <span className="text-sm text-muted-foreground">
          Awaiting equity data
        </span>
      </div>
    );
  }

  const baselineY =
    PAD_T +
    (CHART_H - PAD_T - PAD_B) -
    ((initialCapital - minEq) / (maxEq - minEq || 1)) *
      (CHART_H - PAD_T - PAD_B);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      data-ocid="backtest.equity_curve_chart"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-semibold tracking-tight text-foreground">
          Equity Curve
        </span>
        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            Equity
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            Drawdown
          </span>
        </span>
      </div>

      <div className="equity-curve-grid relative">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="block w-full"
          style={{ height: CHART_H }}
          preserveAspectRatio="none"
          role="img"
          aria-label="Equity curve chart showing portfolio value over time with drawdown overlay"
        >
          {/* Y grid lines */}
          {yTicks.map((t) => (
            <line
              key={`yg-${t.label}-${t.y.toFixed(1)}`}
              x1={PAD_L}
              x2={CHART_W - PAD_R}
              y1={t.y}
              y2={t.y}
              stroke="oklch(var(--chart-grid))"
              strokeWidth={1}
            />
          ))}

          {/* Initial capital baseline */}
          <line
            x1={PAD_L}
            x2={CHART_W - PAD_R}
            y1={baselineY}
            y2={baselineY}
            stroke="oklch(var(--chart-baseline))"
            strokeWidth={1}
            strokeDasharray="4 4"
          />

          {/* Equity area fill */}
          <path d={areaD} fill="url(#equityGradient)" opacity={0.6} />
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="oklch(var(--chart-area))"
                stopOpacity={0.35}
              />
              <stop
                offset="60%"
                stopColor="oklch(var(--chart-area))"
                stopOpacity={0.08}
              />
              <stop
                offset="100%"
                stopColor="oklch(var(--chart-area))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          {/* Drawdown zone fill */}
          <path
            d={`${ddPathD} L${points[points.length - 1].x.toFixed(1)},${(PAD_T + (CHART_H - PAD_T - PAD_B)).toFixed(1)} L${points[0].x.toFixed(1)},${(PAD_T + (CHART_H - PAD_T - PAD_B)).toFixed(1)} Z`}
            fill="oklch(var(--chart-drawdown) / 0.12)"
          />

          {/* Equity line */}
          <path
            d={pathD}
            fill="none"
            stroke="oklch(var(--chart-1))"
            strokeWidth={1.5}
          />

          {/* Drawdown line */}
          <path
            d={ddPathD}
            fill="none"
            stroke="oklch(var(--chart-drawdown))"
            strokeWidth={1}
            strokeOpacity={0.7}
          />

          {/* Y axis labels */}
          {yTicks.map((t) => (
            <text
              key={`yl-${t.label}-${t.y.toFixed(1)}`}
              x={PAD_L - 6}
              y={t.y + 3}
              textAnchor="end"
              className="chart-axis-text"
              fill="oklch(var(--chart-axis))"
            >
              {t.label}
            </text>
          ))}

          {/* X axis labels */}
          {xTicks.map((t) => (
            <text
              key={`xl-${t.label}-${t.x.toFixed(1)}`}
              x={t.x}
              y={CHART_H - 8}
              textAnchor="middle"
              className="chart-axis-text"
              fill="oklch(var(--chart-axis))"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function formatCompact(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

function formatTs(ts: bigint): string {
  const d = new Date(Number(ts) * 1000);
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${m}/${day}`;
}
