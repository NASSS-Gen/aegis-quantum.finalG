import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

type Strategy = "ULTRA_SAFE" | "BALANCED" | "AGGRESSIVE";

const EXPLAINER_CARDS = [
  {
    id: "drawdown",
    label: "Drawdown",
    desc: "How much your account dropped from peak. Current: −2.4%. Safe zone: under −10%.",
    value: "−2.4%",
    status: "Safe",
  },
  {
    id: "margin",
    label: "Margin",
    desc: "Borrowed funds to trade. Used: $14,200 (22%). Keep under 50% to stay safe.",
    value: "22%",
    status: "Normal",
  },
  {
    id: "leverage",
    label: "Leverage limit",
    desc: "Amplification of gains and losses. You are using 3.5x. Recommended max: 5x.",
    value: "3.5x",
    status: "OK",
  },
  {
    id: "liquidation",
    label: "Liquidation risk",
    desc: "If losses exceed margin, position is auto-closed. Yours: low risk.",
    value: "Low",
    status: "Safe",
  },
] as const;

const ASSET_RISK = [
  { pair: "BTC/USDT", level: "Low" },
  { pair: "ETH/USDT", level: "Critical" },
  { pair: "SOL/USDT", level: "Medium" },
] as const;

const STRATEGIES: {
  id: Strategy;
  label: string;
  desc: string;
}[] = [
  {
    id: "ULTRA_SAFE",
    label: "Ultra Safe",
    desc: "Max protection. Slower growth. Best for beginners.",
  },
  {
    id: "BALANCED",
    label: "Balanced",
    desc: "Moderate risk. Steady returns. Most popular.",
  },
  {
    id: "AGGRESSIVE",
    label: "Aggressive",
    desc: "Higher risk. Higher reward. For experienced traders.",
  },
];

