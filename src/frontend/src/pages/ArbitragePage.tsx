import ArbitrageView from "@/components/arbitrage/ArbitrageView";
import { useAppStore } from "@/store/appStore";

/**
 * Arbitrage section — standalone page at /arbitrage.
 *
 * Reads the user-selected experience mode from the Zustand store and passes
 * it down to ArbitrageView, which switches between beginner explainer,
 * intermediate cards, advanced tables, and the optional power-user surface.
 *
 * All surfaces use the monochrome Apple-inspired design tokens — zero
 * hardcoded hex, rounded corners, subtle shadows, system fonts.
 */
export default function ArbitragePage() {
  const mode = useAppStore((s) => s.mode);

  return (
    <div data-ocid="arbitrage.page" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Arbitrage
        </h1>
        <p className="text-sm text-muted-foreground">
          Cross-exchange sports &amp; financial arbitrage opportunities, scanned
          in real time.
        </p>
      </header>

      <ArbitrageView mode={mode} />
    </div>
  );
}
