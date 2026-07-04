import PredictionsPage from "@/pages/PredictionsPage";

/**
 * Predictions section — standalone page at /predictions.
 *
 * Renders the legacy F&O signal generation view: asset selector, confluence
 * panel, signal report card, technical oscillators, fibonacci, forecast chart,
 * scenario analysis, prediction history, and quant settings panel.
 *
 * All surfaces use the monochrome Apple-inspired design tokens — zero
 * hardcoded hex, rounded corners, subtle shadows, system fonts.
 */
export default function PredictPage() {
  return (
    <div className="flex flex-col gap-6" data-ocid="predictions.page">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Predictions
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate F&amp;O signals from multi-timeframe confluence and review
          the live signal log.
        </p>
      </header>

      <PredictionsPage />
    </div>
  );
}
