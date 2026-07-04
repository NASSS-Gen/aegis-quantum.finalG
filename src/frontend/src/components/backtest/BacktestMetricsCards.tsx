import type { BacktestMetricsExtended } from "@/hooks/useBacktest";

interface Props {
  metrics: BacktestMetricsExtended;
}

type NumericMetricKey =
  | "totalReturn"
  | "winRate"
  | "sharpeRatio"
  | "sortinoRatio"
  | "maxDrawdown"
  | "profitFactor"
  | "averageWin"
  | "averageLoss";

interface MetricDef {
  key: NumericMetricKey;
  label: string;
  format: (v: number | bigint) => string;
  tone: (v: number | bigint) => "positive" | "negative" | "neutral";
}

/**
 * Required numeric fields only — optional fields (calibrationTable,
 * regimeBreakdown, outOfSampleWinRate, inSampleWinRate) are rendered
 * separately with null guards so METRIC_DEFS never indexes an undefined
 * value.
 */
const METRIC_DEFS: MetricDef[] = [
  {
    key: "totalReturn",
    label: "Total Return",
    format: (v) => `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`,
    tone: (v) => (Number(v) >= 0 ? "positive" : "negative"),
  },
  {
    key: "winRate",
    label: "Win Rate",
    format: (v) => `${Number(v).toFixed(1)}%`,
    tone: (v) => (Number(v) >= 50 ? "positive" : "negative"),
  },
  {
    key: "sharpeRatio",
    label: "Sharpe",
    format: (v) => Number(v).toFixed(2),
    tone: (v) =>
      Number(v) >= 1 ? "positive" : Number(v) >= 0 ? "neutral" : "negative",
  },
  {
    key: "sortinoRatio",
    label: "Sortino",
    format: (v) => Number(v).toFixed(2),
    tone: (v) =>
      Number(v) >= 1 ? "positive" : Number(v) >= 0 ? "neutral" : "negative",
  },
  {
    key: "maxDrawdown",
    label: "Max Drawdown",
    format: (v) => `${Number(v).toFixed(2)}%`,
    tone: () => "negative",
  },
  {
    key: "profitFactor",
    label: "Profit Factor",
    format: (v) => Number(v).toFixed(2),
    tone: (v) =>
      Number(v) >= 1.5 ? "positive" : Number(v) >= 1 ? "neutral" : "negative",
  },
  {
    key: "averageWin",
    label: "Avg Win",
    format: (v) => `+${Number(v).toFixed(2)}%`,
    tone: () => "positive",
  },
  {
    key: "averageLoss",
    label: "Avg Loss",
    format: (v) => `${Number(v).toFixed(2)}%`,
    tone: () => "negative",
  },
];

function toneClass(tone: "positive" | "negative" | "neutral"): string {
  if (tone === "positive") return "metric-value-positive";
  if (tone === "negative") return "metric-value-negative";
  return "metric-value-neutral";
}

function toneLabel(tone: "positive" | "negative" | "neutral"): string {
  if (tone === "positive") return "▲ Bullish";
  if (tone === "negative") return "▼ Bearish";
  return "● Neutral";
}

export function BacktestMetricsCards({ metrics }: Props) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
      data-ocid="backtest.metrics_cards"
    >
      {METRIC_DEFS.map((def, idx) => {
        const raw = metrics[def.key];
        // Required numeric fields are always present; guard anyway for safety.
        if (raw === undefined || raw === null) return null;
        const tone = def.tone(raw);
        return (
          <div
            key={def.key}
            className="metric-card flex flex-col gap-1 rounded-xl p-3"
            data-ocid={`backtest.metric_card.${idx + 1}`}
          >
            <span className="label-apple">{def.label}</span>
            <span
              className={`font-mono text-xl font-semibold tracking-tight ${toneClass(tone)}`}
            >
              {def.format(raw)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {toneLabel(tone)}
            </span>
          </div>
        );
      })}

      {/* Trades count (bigint) */}
      <div
        className="metric-card flex flex-col gap-1 rounded-xl p-3"
        data-ocid="backtest.metric_card.9"
      >
        <span className="label-apple">Trades</span>
        <span className="font-mono text-xl font-semibold tracking-tight metric-value-neutral">
          {metrics.numberOfTrades.toString()}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          ● Executed
        </span>
      </div>

      {/* Walk-forward in-sample / out-of-sample win rate (optional) */}
      {metrics.inSampleWinRate !== undefined && (
        <div
          className="metric-card flex flex-col gap-1 rounded-xl p-3"
          data-ocid="backtest.metric_card.insample"
        >
          <span className="label-apple">In-Sample Win</span>
          <span className="font-mono text-xl font-semibold tracking-tight metric-value-neutral">
            {Number(metrics.inSampleWinRate).toFixed(1)}%
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            ● Walk-Forward
          </span>
        </div>
      )}
      {metrics.outOfSampleWinRate !== undefined && (
        <div
          className="metric-card flex flex-col gap-1 rounded-xl p-3"
          data-ocid="backtest.metric_card.outsample"
        >
          <span className="label-apple">Out-of-Sample Win</span>
          <span className="font-mono text-xl font-semibold tracking-tight metric-value-neutral">
            {Number(metrics.outOfSampleWinRate).toFixed(1)}%
          </span>
          <span className="text-[10px] font-medium text-muted-foreground">
            ● Walk-Forward
          </span>
        </div>
      )}
    </div>
  );
}
