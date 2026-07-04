import { SignalType } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Scenario {
  label: string;
  change: string;
  prob: number;
  tone: "default" | "secondary" | "outline";
}

// Returns [BULL prob, BASE prob, BEAR prob] based on the active signal
function getScenarioProbabilities(
  signal: SignalType,
): [number, number, number] {
  switch (signal) {
    case SignalType.BuyCall:
      return [55, 30, 15];
    case SignalType.BuyPut:
      return [15, 30, 55];
    case SignalType.BuyFutures:
      return [45, 35, 20];
    case SignalType.Hold:
      return [25, 50, 25];
    case SignalType.Sell:
      return [10, 25, 65];
  }
}

interface ScenarioAnalysisProps {
  signal: SignalType;
}

export function ScenarioAnalysis({ signal }: ScenarioAnalysisProps) {
  const [bullProb, baseProb, bearProb] = getScenarioProbabilities(signal);

  const SCENARIOS: Scenario[] = [
    { label: "Bull", change: "+2.3%", prob: bullProb, tone: "default" },
    { label: "Base", change: "+0.8%", prob: baseProb, tone: "secondary" },
    { label: "Bear", change: "-1.9%", prob: bearProb, tone: "outline" },
  ];

  return (
    <Card data-ocid="predictions.scenario_analysis" className="shadow-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Scenario Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {SCENARIOS.map((s) => (
            <div key={s.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={s.tone}
                    className="px-2 py-0.5 text-xs font-semibold"
                  >
                    {s.label}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.change}
                  </span>
                </div>
                <span className="font-mono text-xs font-medium text-foreground">
                  {s.prob}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-smooth"
                  style={{ width: `${s.prob}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
