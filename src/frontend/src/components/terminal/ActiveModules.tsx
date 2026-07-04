import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ModuleStatus = "live" | "active" | "standby" | "retraining" | "idle";

interface Module {
  name: string;
  version: string;
  status: ModuleStatus;
  label: string;
}

const STATUS_VARIANT: Record<
  ModuleStatus,
  "default" | "secondary" | "outline"
> = {
  live: "default",
  active: "default",
  standby: "secondary",
  retraining: "secondary",
  idle: "outline",
};

const BASE_MODULES: Module[] = [
  { name: "HFT Core", version: "v4.0.2", status: "live", label: "Live" },
  {
    name: "Strategy Optimizer",
    version: "v2.1.0",
    status: "live",
    label: "Live",
  },
  {
    name: "ML Sentiment",
    version: "v1.3.7",
    status: "retraining",
    label: "Retraining 88%",
  },
  {
    name: "Arb Scanner",
    version: "v3.0.1",
    status: "standby",
    label: "Standby",
  },
  { name: "Py Runtime", version: "v3.11", status: "active", label: "Active" },
];

const EXTENDED_MODULES: Module[] = [
  { name: "HFT Core", version: "v4.0.2", status: "live", label: "Live" },
  {
    name: "Strategy Optimizer",
    version: "v2.1.0",
    status: "live",
    label: "Live",
  },
  { name: "Py Runtime 3.11", version: "", status: "active", label: "Active" },
  {
    name: "Neural Deep Scan",
    version: "v0.9.1",
    status: "idle",
    label: "Idle",
  },
];

interface ActiveModulesProps {
  extended?: boolean;
}

export function ActiveModules({ extended = false }: ActiveModulesProps) {
  const modules = extended ? EXTENDED_MODULES : BASE_MODULES;

  return (
    <Card
      data-ocid="terminal.active_modules"
      className="shadow-card gap-0 py-0"
    >
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-sm font-medium label-apple">
          Active Modules
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0">
        <ul className="divide-y divide-border">
          {modules.map((mod, i) => (
            <li
              key={`${mod.name}-${mod.status}`}
              data-ocid={`terminal.active_modules.item.${i + 1}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-sm font-medium truncate">{mod.name}</span>
                {mod.version && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {mod.version}
                  </span>
                )}
              </div>
              <Badge
                variant={STATUS_VARIANT[mod.status]}
                className="shrink-0 text-[10px] uppercase tracking-wide"
              >
                {mod.label}
              </Badge>
            </li>
          ))}
        </ul>
        <Separator />
      </CardContent>
    </Card>
  );
}
