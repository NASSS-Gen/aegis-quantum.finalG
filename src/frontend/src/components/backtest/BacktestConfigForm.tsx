import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type BacktestConfig,
  IndicatorSet,
  QuantModel,
  type QuantSettings,
  Timeframe,
} from "@/hooks/useBacktest";
import { Play, RotateCcw } from "lucide-react";
import { useState } from "react";

const ASSET_OPTIONS: { id: string; class: string; label: string }[] = [
  { id: "BTC", class: "crypto", label: "BTC/USDT" },
  { id: "ETH", class: "crypto", label: "ETH/USDT" },
  { id: "SOL", class: "crypto", label: "SOL/USDT" },
  { id: "RELIANCE", class: "india", label: "RELIANCE.NS" },
  { id: "TCS", class: "india", label: "TCS.NS" },
  { id: "EURUSD", class: "forex", label: "EUR/USD" },
  { id: "GBPJPY", class: "forex", label: "GBP/JPY" },
];

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: Timeframe.M15, label: "M15" },
  { value: Timeframe.H1, label: "H1" },
  { value: Timeframe.H4, label: "H4" },
  { value: Timeframe.D1, label: "D1" },
  { value: Timeframe.W1, label: "W1" },
];

const MODEL_OPTIONS: { value: QuantModel; label: string }[] = [
  { value: QuantModel.auto, label: "Auto" },
  { value: QuantModel.meanReversion, label: "Mean Reversion" },
  { value: QuantModel.momentum, label: "Momentum" },
  { value: QuantModel.pairs, label: "Pairs" },
];

const DATE_PRESETS: { value: string; label: string; days: number }[] = [
  { value: "1Y", label: "1Y", days: 365 },
  { value: "2Y", label: "2Y", days: 730 },
  { value: "3Y", label: "3Y", days: 1095 },
  { value: "5Y", label: "5Y", days: 1825 },
  { value: "custom", label: "Custom", days: 0 },
];

const STRATEGY_PARAM_DEFS: {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}[] = [
  {
    key: "rsiPeriod",
    label: "RSI Period",
    min: 2,
    max: 30,
    step: 1,
    default: 14,
  },
  {
    key: "rsiOverbought",
    label: "RSI Overbought",
    min: 60,
    max: 90,
    step: 1,
    default: 70,
  },
  {
    key: "rsiOversold",
    label: "RSI Oversold",
    min: 10,
    max: 40,
    step: 1,
    default: 30,
  },
  {
    key: "stopLossPct",
    label: "Stop Loss %",
    min: 0.5,
    max: 10,
    step: 0.1,
    default: 2,
  },
  {
    key: "takeProfitPct",
    label: "Take Profit %",
    min: 0.5,
    max: 20,
    step: 0.1,
    default: 4,
  },
];

function todayMinusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function toEpochSec(dateStr: string): bigint {
  return BigInt(Math.floor(Date.parse(dateStr) / 1000));
}

function buildStrategyParams(
  params: Record<string, number>,
  accountSize: number,
): QuantSettings {
  const stopLossPct = params.stopLossPct ?? 2;
  return {
    maxRiskPercent: stopLossPct,
    useRegimeFilter: true,
    useVWAP: true,
    indicatorSet: IndicatorSet.Full,
    accountSize,
    minConfidence: BigInt(70),
    confluenceWeights: {
      m15: BigInt(1),
      h1: BigInt(2),
      h4: BigInt(2),
      d1: BigInt(3),
      lowerTimeframe: BigInt(1),
      selectedTimeframe: BigInt(2),
      higherTimeframe: BigInt(3),
    },
    backtestLookback: BigInt(500),
  };
}

interface Props {
  onRun: (config: BacktestConfig) => void;
  isRunning: boolean;
}

