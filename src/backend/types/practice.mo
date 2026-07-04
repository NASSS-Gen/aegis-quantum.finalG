import Common "../types/common";
module {
  // ─── Practice Trade Domain ──────────────────────────────────────────────
  // Paper-only practice trades. No real money, no order routing, no brokerage
  // integration. Mirrors the PredictionRecord pattern but with explicit Long /
  // Short direction and Win / Loss / Open status tailored to paper-trade
  // resolution semantics.

  public type Direction = {
    #Long;
    #Short;
  };

  public type TradeStatus = {
    #Open;
    #Win;
    #Loss;
  };

  public type PracticeTrade = {
    id : Nat;
    timestamp : Nat; // creation time (ms)
    assetId : Text;
    assetClass : Text;
    scope : Text; // "india" | "crypto" | "forex"
    direction : Direction;
    entryPrice : Float;
    targetPrice : Float;
    stopLoss : Float;
    status : TradeStatus;
    resolvedAt : ?Nat;
    pnl : ?Float;
    createdAt : Nat;
  };

  public type PracticeStats = {
    totalTrades : Nat;
    wins : Nat;
    losses : Nat;
    winRate : Float; // 0.0-1.0
    totalPnl : Float;
    avgPnl : Float;
    avgRiskReward : Float;
  };
};