export function RiskGuardian() {
  const [step, setStep] = useState(1);
  const [strategy, setStrategy] = useState<Strategy>("BALANCED");
  const [maxPos, setMaxPos] = useState(10);
  const [maxLoss, setMaxLoss] = useState(5);
  const [autoDelever, setAutoDelever] = useState(true);
  const [triggerPct, setTriggerPct] = useState(15);
  const [stopLoss, setStopLoss] = useState(10);

  return (
    <div className="flex flex-col gap-6" data-ocid="risk_guardian_panel">
      {/* Header */}
      <Card className="shadow-card" data-ocid="risk_guardian.header">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold tracking-tight">
              Risk Guardian
            </span>
            <Badge variant="outline">v1.0</Badge>
            <Badge variant="secondary" data-ocid="risk_guardian.optimal_badge">
              Optimal ops
            </Badge>
          </div>
          {/* Safety Score */}
          <div
            className="flex items-center gap-4"
            data-ocid="risk_guardian.safety_score"
          >
            <div className="flex flex-col items-end gap-0.5">
              <span className="label-apple uppercase tracking-wide">
                Safety score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold font-display">84</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 w-32">
              <Progress value={84} />
              <span className="label-apple text-right">Good standing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explainer cards 2x2 */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        data-ocid="risk_guardian.explainer_cards"
      >
        {EXPLAINER_CARDS.map((card, idx) => (
          <Card
            key={card.id}
            className="shadow-card"
            data-ocid={`risk_guardian.explainer.${idx + 1}`}
          >
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between">
                <span className="label-apple uppercase tracking-wide">
                  {card.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{card.value}</span>
                  <Badge variant="outline">{card.status}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup Wizard */}
      <Card className="shadow-card" data-ocid="risk_guardian.setup_wizard">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Risk Setup Wizard</CardTitle>
              <CardDescription>
                Configure your defensive posture in three steps.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-smooth"
                    style={{
                      backgroundColor:
                        step >= s
                          ? "oklch(var(--foreground))"
                          : "oklch(var(--surface-3))",
                      color:
                        step >= s
                          ? "oklch(var(--primary-foreground))"
                          : "oklch(var(--muted-foreground))",
                    }}
                    data-ocid={`risk_guardian.wizard_step.${s}`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className="w-6 h-px"
                      style={{
                        backgroundColor:
                          step > s
                            ? "oklch(var(--foreground))"
                            : "oklch(var(--surface-4))",
                      }}
                    />
                  )}
                </div>
              ))}
              <span className="label-apple ml-2">Step {step}/3</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {step === 1 && (
            <WizardStep1 strategy={strategy} setStrategy={setStrategy} />
          )}
          {step === 2 && (
            <WizardStep2
              maxPos={maxPos}
              setMaxPos={setMaxPos}
              maxLoss={maxLoss}
              setMaxLoss={setMaxLoss}
            />
          )}
          {step === 3 && (
            <WizardStep3
              autoDelever={autoDelever}
              setAutoDelever={setAutoDelever}
              triggerPct={triggerPct}
              setTriggerPct={setTriggerPct}
            />
          )}

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              data-ocid="risk_guardian.wizard_prev"
            >
              Previous
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                data-ocid="risk_guardian.wizard_next"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep(1)}
                data-ocid="risk_guardian.wizard_finish"
              >
                Confirm &amp; save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Stop Loss */}
      <Card className="shadow-card" data-ocid="risk_guardian.emergency_stop">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Emergency Stop-Loss Trigger
              </CardTitle>
              <CardDescription>
                Auto-sell the entire portfolio if total loss exceeds this level.
              </CardDescription>
            </div>
            <Badge variant="destructive">{stopLoss}%</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between label-apple uppercase tracking-wide">
            <span>1%</span>
            <span>Trigger level</span>
            <span>25%</span>
          </div>
          <Slider
            min={1}
            max={25}
            value={[stopLoss]}
            onValueChange={(v) => setStopLoss(v[0])}
            data-ocid="risk_guardian.stop_loss_slider"
          />
          <p className="text-sm text-muted-foreground">
            Your portfolio auto-sells if total loss exceeds{" "}
            <span className="font-semibold text-foreground">{stopLoss}%</span>.
            Disable temporarily if the market dips and you want to hold.
          </p>
          <Button
            type="button"
            className="w-full"
            data-ocid="risk_guardian.confirm_stop_loss_button"
          >
            Confirm &amp; continue
          </Button>
        </CardContent>
      </Card>

      {/* Asset Risk Map */}
      <Card className="shadow-card" data-ocid="risk_guardian.asset_risk_map">
        <CardHeader>
          <CardTitle className="text-base">Asset Risk Map</CardTitle>
          <CardDescription>
            Current risk classification per held asset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            {ASSET_RISK.map((a) => (
              <div key={a.pair} className="flex items-center gap-2">
                <span className="text-sm font-medium">{a.pair}</span>
                <Badge
                  variant={a.level === "Critical" ? "destructive" : "outline"}
                >
                  {a.level}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WizardStep1({
  strategy,
  setStrategy,
}: {
  strategy: Strategy;
  setStrategy: (s: Strategy) => void;
}) {
  return (
    <div className="flex flex-col gap-3" data-ocid="risk_guardian.wizard_step1">
      <Label className="label-apple">
        Step 1 — Defensive strategy: choose your approach
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STRATEGIES.map((s) => {
          const active = strategy === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStrategy(s.id)}
              className="p-4 flex flex-col gap-1.5 text-left rounded-xl border transition-smooth"
              style={{
                backgroundColor: active
                  ? "oklch(var(--foreground))"
                  : "oklch(var(--background))",
                borderColor: active
                  ? "oklch(var(--foreground))"
                  : "oklch(var(--border))",
                color: active
                  ? "oklch(var(--primary-foreground))"
                  : "oklch(var(--foreground))",
              }}
              data-ocid={`risk_guardian.strategy.${s.id.toLowerCase()}`}
            >
              <span className="text-sm font-semibold">{s.label}</span>
              <span
                className="text-xs leading-relaxed"
                style={{
                  color: active
                    ? "oklch(var(--primary-foreground) / 0.7)"
                    : "oklch(var(--muted-foreground))",
                }}
              >
                {s.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WizardStep2({
  maxPos,
  setMaxPos,
  maxLoss,
  setMaxLoss,
}: {
  maxPos: number;
  setMaxPos: (v: number) => void;
  maxLoss: number;
  setMaxLoss: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5" data-ocid="risk_guardian.wizard_step2">
      <Label className="label-apple">Step 2 — Exposure limits</Label>
      {[
        {
          label: "Max position size",
          value: maxPos,
          set: setMaxPos,
          max: 50,
          unit: "%",
          ocid: "risk_guardian.max_position_size_slider",
        },
        {
          label: "Max daily loss",
          value: maxLoss,
          set: setMaxLoss,
          max: 20,
          unit: "%",
          ocid: "risk_guardian.max_daily_loss_slider",
        },
      ].map((item) => (
        <div key={item.label} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="label-apple">{item.label}</span>
            <span className="text-sm font-semibold">
              {item.value}
              {item.unit}
            </span>
          </div>
          <Slider
            min={1}
            max={item.max}
            value={[item.value]}
            onValueChange={(v) => item.set(v[0])}
            data-ocid={item.ocid}
          />
        </div>
      ))}
    </div>
  );
}

function WizardStep3({
  autoDelever,
  setAutoDelever,
  triggerPct,
  setTriggerPct,
}: {
  autoDelever: boolean;
  setAutoDelever: (v: boolean) => void;
  triggerPct: number;
  setTriggerPct: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5" data-ocid="risk_guardian.wizard_step3">
      <Label className="label-apple">Step 3 — Auto shedding</Label>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Auto-delever</span>
          <span className="label-apple">
            Automatically reduce leverage when risk threshold is hit
          </span>
        </div>
        <Switch
          checked={autoDelever}
          onCheckedChange={setAutoDelever}
          data-ocid="risk_guardian.auto_delever_toggle"
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="label-apple">Trigger threshold</span>
          <span className="text-sm font-semibold">{triggerPct}%</span>
        </div>
        <Slider
          min={5}
          max={50}
          value={[triggerPct]}
          onValueChange={(v) => setTriggerPct(v[0])}
          disabled={!autoDelever}
          data-ocid="risk_guardian.trigger_pct_slider"
        />
      </div>
    </div>
  );
}
