import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExperienceMode } from "@/store/appStore";
import { Settings, X } from "lucide-react";
import React, { useState, useEffect } from "react";

export interface QuantSettings {
  indicatorSet: "minimal" | "full";
  confluenceWeights: {
    lowerTimeframe: number;
    selectedTimeframe: number;
    higherTimeframe: number;
  };
  maxRiskPercent: number;
  accountSize: number;
  backtestLookback: number;
}

export const defaultQuantSettings: QuantSettings = {
  indicatorSet: "full",
  confluenceWeights: {
    lowerTimeframe: 25,
    selectedTimeframe: 50,
    higherTimeframe: 25,
  },
  maxRiskPercent: 1,
  accountSize: 100000,
  backtestLookback: 100,
};

interface QuantSettingsPanelProps {
  settings: QuantSettings;
  onSettingsChange: (settings: QuantSettings) => void;
  mode: ExperienceMode;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuantSettingsPanel({
  settings,
  onSettingsChange,
  mode,
  isOpen,
  onClose,
}: QuantSettingsPanelProps) {
  const [local, setLocal] = useState<QuantSettings>(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  if (mode === "beginner" || mode === "intermediate") return null;

  const weightSum =
    local.confluenceWeights.lowerTimeframe +
    local.confluenceWeights.selectedTimeframe +
    local.confluenceWeights.higherTimeframe;

  const validWeights = weightSum === 100;

  const updateWeight = (
    key: keyof QuantSettings["confluenceWeights"],
    value: number,
  ) => {
    setLocal((prev) => ({
      ...prev,
      confluenceWeights: {
        ...prev.confluenceWeights,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!validWeights) return;
    onSettingsChange(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(defaultQuantSettings);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      data-ocid="quant.settings.dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-elevated">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Quant Settings
            </h2>
          </div>
          <button
            type="button"
            data-ocid="quant.settings.close_button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-smooth hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "advanced" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">
                Read-only summary
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Indicator Set:</span>
                <span className="font-mono font-medium text-foreground">
                  {settings.indicatorSet.toUpperCase()}
                </span>
                <span>Max Risk:</span>
                <span className="font-mono font-medium text-foreground">
                  {settings.maxRiskPercent}%
                </span>
                <span>Account Size:</span>
                <span className="font-mono font-medium text-foreground">
                  ₹{settings.accountSize.toLocaleString()}
                </span>
                <span>Lookback:</span>
                <span className="font-mono font-medium text-foreground">
                  {settings.backtestLookback} candles
                </span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Switch to Optional mode to edit these settings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Indicator Set Toggle */}
            <div className="space-y-2">
              <Label htmlFor="indicator-set">Indicator Set</Label>
              <div id="indicator-set" className="flex gap-2">
                {(["minimal", "full"] as const).map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    data-ocid={`quant.settings.indicator_${opt}`}
                    onClick={() =>
                      setLocal((prev) => ({ ...prev, indicatorSet: opt }))
                    }
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      local.indicatorSet === opt
                        ? "border-foreground bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {opt === "minimal" ? "Minimal" : "Full"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {local.indicatorSet === "minimal"
                  ? "RSI + MACD only (faster)"
                  : "RSI, MACD, Bollinger, ATR, Stochastic, CCI (full suite)"}
              </p>
            </div>

            {/* Confluence Weights */}
            <div className="space-y-3">
              <Label htmlFor="confluence-weights">Confluence Weights</Label>
              <div id="confluence-weights" className="space-y-3">
                {(
                  [
                    { key: "lowerTimeframe" as const, label: "Lower TF" },
                    { key: "selectedTimeframe" as const, label: "Selected TF" },
                    { key: "higherTimeframe" as const, label: "Higher TF" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-sm text-muted-foreground">
                      <span>{label}</span>
                      <span className="font-mono font-medium text-foreground">
                        {local.confluenceWeights[key]}%
                      </span>
                    </div>
                    <input
                      data-ocid={`quant.settings.weight_${key}`}
                      type="range"
                      min={0}
                      max={100}
                      value={local.confluenceWeights[key]}
                      onChange={(e) =>
                        updateWeight(key, Number(e.target.value))
                      }
                      disabled={mode !== "optional"}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
              <div
                className={`text-right text-xs font-medium ${
                  validWeights ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Total: {weightSum}% {validWeights ? "✓" : "✗ Must equal 100%"}
              </div>
            </div>

            {/* Risk & Account */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-risk">Max Risk %</Label>
                <Input
                  id="max-risk"
                  data-ocid="quant.settings.max_risk_input"
                  type="number"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={local.maxRiskPercent}
                  onChange={(e) =>
                    setLocal((prev) => ({
                      ...prev,
                      maxRiskPercent: Math.min(
                        5,
                        Math.max(0.1, Number(e.target.value)),
                      ),
                    }))
                  }
                  disabled={mode !== "optional"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-size">Account Size (₹)</Label>
                <Input
                  id="account-size"
                  data-ocid="quant.settings.account_size_input"
                  type="number"
                  min={10000}
                  step={10000}
                  value={local.accountSize}
                  onChange={(e) =>
                    setLocal((prev) => ({
                      ...prev,
                      accountSize: Math.max(10000, Number(e.target.value)),
                    }))
                  }
                  disabled={mode !== "optional"}
                />
              </div>
            </div>

            {/* Backtest Lookback */}
            <div className="space-y-2">
              <Label htmlFor="backtest-lookback">Backtest Lookback</Label>
              <div id="backtest-lookback" className="flex gap-2">
                {[50, 100, 200].map((val) => (
                  <button
                    type="button"
                    key={val}
                    data-ocid={`quant.settings.lookback_${val}`}
                    onClick={() =>
                      setLocal((prev) => ({ ...prev, backtestLookback: val }))
                    }
                    disabled={mode !== "optional"}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                      local.backtestLookback === val
                        ? "border-foreground bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {val} candles
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                data-ocid="quant.settings.save_button"
                onClick={handleSave}
                disabled={!validWeights}
                className="flex-1"
              >
                Save settings
              </Button>
              <Button
                type="button"
                data-ocid="quant.settings.reset_button"
                onClick={handleReset}
                variant="outline"
              >
                Reset
              </Button>
              <Button
                type="button"
                data-ocid="quant.settings.cancel_button"
                onClick={onClose}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
