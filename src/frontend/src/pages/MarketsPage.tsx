import IndianMarketView from "@/components/indianmarket/IndianMarketView";

/**
 * Indian Market section — standalone page at /indian-market.
 *
 * Renders the legacy Indian Market view: NSE/BSE live prices, sector
 * breadth, and India-specific signals.
 *
 * All surfaces use the monochrome Apple-inspired design tokens — zero
 * hardcoded hex, rounded corners, subtle shadows, system fonts.
 */
export default function MarketsPage() {
  return (
    <div
      data-ocid="indian_market.page"
      className="mx-auto w-full max-w-[1280px] px-6 py-8 lg:py-10"
    >
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Indian Market
        </h1>
        <p className="text-sm text-muted-foreground">
          Live NSE &amp; BSE equities, sector breadth, and India-specific
          signals.
        </p>
      </header>

      <IndianMarketView />
    </div>
  );
}
