import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

type OrderLevel = {
  price: number;
  size: number;
  total: number;
};

function generateLevels(
  midPrice: number,
  side: "bid" | "ask",
  count: number,
): OrderLevel[] {
  const levels: OrderLevel[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * (side === "bid" ? -12.5 : 12.5);
    const price = midPrice + offset;
    const size = Math.random() * 3.5 + 0.2;
    total += size;
    levels.push({ price, size, total });
  }
  return levels;
}

const MID = 42312.45;
const MAX_TOTAL = 18;

export function OrderBook() {
  const [bids, setBids] = useState<OrderLevel[]>(() =>
    generateLevels(MID, "bid", 6),
  );
  const [asks, setAsks] = useState<OrderLevel[]>(() =>
    generateLevels(MID, "ask", 6),
  );
  const [mid, setMid] = useState(MID);

  useEffect(() => {
    const interval = setInterval(() => {
      const newMid = mid + (Math.random() - 0.5) * 15;
      setMid(newMid);
      setBids(generateLevels(newMid, "bid", 6));
      setAsks(generateLevels(newMid, "ask", 6));
    }, 4000);
    return () => clearInterval(interval);
  }, [mid]);

  return (
    <Card className="shadow-card" data-ocid="order_book.panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Order Book</CardTitle>
          <span className="text-xs text-muted-foreground">BTC-PERP</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="grid text-[10px] uppercase tracking-wide text-muted-foreground pb-1.5 border-b border-border"
          style={{ gridTemplateColumns: "1fr 64px 1fr" }}
        >
          <span className="text-right pr-1">Size</span>
          <span className="text-center">Price</span>
          <span className="pl-1">Size</span>
        </div>
        <div className="mt-1">
          {bids.map((bid, i) => {
            const ask = asks[i];
            const bidW = Math.min((bid.total / MAX_TOTAL) * 100, 100);
            const askW = ask ? Math.min((ask.total / MAX_TOTAL) * 100, 100) : 0;
            return (
              <div
                key={`level-bid-${bid.price.toFixed(0)}`}
                className="grid items-center text-xs font-mono"
                style={{ gridTemplateColumns: "1fr 64px 1fr", height: "24px" }}
                data-ocid={`order_book.item.${i + 1}`}
              >
                <div className="relative h-full flex items-center justify-end pr-1 overflow-hidden">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-muted"
                    style={{ width: `${bidW}%` }}
                    aria-hidden="true"
                  />
                  <span className="relative z-10 text-foreground">
                    {bid.size.toFixed(3)}
                  </span>
                </div>
                <div className="text-center font-medium">
                  {bid.price.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </div>
                {ask && (
                  <div className="relative h-full flex items-center pl-1 overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-muted"
                      style={{ width: `${askW}%` }}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 text-muted-foreground">
                      {ask.size.toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center py-1.5 mt-1 border-t border-border">
          <span className="text-xs font-medium">
            Mid {mid.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
