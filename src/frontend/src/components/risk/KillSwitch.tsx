import { Button } from "@/components/ui/button";
import { useState } from "react";

export function KillSwitch() {
  const [arming, setArming] = useState(false);

  return (
    <div
      className="w-full flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-5 py-4 rounded-xl border border-border bg-muted/40 shadow-subtle"
      data-ocid="risk.kill_switch_banner"
    >
      <div className="flex items-center gap-3">
        {/* Alert dot */}
        <div
          className="w-2 h-2 rounded-full bg-foreground shrink-0"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight">
            System Kill Switch
          </span>
          <span className="label-apple">
            Warning: initiating will close all positions
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex flex-col items-end">
          <span className="label-apple uppercase tracking-wide">
            Global exposure
          </span>
          <span
            className="text-lg font-semibold font-display"
            data-ocid="risk.kill_switch_exposure"
          >
            $4,281,009.42
          </span>
        </div>

        <div className="flex items-center gap-3">
          {arming && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setArming(false)}
              data-ocid="risk.kill_switch_cancel_button"
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant={arming ? "destructive" : "default"}
            onClick={() => setArming(true)}
            data-ocid="risk.kill_switch_engage_button"
          >
            {arming ? "Confirm engage" : "Engage"}
          </Button>
        </div>
      </div>
    </div>
  );
}
