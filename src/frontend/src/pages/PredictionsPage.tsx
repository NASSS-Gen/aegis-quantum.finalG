import {
  type Timeframe as BackendTimeframe,
  QuantModel,
  SignalGrade,
  SignalType,
} from "@/backend";
import CalibrationTable from "@/components/predictions/CalibrationTable";
import { ExecutionParams } from "@/components/predictions/ExecutionParams";
import { FibonacciLevels } from "@/components/predictions/FibonacciLevels";
import { ForecastChart } from "@/components/predictions/ForecastChart";
import { PredictionTestLog } from "@/components/predictions/PredictionTestLog";
import RegimeHistoryStrip from "@/components/predictions/RegimeHistoryStrip";
import { ScenarioAnalysis } from "@/components/predictions/ScenarioAnalysis";
import { SignalBox } from "@/components/predictions/SignalBox";
import { TechOscillators } from "@/components/predictions/TechOscillators";
import VolumeProfilePanel from "@/components/predictions/VolumeProfilePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ExperienceMode, useAppStore } from "@/store/appStore";
import { Settings } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import ConfluencePanel from "../components/predictions/ConfluencePanel";
import PredictionHistory from "../components/predictions/PredictionHistory";
import QuantSettingsPanel, {
  defaultQuantSettings,
} from "../components/predictions/QuantSettingsPanel";
import RiskOverlay from "../components/predictions/RiskOverlay";
import SignalReportCard from "../components/predictions/SignalReportCard";

/**
 * Map the store's ExperienceMode to the legacy mode string the child
 * components still accept ("beginner" | "advanced" | "power").
 * - beginner     -> beginner  (plain-language summary)
 * - intermediate -> beginner   (moderate view; child components render the
 *   beginner-friendly layout, which is the most reduced form available)
 * - advanced     -> advanced   (full institutional report)
 * - optional     -> power      (everything, including experimental fields)
 */
function mapMode(mode: ExperienceMode): "beginner" | "advanced" | "power" {
  if (mode === "advanced") return "advanced";
  if (mode === "optional") return "power";
  return "beginner";
}
import { useSignalReportCard } from "../hooks/useMarketData";
import { usePredictionHistory } from "../hooks/usePredictionHistory";

type MarketScope = "india" | "crypto" | "forex";
type Timeframe = "5M" | "15M" | "30M" | "1H" | "4H" | "DAILY";
type Expiry = "WEEKLY" | "MONTHLY" | "CUSTOM";
type AssetClass = "INDEX" | "CRYPTO" | "FOREX" | "COMMODITY";

interface AssetConfig {
  id: string;
  label: string;
  basePrice: number;
  scope: MarketScope[];
  assetClass: AssetClass;
}

const ASSETS: AssetConfig[] = [
  {
    id: "NIFTY50",
    label: "NIFTY 50",
    basePrice: 24542.5,
    scope: ["india"],
    assetClass: "INDEX",
  },
  {
    id: "BANKNIFTY",
    label: "BANKNIFTY",
    basePrice: 52318.75,
    scope: ["india"],
    assetClass: "INDEX",
  },
  {
    id: "BTCUSDT",
    label: "BTC/USDT",
    basePrice: 72450.31,
    scope: ["crypto"],
    assetClass: "CRYPTO",
  },
  {
    id: "ETHUSDT",
    label: "ETH/USDT",
    basePrice: 3892.15,
    scope: ["crypto"],
    assetClass: "CRYPTO",
  },
  {
    id: "GOLD",
    label: "GOLD",
    basePrice: 71850.0,
    scope: ["india", "forex"],
    assetClass: "COMMODITY",
  },
  {
    id: "CRUDEOIL",
    label: "CRUDE OIL",
    basePrice: 6821.5,
    scope: ["india", "forex"],
    assetClass: "COMMODITY",
  },
  {
    id: "USDINR",
    label: "USD/INR",
    basePrice: 83.48,
    scope: ["forex"],
    assetClass: "FOREX",
  },
  {
    id: "EURUSD",
    label: "EUR/USD",
    basePrice: 1.0847,
    scope: ["forex"],
    assetClass: "FOREX",
  },
  {
    id: "GBPUSD",
    label: "GBP/USD",
    basePrice: 1.2732,
    scope: ["forex"],
    assetClass: "FOREX",
  },
  {
    id: "USDJPY",
    label: "USD/JPY",
    basePrice: 151.42,
    scope: ["forex"],
    assetClass: "FOREX",
  },
];

