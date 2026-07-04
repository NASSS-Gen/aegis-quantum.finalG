import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ModuleStatus = "RUN" | "STDBY" | "ERR";

type Module = {
  name: string;
  version: string;
  status: ModuleStatus;
};

const MODULES: Module[] = [
  { name: "HFT Core", version: "v4.0.2", status: "RUN" },
  { name: "Strategy Optimizer", version: "v2.1.0", status: "RUN" },
  { name: "ML Sentiment", version: "v1.4.1", status: "STDBY" },
  { name: "Arbitrage Scanner", version: "v3.0.0", status: "STDBY" },
];

const STATUS_VARIANT: Record<
  ModuleStatus,
  "default" | "secondary" | "outline"
> = {
  RUN: "default",
  STDBY: "outline",
  ERR: "secondary",
};

const STATUS_LABEL: Record<ModuleStatus, string> = {
  RUN: "Running",
  STDBY: "Standby",
  ERR: "Error",
};

export function ActiveModules() {
  const running = MODULES.filter((m) => m.status === "RUN").length;

  return (
    <Card className="shadow-card" data-ocid="active_modules.panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
          <span className="text-xs text-muted-foreground">
            {running}/{MODULES.length} running
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col">
          {MODULES.map((m, i) => (
            <div
              key={m.name}
              className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              data-ocid={`active_modules.item.${i + 1}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-foreground"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium truncate">{m.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {m.version}
                </span>
              </div>
              <Badge variant={STATUS_VARIANT[m.status]} className="text-[10px]">
                {STATUS_LABEL[m.status]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
