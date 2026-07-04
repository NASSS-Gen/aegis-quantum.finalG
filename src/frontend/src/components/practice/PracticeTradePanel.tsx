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
  type AddPracticeTradeInput,
  Direction,
  type PracticeTrade,
  useAddPracticeTrade,
} from "@/hooks/usePracticeTrades";
import {
  AlertTriangle,
  Crosshair,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Practice Arena — paper-trade entry panel.
 *
 * Apple-inspired monochrome: pure white card, near-black ink, hairline borders,
 * rounded corners, subtle shadows, system fonts. Calls useAddPracticeTrade and
 * notifies the parent page via onTradePlaced so the chart can sync.
 *
 * PRACTICE ONLY — NO REAL MONEY.
 */

type MarketScope = "india" | "crypto" | "forex";
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

const SCOPES: { value: MarketScope; label: string }[] = [
  { value: "india", label: "India" },
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
];

export interface PracticePrefill {
  assetId?: string;
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  direction?: Direction;
}

interface Props {
  prefill?: PracticePrefill | null;
  onTradePlaced?: (trade: PracticeTrade) => void;
}

interface FieldState {
  entry: string;
  target: string;
  stop: string;
}

interface FieldErrors {
  entry?: string;
  target?: string;
  stop?: string;
}

const EMPTY: FieldState = { entry: "", target: "", stop: "" };

function num(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : Number.NaN;
}

export function PracticeTradePanel({ prefill, onTradePlaced }: Props) {
  const [scope, setScope] = useState<MarketScope>("india");
  const [assetId, setAssetId] = useState<string>("NIFTY50");
  const [direction, setDirection] = useState<Direction>(Direction.Long);
  const [fields, setFields] = useState<FieldState>(EMPTY);
  const [touched, setTouched] = useState<Record<keyof FieldState, boolean>>({
    entry: false,
    target: false,
    stop: false,
  });

  const addTrade = useAddPracticeTrade();

  const filteredAssets = useMemo(
    () => ASSETS.filter((a) => a.scope.includes(scope)),
    [scope],
  );

  const asset = useMemo(
    () =>
      ASSETS.find((a) => a.id === assetId) ?? filteredAssets[0] ?? ASSETS[0],
    [assetId, filteredAssets],
  );

  useEffect(() => {
    if (!prefill) return;
    if (prefill.assetId) {
      const target = ASSETS.find((a) => a.id === prefill.assetId);
      if (target) {
        setAssetId(target.id);
        setScope(target.scope[0] ?? scope);
      }
    }
    if (prefill.direction) setDirection(prefill.direction);
    setFields({
      entry: prefill.entryPrice != null ? String(prefill.entryPrice) : "",
      target: prefill.targetPrice != null ? String(prefill.targetPrice) : "",
      stop: prefill.stopLoss != null ? String(prefill.stopLoss) : "",
    });
    setTouched({ entry: true, target: true, stop: true });
  }, [prefill, scope]);

  const handleScopeChange = (s: MarketScope) => {
    setScope(s);
    const first = ASSETS.find((a) => a.scope.includes(s));
    if (first) setAssetId(first.id);
  };

  const validate = useCallback(
    (state: FieldState, dir: Direction): FieldErrors => {
      const e: FieldErrors = {};
      const entry = num(state.entry);
      const target = num(state.target);
      const stop = num(state.stop);

      if (!state.entry || !Number.isFinite(entry) || entry <= 0)
        e.entry = "Enter a positive entry price";
      if (!state.target || !Number.isFinite(target) || target <= 0)
        e.target = "Enter a positive target price";
      if (!state.stop || !Number.isFinite(stop) || stop <= 0)
        e.stop = "Enter a positive stop-loss price";

      if (
        !e.entry &&
        !e.target &&
        Number.isFinite(entry) &&
        Number.isFinite(target)
      ) {
        if (dir === Direction.Long && target <= entry)
          e.target = "Target must be above entry for long";
        if (dir === Direction.Short && target >= entry)
          e.target = "Target must be below entry for short";
      }
      if (
        !e.entry &&
        !e.stop &&
        Number.isFinite(entry) &&
        Number.isFinite(stop)
      ) {
        if (dir === Direction.Long && stop >= entry)
          e.stop = "Stop must be below entry for long";
        if (dir === Direction.Short && stop <= entry)
          e.stop = "Stop must be above entry for short";
      }
      return e;
    },
    [],
  );

  const liveErrors = useMemo(
    () => validate(fields, direction),
    [fields, direction, validate],
  );

  const showError = (k: keyof FieldState) =>
    touched[k] ? liveErrors[k] : undefined;

  const isSubmitDisabled =
    addTrade.isPending ||
    Object.values(liveErrors).some(Boolean) ||
    !fields.entry ||
    !fields.target ||
    !fields.stop;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ entry: true, target: true, stop: true });
    const v = validate(fields, direction);
    if (Object.values(v).some(Boolean)) return;
    const input: AddPracticeTradeInput = {
      assetId: asset.id,
      assetClass: asset.assetClass,
      scope,
      direction,
      entryPrice: num(fields.entry),
      targetPrice: num(fields.target),
      stopLoss: num(fields.stop),
    };
    addTrade.mutate(input, {
      onSuccess: (trade) => {
        onTradePlaced?.(trade);
        setFields(EMPTY);
        setTouched({ entry: false, target: false, stop: false });
      },
    });
  };

  const handleBlur = (k: keyof FieldState) =>
    setTouched((prev) => ({ ...prev, [k]: true }));

  const setField = (k: keyof FieldState, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }));

  const longActive = direction === Direction.Long;

  return (
    <form
      onSubmit={handleSubmit}
      className="config-panel flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-card"
      data-ocid="practice.trade_panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
          Paper Trade
        </h3>
        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Practice Mode
        </span>
      </div>

      {/* Scope + Asset */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="label-apple">Market Scope</Label>
          <div className="flex gap-1.5">
            {SCOPES.map((s) => (
              <button
                key={s.value}
                type="button"
                data-ocid={`practice.scope_${s.value}_button`}
                onClick={() => handleScopeChange(s.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-smooth ${
                  scope === s.value
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="label-apple" htmlFor="practice-asset-select">
            Symbol
          </Label>
          <Select value={assetId} onValueChange={setAssetId}>
            <SelectTrigger
              id="practice-asset-select"
              className="w-full"
              data-ocid="practice.asset_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredAssets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label} · {a.assetClass}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Direction toggle */}
      <div className="flex flex-col gap-2">
        <Label className="label-apple">Direction</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-ocid="practice.direction_long_button"
            onClick={() => setDirection(Direction.Long)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-smooth ${
              longActive
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Long
          </button>
          <button
            type="button"
            data-ocid="practice.direction_short_button"
            onClick={() => setDirection(Direction.Short)}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-smooth ${
              !longActive
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            Short
          </button>
        </div>
      </div>

      {/* Price inputs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <PriceField
          label="Entry Price"
          value={fields.entry}
          onChange={(v) => setField("entry", v)}
          onBlur={() => handleBlur("entry")}
          error={showError("entry")}
          marker="practice.entry_input"
          placeholder={asset ? asset.basePrice.toFixed(2) : "0.00"}
        />
        <PriceField
          label="Target Price"
          value={fields.target}
          onChange={(v) => setField("target", v)}
          onBlur={() => handleBlur("target")}
          error={showError("target")}
          marker="practice.target_input"
          placeholder={
            asset
              ? (asset.basePrice * (longActive ? 1.01 : 0.99)).toFixed(2)
              : "0.00"
          }
        />
        <PriceField
          label="Stop Loss"
          value={fields.stop}
          onChange={(v) => setField("stop", v)}
          onBlur={() => handleBlur("stop")}
          error={showError("stop")}
          marker="practice.stop_input"
          placeholder={
            asset
              ? (asset.basePrice * (longActive ? 0.99 : 1.01)).toFixed(2)
              : "0.00"
          }
        />
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground"
        data-ocid="practice.disclaimer"
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Practice only — no real money. This is a simulated paper trade for
          educational use.
        </span>
      </div>

      {/* Submit + status */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          data-ocid="practice.place_trade_button"
          className="gap-2"
        >
          <Crosshair className="h-4 w-4" />
          {addTrade.isPending ? "Placing…" : "Place Paper Trade"}
        </Button>

        <span className="text-xs text-muted-foreground">
          {asset.label} · {scope} ·{" "}
          {direction === Direction.Long ? "Long" : "Short"}
        </span>

        {addTrade.isError && (
          <span
            className="text-xs font-medium text-foreground"
            data-ocid="practice.error_state"
          >
            Error: {addTrade.error?.message ?? "Trade rejected"}
          </span>
        )}
        {addTrade.isSuccess && (
          <span
            className="text-xs font-medium text-foreground"
            data-ocid="practice.success_state"
          >
            Trade placed
          </span>
        )}
      </div>
    </form>
  );
}

interface PriceFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  marker: string;
  placeholder?: string;
}

function PriceField({
  label,
  value,
  onChange,
  onBlur,
  error,
  marker,
  placeholder,
}: PriceFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="label-apple" htmlFor={marker}>
        {label}
      </Label>
      <Input
        id={marker}
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        data-ocid={marker}
        aria-invalid={!!error}
        className="font-mono"
      />
      {error && (
        <span
          className="text-xs text-foreground"
          data-ocid={`${marker}.field_error`}
        >
          {error}
        </span>
      )}
    </div>
  );
}

export default PracticeTradePanel;