const TIMEFRAMES: Timeframe[] = ["5M", "15M", "30M", "1H", "4H", "DAILY"];

/**
 * Quant model selector options. Each entry pairs the backend variant with a
 * short label and a plain-language explanation used as the native `title`
 * tooltip on the pill button (no Tooltip component — keeps the bundle lean
 * and matches the existing mode-selector pattern in TopNav.tsx).
 */
const QUANT_MODELS: {
  value: QuantModel;
  label: string;
  hint: string;
}[] = [
  {
    value: QuantModel.auto,
    label: "Auto",
    hint: "Let the engine pick the best model for the current regime.",
  },
  {
    value: QuantModel.meanReversion,
    label: "Mean Reversion",
    hint: "Bet on price returning to its recent average — best in ranging markets.",
  },
  {
    value: QuantModel.momentum,
    label: "Momentum",
    hint: "Follow the prevailing trend — best in trending markets.",
  },
  {
    value: QuantModel.pairs,
    label: "Pairs",
    hint: "Trade the spread between two correlated assets.",
  },
];

function getTargetEta(timeframe: Timeframe): string {
  const ms = {
    "5M": 5 * 60 * 1000,
    "15M": 15 * 60 * 1000,
    "30M": 30 * 60 * 1000,
    "1H": 60 * 60 * 1000,
    "4H": 4 * 60 * 60 * 1000,
    DAILY: 24 * 60 * 60 * 1000,
  }[timeframe];
  const eta = new Date(Date.now() + (ms ?? 15 * 60 * 1000) * 1.5);
  return `${String(eta.getHours()).padStart(2, "0")}:${String(eta.getMinutes()).padStart(2, "0")}`;
}

function deriveSignalFromReportCard(
  reportCard: { grade: SignalGrade; expectedValue: number } | undefined,
): SignalType {
  if (!reportCard) return SignalType.Hold;
  const { grade, expectedValue } = reportCard;
  if (grade === SignalGrade.A && expectedValue > 1.5)
    return SignalType.BuyFutures;
  if (
    (grade === SignalGrade.A || grade === SignalGrade.B) &&
    expectedValue >= 0
  )
    return SignalType.BuyCall;
  if ((grade === SignalGrade.A || grade === SignalGrade.B) && expectedValue < 0)
    return SignalType.BuyPut;
  if (grade === SignalGrade.C) return SignalType.Hold;
  return SignalType.Sell;
}

const mapTimeframe = (
  tf: string,
): "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1" => {
  const map: Record<string, string> = {
    "5M": "M5",
    "15M": "M15",
    "30M": "M30",
    "1H": "H1",
    "4H": "H4",
    DAILY: "D1",
  };
  return (map[tf] || tf) as
    | "M1"
    | "M5"
    | "M15"
    | "M30"
    | "H1"
    | "H4"
    | "D1"
    | "W1";
};

