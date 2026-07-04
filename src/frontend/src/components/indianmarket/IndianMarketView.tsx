import MarketDepth from "@/components/indianmarket/MarketDepth";
import MarketTopBar from "@/components/indianmarket/MarketTopBar";
import OperatorGuide from "@/components/indianmarket/OperatorGuide";
import RiskMatrix from "@/components/indianmarket/RiskMatrix";
import SymbolGrid from "@/components/indianmarket/SymbolGrid";
import SignalActivityLog from "@/components/indianmarket/TerminalStreamLog";
import {
  type FilterTab,
  INDEX_SYMBOLS,
  fluctuate,
} from "@/lib/indianMarketData";
import { useEffect, useRef, useState } from "react";

/**
 * Indian Market view — NSE/BSE live prices, signals, market depth, risk
 * matrix, and a clean readable signal/activity log. Monochrome Apple
 * aesthetic: white canvas, hairline borders, soft shadows, system fonts.
 */
export default function IndianMarketView() {
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const tickRef = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Live index strip values (drives the top bar's animated prices).
  const indexStrip = INDEX_SYMBOLS.map((s) => ({
    symbol: s.symbol,
    price: fluctuate(s.price, s.symbol, tick),
    change: s.change + ((tick % 7) - 3) * 0.01,
  }));

  return (
    <div data-ocid="indian_market.view" className="flex flex-col gap-6">
      {/* Live index strip */}
      <MarketTopBar symbols={indexStrip} />

      {/* Symbol grid with filters */}
      <SymbolGrid filter={filter} onFilterChange={setFilter} tick={tick} />

      {/* Three-panel row: depth, risk, guide */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MarketDepth />
        <RiskMatrix />
        <OperatorGuide />
      </div>

      {/* Clean signal / activity log (replaces CRT terminal stream) */}
      <SignalActivityLog />
    </div>
  );
}