export function BacktestConfigForm({ onRun, isRunning }: Props) {
  const [assetIdx, setAssetIdx] = useState(0);
  const [pairsAssetIdx, setPairsAssetIdx] = useState(1);
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.H1);
  const [model, setModel] = useState<QuantModel>(QuantModel.auto);
  const [datePreset, setDatePreset] = useState<string>("1Y");
  const [startDate, setStartDate] = useState(todayMinusDays(365));
  const [endDate, setEndDate] = useState(todayMinusDays(0));
  const [initialCapital, setInitialCapital] = useState(100000);
  const [runLabel, setRunLabel] = useState("AEGIS_QUANTUM");
  const [walkForward, setWalkForward] = useState(false);
  const [walkForwardSplit, setWalkForwardSplit] = useState(30);
  const [includeRegimeBreakdown, setIncludeRegimeBreakdown] = useState(false);
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(STRATEGY_PARAM_DEFS.map((p) => [p.key, p.default])),
  );

  const asset = ASSET_OPTIONS[assetIdx];
  const pairsAsset = ASSET_OPTIONS[pairsAssetIdx];

  const applyPreset = (preset: string) => {
    setDatePreset(preset);
    const found = DATE_PRESETS.find((p) => p.value === preset);
    if (found && found.days > 0) {
      setStartDate(todayMinusDays(found.days));
      setEndDate(todayMinusDays(0));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun({
      assetId: asset.id,
      assetClass: asset.class,
      timeframe,
      startDate: toEpochSec(startDate),
      endDate: toEpochSec(endDate),
      initialCapital,
      strategyParams: buildStrategyParams(params, initialCapital),
      runLabel,
      model,
      walkForwardSplit: walkForward ? walkForwardSplit / 100 : 0,
      includeRegimeBreakdown,
      pairsAssetId: model === QuantModel.pairs ? pairsAsset.id : undefined,
    });
  };

  const handleReset = () => {
    setAssetIdx(0);
    setPairsAssetIdx(1);
    setTimeframe(Timeframe.H1);
    setModel(QuantModel.auto);
    setDatePreset("1Y");
    setStartDate(todayMinusDays(365));
    setEndDate(todayMinusDays(0));
    setInitialCapital(100000);
    setRunLabel("AEGIS_QUANTUM");
    setWalkForward(false);
    setWalkForwardSplit(30);
    setIncludeRegimeBreakdown(false);
    setParams(
      Object.fromEntries(STRATEGY_PARAM_DEFS.map((p) => [p.key, p.default])),
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="config-panel flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card"
      data-ocid="backtest.config_form"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
          Backtest Configuration
        </h3>
        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Strategy: Aegis Quantum
        </span>
      </div>

      {/* Row 1: model selector (pill group) */}
      <div className="flex flex-col gap-2">
        <Label className="label-apple">Quant Model</Label>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Quant model"
          data-ocid="backtest.model_select"
        >
          {MODEL_OPTIONS.map((m) => {
            const active = model === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={active}
                onClick={() => setModel(m.value)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-smooth ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted text-muted-foreground hover:border-foreground/40"
                }`}
                data-ocid={`backtest.model_option.${m.value}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: asset / pairs asset / timeframe */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Field label="Asset">
          <Select
            value={String(assetIdx)}
            onValueChange={(v) => setAssetIdx(Number(v))}
          >
            <SelectTrigger className="w-full" data-ocid="backtest.asset_select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_OPTIONS.map((a, i) => (
                <SelectItem key={a.id} value={String(i)}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {model === QuantModel.pairs ? (
          <Field label="Pairs Asset">
            <Select
              value={String(pairsAssetIdx)}
              onValueChange={(v) => setPairsAssetIdx(Number(v))}
            >
              <SelectTrigger
                className="w-full"
                data-ocid="backtest.pairs_asset_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_OPTIONS.map((a, i) => (
                  <SelectItem key={a.id} value={String(i)}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <div className="md:col-span-1" />
        )}

        <Field label="Timeframe">
          <Select
            value={timeframe}
            onValueChange={(v) => setTimeframe(v as Timeframe)}
          >
            <SelectTrigger
              className="w-full"
              data-ocid="backtest.timeframe_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Initial Capital">
          <Input
            type="number"
            min={1000}
            step={1000}
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
            className="font-mono"
            data-ocid="backtest.capital_input"
          />
        </Field>
      </div>

      {/* Row 3: date range presets + custom dates */}
      <div className="flex flex-col gap-2">
        <Label className="label-apple">Date Range</Label>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Date range preset"
          data-ocid="backtest.date_preset_group"
        >
          {DATE_PRESETS.map((p) => {
            const active = datePreset === p.value;
            return (
              <button
                key={p.value}
                type="button"
                aria-pressed={active}
                onClick={() => applyPreset(p.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-smooth ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-muted text-muted-foreground hover:border-foreground/40"
                }`}
                data-ocid={`backtest.date_preset.${p.value}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Field label="Start Date">
            <Input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              data-ocid="backtest.start_date_input"
            />
          </Field>
          <Field label="End Date">
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              data-ocid="backtest.end_date_input"
            />
          </Field>
          <Field label="Run Label">
            <Input
              type="text"
              value={runLabel}
              maxLength={32}
              onChange={(e) => setRunLabel(e.target.value.toUpperCase())}
              data-ocid="backtest.run_label_input"
            />
          </Field>
          <div className="md:col-span-1" />
        </div>
      </div>

      {/* Row 4: walk-forward + regime breakdown toggles */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <input
            id="walk_forward_toggle"
            type="checkbox"
            checked={walkForward}
            onChange={(e) => setWalkForward(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-foreground"
            data-ocid="backtest.walk_forward_toggle"
          />
          <Label
            htmlFor="walk_forward_toggle"
            className="label-apple cursor-pointer"
          >
            Walk-Forward Split
          </Label>
          <Input
            type="number"
            min={5}
            max={95}
            step={5}
            value={walkForwardSplit}
            disabled={!walkForward}
            onChange={(e) => setWalkForwardSplit(Number(e.target.value))}
            className="ml-auto w-20 font-mono"
            data-ocid="backtest.walk_forward_split_input"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <input
            id="regime_breakdown_toggle"
            type="checkbox"
            checked={includeRegimeBreakdown}
            onChange={(e) => setIncludeRegimeBreakdown(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-foreground"
            data-ocid="backtest.regime_breakdown_toggle"
          />
          <Label
            htmlFor="regime_breakdown_toggle"
            className="label-apple cursor-pointer"
          >
            Regime Breakdown
          </Label>
        </div>

        <div className="md:col-span-1" />
      </div>

      {/* Row 5: strategy params */}
      <div>
        <div className="label-apple mb-2">Strategy Parameters</div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {STRATEGY_PARAM_DEFS.map((p) => (
            <Field key={p.key} label={p.label}>
              <Input
                type="number"
                min={p.min}
                max={p.max}
                step={p.step}
                value={params[p.key]}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    [p.key]: Number(e.target.value),
                  }))
                }
                className="font-mono"
                data-ocid={`backtest.param_${p.key}_input`}
              />
            </Field>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isRunning}
          data-ocid="backtest.execute_button"
        >
          <Play className="h-4 w-4" />
          {isRunning ? "Running…" : "Execute Backtest"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isRunning}
          data-ocid="backtest.reset_button"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {asset.label}
          {model === QuantModel.pairs ? ` / ${pairsAsset.label}` : ""} ·{" "}
          {timeframe} · {startDate} → {endDate}
        </span>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="label-apple">{label}</Label>
      {children}
    </div>
  );
}