function getNextExpiry(type: Expiry): string {
  const now = new Date();
  const day = now.getDay();
  if (type === "WEEKLY") {
    const daysUntilThursday = (4 - day + 7) % 7 || 7;
    const d = new Date(now);
    d.setDate(now.getDate() + daysUntilThursday);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  if (type === "MONTHLY") {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const d = new Date(lastDay);
    while (d.getDay() !== 4) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return "CUSTOM";
}

export default function PredictionsPage() {
  const experienceMode = useAppStore((s) => s.mode);
  const mode = mapMode(experienceMode);
  const [scope, setScope] = useState<MarketScope>("india");
  const [assetId, setAssetId] = useState<string>("NIFTY50");
  const [timeframe, setTimeframe] = useState<Timeframe>("15M");
  const [expiry, setExpiry] = useState<Expiry>("WEEKLY");
  const [customExpiry, setCustomExpiry] = useState<string>("");
  const [quantSettings, setQuantSettings] = useState(defaultQuantSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confluenceScore, setConfluenceScore] = useState(0);
  const [selectedModel, setSelectedModel] = useState<QuantModel>(
    QuantModel.auto,
  );
  const { addPrediction, history, refresh } = usePredictionHistory();

  const asset = ASSETS.find((a) => a.id === assetId) ?? ASSETS[0];
  const filteredAssets = ASSETS.filter((a) => a.scope.includes(scope));

  const { data: reportCard } = useSignalReportCard(
    assetId,
    timeframe,
    scope,
    selectedModel,
  );

  const signal = useMemo(
    () => deriveSignalFromReportCard(reportCard ?? undefined),
    [reportCard],
  );
  const confidence = useMemo(
    () => Number(reportCard?.compositeConfidence ?? 0),
    [reportCard],
  );
  const targetEta = useMemo(() => getTargetEta(timeframe), [timeframe]);

  const livePrice =
    typeof reportCard?.keyLevels?.[0]?.price === "number" &&
    reportCard.keyLevels[0].price > 0
      ? reportCard.keyLevels[0].price
      : asset.basePrice;

  const entryPrice = livePrice;
  const target1 = Number.parseFloat((entryPrice * 1.008).toFixed(2));
  const target2 = Number.parseFloat((entryPrice * 1.016).toFixed(2));
  const stopLoss = Number.parseFloat((entryPrice * 0.992).toFixed(2));

  const handleLog = useCallback(() => {
    void addPrediction({
      assetId: asset.id,
      assetClass: asset.assetClass,
      timeframe,
      signal,
      entryPrice,
      targetPrice: target1,
      stopLoss,
      confidence,
      grade: reportCard?.grade,
    });
  }, [
    addPrediction,
    asset,
    timeframe,
    signal,
    entryPrice,
    target1,
    stopLoss,
    confidence,
    reportCard,
  ]);

  return (
    <div className="flex flex-col gap-6" data-ocid="predictions.page">
      {/* Control bar */}
      <Card className="shadow-card" data-ocid="predictions.control_bar">
        <CardContent className="flex flex-wrap items-end gap-4 p-5">
          {/* Scope */}
          <div className="flex flex-col gap-1.5">
            <span className="label-apple">Market</span>
            <div className="flex gap-1 rounded-lg border border-border bg-muted/60 p-1">
              {(["india", "crypto", "forex"] as MarketScope[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  data-ocid={`predictions.scope_${s}_button`}
                  onClick={() => {
                    setScope(s);
                    const first = ASSETS.find((a) => a.scope.includes(s));
                    if (first) setAssetId(first.id);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    scope === s
                      ? "bg-card text-foreground shadow-subtle"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Asset */}
          <div className="flex flex-col gap-1.5">
            <span className="label-apple">Asset</span>
            <Select value={assetId} onValueChange={(v) => setAssetId(v)}>
              <SelectTrigger
                data-ocid="predictions.asset_select"
                className="w-[180px] bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredAssets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe */}
          <div className="flex flex-col gap-1.5">
            <span className="label-apple">Timeframe</span>
            <div className="flex gap-1 rounded-lg border border-border bg-muted/60 p-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  data-ocid={`predictions.tf_${tf.toLowerCase()}_toggle`}
                  onClick={() => setTimeframe(tf)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    timeframe === tf
                      ? "bg-card text-foreground shadow-subtle"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div className="flex flex-col gap-1.5">
            <span className="label-apple">Expiry</span>
            <div className="flex gap-1 rounded-lg border border-border bg-muted/60 p-1">
              {(["WEEKLY", "MONTHLY", "CUSTOM"] as Expiry[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  data-ocid={`predictions.expiry_${e.toLowerCase()}_button`}
                  onClick={() => setExpiry(e)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    expiry === e
                      ? "bg-card text-foreground shadow-subtle"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {e === "WEEKLY"
                    ? `WK ${getNextExpiry("WEEKLY")}`
                    : e === "MONTHLY"
                      ? `MO ${getNextExpiry("MONTHLY")}`
                      : "CUSTOM"}
                </button>
              ))}
            </div>
          </div>

          {expiry === "CUSTOM" && (
            <div className="flex flex-col gap-1.5">
              <span className="label-apple">Custom date</span>
              <input
                type="date"
                data-ocid="predictions.custom_expiry_input"
                value={customExpiry}
                onChange={(e) => setCustomExpiry(e.target.value)}
                className="config-input h-9 rounded-lg px-3 text-sm"
              />
            </div>
          )}

          {/* Quant model selector — pill group mirroring the TopNav mode
              selector style (rounded-full, bg-muted/60 track, bg-primary
              active pill). Native `title` attribute explains each option. */}
          <div className="flex flex-col gap-1.5">
            <span className="label-apple">Model</span>
            <fieldset
              aria-label="Quant model"
              className="flex items-center rounded-full border border-border bg-muted/60 p-0.5"
              data-ocid="predictions.model_selector"
            >
              {QUANT_MODELS.map((m) => {
                const active = selectedModel === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    title={m.hint}
                    aria-pressed={active}
                    aria-label={`${m.label} — ${m.hint}`}
                    data-ocid={`predictions.model_${m.label.toLowerCase().replace(/\s+/g, "_")}_toggle`}
                    onClick={() => setSelectedModel(m.value)}
                    className={[
                      "h-7 rounded-full px-2.5 text-[11px] font-medium tracking-tight",
                      "transition-smooth focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                      active
                        ? "bg-primary text-primary-foreground shadow-subtle"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                );
              })}
            </fieldset>
          </div>

          {/* Confidence readout */}
          <div className="flex flex-col gap-1.5">
            <span className="label-apple">Confidence</span>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 shadow-subtle">
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {confidence}%
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {reportCard?.grade ?? "—"}
              </Badge>
            </div>
          </div>

          <div className="ml-auto flex items-end gap-2">
            {(experienceMode === "advanced" ||
              experienceMode === "optional") && (
              <Button
                variant="outline"
                size="icon"
                data-ocid="predictions.settings_button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Quant settings"
                className="bg-card shadow-subtle"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              data-ocid="predictions.generate_button"
              onClick={handleLog}
              className="shadow-subtle"
            >
              Generate forecast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left: analysis column */}
        <div className="flex flex-col gap-6">
          <SignalBox
            signal={signal}
            asset={assetId}
            entryPrice={entryPrice}
            onLog={handleLog}
          />

          <ForecastChart
            signal={signal}
            entryPrice={entryPrice}
            target1={target1}
            target2={target2}
            stopLoss={stopLoss}
            targetEta={targetEta}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <TechOscillators
                assetId={assetId}
                timeframe={timeframe}
                scope={scope}
                indicatorSet={quantSettings.indicatorSet}
                mode={experienceMode}
              />
              <ConfluencePanel
                assetId={assetId}
                timeframe={mapTimeframe(timeframe)}
                scope={scope}
                mode={mode}
                onConfluenceChange={setConfluenceScore}
              />
              {/* Regime history + volume profile — advanced/optional only.
                  Gated by the store's ExperienceMode so beginners and
                  intermediate users keep the lean view. Both components
                  read directly from useQuantEngine hooks. */}
              {(experienceMode === "advanced" ||
                experienceMode === "optional") && (
                <div
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2"
                  data-ocid="predictions.advanced_quant_section"
                >
                  <RegimeHistoryStrip
                    assetId={assetId}
                    scope={scope}
                    lookback={20}
                  />
                  <VolumeProfilePanel assetId={assetId} scope={scope} />
                </div>
              )}
              <RiskOverlay
                assetId={assetId}
                timeframe={mapTimeframe(timeframe)}
                scope={scope}
                mode={mode}
                accountSize={quantSettings.accountSize}
                maxRiskPercent={quantSettings.maxRiskPercent}
              />
            </div>
            <div className="flex flex-col gap-6">
              <SignalReportCard
                assetId={assetId}
                timeframe={mapTimeframe(timeframe)}
                scope={scope}
                mode={experienceMode}
                confluenceScore={confluenceScore}
                backtestLookback={quantSettings.backtestLookback}
                model={selectedModel}
              />
              {/* Calibration table — all modes; the component itself
                  adapts its display tier to the current ExperienceMode
                  (summary line for beginner/intermediate, full bucket
                  table for advanced/optional). */}
              <CalibrationTable
                assetClass={asset.assetClass}
                timeframe={mapTimeframe(timeframe) as BackendTimeframe}
                mode={experienceMode}
              />
              <ExecutionParams
                entryPrice={entryPrice}
                target1={target1}
                target2={target2}
                stopLoss={stopLoss}
              />
              <FibonacciLevels
                entryPrice={entryPrice}
                target2={target2}
                stopLoss={stopLoss}
              />
              <ScenarioAnalysis signal={signal} />
            </div>
          </div>

          <PredictionHistory mode={mode} />
        </div>

        {/* Right: signal log */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <PredictionTestLog entries={history} onClear={refresh} />
        </div>
      </div>

      <QuantSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={quantSettings}
        onSettingsChange={setQuantSettings}
        mode={experienceMode}
      />
    </div>
  );
}
