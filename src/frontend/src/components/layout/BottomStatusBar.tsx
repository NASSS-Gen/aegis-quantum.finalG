import { useEffect, useState } from "react";

/**
 * Minimal bottom status bar.
 *
 * Essential status only: connection state, last update time, active symbol.
 * No random latency, node, engine, or rotating hash. Pure monochrome tokens,
 * hairline border, system mono font for the data values.
 */

function formatTime(date: Date): string {
  const h = date.getUTCHours().toString().padStart(2, "0");
  const m = date.getUTCMinutes().toString().padStart(2, "0");
  const s = date.getUTCSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s} UTC`;
}

export function BottomStatusBar() {
  const [lastUpdate, setLastUpdate] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(formatTime(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sep = (
    <span className="mx-3 text-border" aria-hidden="true">
      |
    </span>
  );

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-40 h-12 flex items-center px-6 bg-card border-t border-border"
      data-ocid="status_bar"
    >
      {/* Connection state */}
      <span
        className="flex items-center gap-2 text-[12px] font-medium text-foreground"
        data-ocid="status_bar.connection_state"
      >
        <span
          className="w-2 h-2 rounded-full bg-foreground"
          aria-hidden="true"
        />
        Connected
      </span>

      {sep}

      {/* Last update time */}
      <span
        className="flex items-center gap-2 text-[12px] text-muted-foreground"
        data-ocid="status_bar.last_update"
      >
        <span className="font-medium text-muted-foreground">Updated</span>
        <span className="font-mono text-foreground tracking-tight">
          {lastUpdate}
        </span>
      </span>

      {sep}

      {/* Active symbol */}
      <span
        className="flex items-center gap-2 text-[12px] text-muted-foreground"
        data-ocid="status_bar.active_symbol"
      >
        <span className="font-medium text-muted-foreground">Symbol</span>
        <span className="font-mono text-foreground tracking-tight">
          BTC/USD
        </span>
      </span>
    </footer>
  );
}
