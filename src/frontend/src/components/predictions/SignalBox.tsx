import { SignalType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SignalBoxProps {
  signal: SignalType;
  asset: string;
  entryPrice: number;
  onLog: () => void;
}

const SIGNAL_CONFIG: Record<
  SignalType,
  {
    label: string;
    tone: "default" | "secondary" | "outline";
    explanation: string;
  }
> = {
  [SignalType.BuyCall]: {
    label: "Buy Call",
    tone: "default",
    explanation:
      "Strong bullish momentum detected. Call options are positioned for upside capture.",
  },
  [SignalType.BuyPut]: {
    label: "Buy Put",
    tone: "default",
    explanation:
      "Bearish pressure confirmed. Put options offer favorable risk-reward for a downside move.",
  },
  [SignalType.BuyFutures]: {
    label: "Buy Futures",
    tone: "default",
    explanation:
      "Trend continuation signal. Futures provide direct leveraged exposure to momentum.",
  },
  [SignalType.Hold]: {
    label: "Hold",
    tone: "secondary",
    explanation:
      "Market structure is consolidating. Wait for candle-close confirmation before entering.",
  },
  [SignalType.Sell]: {
    label: "Sell",
    tone: "secondary",
    explanation:
      "Bearish reversal confirmed. Exit long positions and consider short exposure.",
  },
};

export function SignalBox({
  signal,
  asset,
  entryPrice,
  onLog,
}: SignalBoxProps) {
  const cfg = SIGNAL_CONFIG[signal];

  return (
    <Card data-ocid="predictions.signal_box" className="shadow-card">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="label-apple">Active Signal</span>
            <Badge variant="outline" className="font-mono">
              {asset}
            </Badge>
          </div>
          <span className="label-apple">
            Entry{" "}
            <span className="font-mono font-semibold text-foreground">
              {entryPrice.toFixed(2)}
            </span>
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 py-2">
          <Badge
            variant={cfg.tone}
            className="px-4 py-1.5 text-base font-semibold tracking-tight"
          >
            {cfg.label}
          </Badge>
          <p className="max-w-md text-center text-sm text-muted-foreground leading-relaxed">
            {cfg.explanation}
          </p>
        </div>

        <button
          type="button"
          data-ocid="predictions.analysis_log_button"
          onClick={onLog}
          className="self-center rounded-lg border border-border bg-secondary px-5 py-2 text-sm font-medium text-secondary-foreground transition-smooth hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Log to history
        </button>
      </CardContent>
    </Card>
  );
}
