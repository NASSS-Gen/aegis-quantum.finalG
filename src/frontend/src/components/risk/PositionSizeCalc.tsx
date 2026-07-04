import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface CalcResult {
  lots: string;
  rrRatio: string;
  maxDd: string;
}

export function PositionSizeCalc() {
  const [capital, setCapital] = useState("125000");
  const [riskPct, setRiskPct] = useState("1.50");
  const [slDist, setSlDist] = useState("0.75");
  const [result, setResult] = useState<CalcResult>({
    lots: "25.00",
    rrRatio: "1:3.2",
    maxDd: "$3,750",
  });

  function calculate() {
    const cap = Number.parseFloat(capital.replace(/,/g, ""));
    const rp = Number.parseFloat(riskPct) / 100;
    const sl = Number.parseFloat(slDist);
    if (!cap || !rp || !sl) return;
    const riskAmount = cap * rp;
    const lots = (riskAmount / sl).toFixed(2);
    const maxDd = riskAmount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
    setResult({ lots, rrRatio: "1:3.2", maxDd });
  }

  return (
    <Card className="shadow-card" data-ocid="risk.position_size_calc_panel">
      <CardHeader>
        <CardTitle className="text-base">Position Size Calculator</CardTitle>
        <CardDescription>
          Size each trade from your capital, risk tolerance, and stop distance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Inputs */}
          <div className="flex flex-col gap-5">
            <CalcField
              id="risk.calc_capital_input"
              label="Available capital"
              prefix="$"
              value={capital}
              onChange={setCapital}
            />
            <CalcField
              id="risk.calc_risk_pct_input"
              label="Risk percentage"
              suffix="%"
              value={riskPct}
              onChange={setRiskPct}
            />
            <CalcField
              id="risk.calc_sl_dist_input"
              label="Stop-loss distance"
              suffix="pts"
              value={slDist}
              onChange={setSlDist}
            />
            <Button
              type="button"
              onClick={calculate}
              className="w-full"
              data-ocid="risk.calc_calculate_button"
            >
              Calculate
            </Button>
          </div>

          {/* Results */}
          <div className="flex flex-col gap-4 justify-center">
            {result && (
              <>
                <div
                  className="flex flex-col items-center justify-center py-6 rounded-xl bg-muted/40 border border-border"
                  data-ocid="risk.calc_suggested_size"
                >
                  <span className="label-apple uppercase tracking-wide">
                    Suggested size
                  </span>
                  <span className="text-hero mt-1 font-display">
                    {result.lots}
                  </span>
                  <span className="label-apple uppercase tracking-wide mt-0.5">
                    Lots
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <ResultRow
                    label="Risk / reward ratio"
                    value={result.rrRatio}
                  />
                  <ResultRow
                    label="Max drawdown guard"
                    value={result.maxDd}
                    tag="Hard limit"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CalcField({
  id,
  label,
  prefix,
  suffix,
  value,
  onChange,
}: {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="label-apple">
        {label}
      </Label>
      <div className="flex items-center rounded-md border border-input bg-background overflow-hidden transition-smooth focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring">
        {prefix && (
          <span className="px-3 text-sm text-muted-foreground">{prefix}</span>
        )}
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 bg-transparent"
          data-ocid={id}
        />
        {suffix && (
          <span className="px-3 text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  tag,
}: {
  label: string;
  value: string;
  tag?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-background">
      <span className="label-apple">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{value}</span>
        {tag && (
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-border text-muted-foreground">
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}
