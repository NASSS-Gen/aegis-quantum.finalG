import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types/practice";

module {
  public type PracticeStore = {
    var nextId : Nat;
    var records : [Types.PracticeTrade];
  };

  public func emptyStore() : PracticeStore {
    { var nextId = 0; var records = [] };
  };

  // Create a new Open practice trade. Returns the new trade.
  public func addPracticeTrade(
    store : PracticeStore,
    assetId : Text,
    assetClass : Text,
    scope : Text,
    direction : Types.Direction,
    entryPrice : Float,
    targetPrice : Float,
    stopLoss : Float,
  ) : Types.PracticeTrade {
    let id = store.nextId;
    store.nextId += 1;
    let now = Int.abs(Time.now());
    let trade : Types.PracticeTrade = {
      id;
      timestamp = now;
      assetId;
      assetClass;
      scope;
      direction;
      entryPrice;
      targetPrice;
      stopLoss;
      status = #Open;
      resolvedAt = null;
      pnl = null;
      createdAt = now;
    };
    store.records := store.records.concat([trade]);
    trade;
  };

  // Auto-resolve an Open trade from the latest market price.
  //   Long: Win if price >= target, Loss if price <= stop.
  //   Short: Win if price <= target, Loss if price >= stop.
  // Computes pnl per the paper-trade P&L rules and returns the resolved trade.
  public func resolvePracticeTradeFromPrice(
    store : PracticeStore,
    id : Nat,
    currentPrice : Float,
  ) : ?Types.PracticeTrade {
    let found = store.records.find(func(r) { r.id == id });
    switch (found) {
      case null { null };
      case (?r) {
        if (r.status != #Open) { return null };
        let outcome : ?Types.TradeStatus = switch (r.direction) {
          case (#Long) {
            if (currentPrice >= r.targetPrice) { ?#Win }
            else if (currentPrice <= r.stopLoss) { ?#Loss }
            else { null };
          };
          case (#Short) {
            if (currentPrice <= r.targetPrice) { ?#Win }
            else if (currentPrice >= r.stopLoss) { ?#Loss }
            else { null };
          };
        };
        switch (outcome) {
          case null { null };
          case (?status) {
            let pnl : Float = switch (r.direction, status) {
              case (#Long, #Win) { r.targetPrice - r.entryPrice };
              case (#Long, #Loss) { r.entryPrice - r.stopLoss };
              case (#Short, #Win) { r.entryPrice - r.targetPrice };
              case (#Short, #Loss) { r.stopLoss - r.entryPrice };
              case (_, #Open) { 0.0 };
            };
            let now = Int.abs(Time.now());
            let resolved : Types.PracticeTrade = {
              r with
              status;
              resolvedAt = ?now;
              pnl = ?pnl;
            };
            store.records := store.records.map(
              func(t) {
                if (t.id == id) { resolved } else { t };
              },
            );
            ?resolved;
          };
        };
      };
    };
  };

  public func getPracticeTradeHistory(store : PracticeStore) : [Types.PracticeTrade] {
    let sorted = store.records.sort(
      func(a, b) {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal };
      },
    );
    sorted;
  };

  public func getPracticeTradeStats(store : PracticeStore) : Types.PracticeStats {
    var wins = 0;
    var losses = 0;
    var totalPnl = 0.0;
    var totalRR = 0.0;
    var i = 0;
    while (i < store.records.size()) {
      let r = store.records[i];
      switch (r.status) {
        case (#Win) { wins += 1 };
        case (#Loss) { losses += 1 };
        case (#Open) {};
      };
      switch (r.pnl) {
        case (?p) { totalPnl += p };
        case null {};
      };
      let risk = Float.abs(r.entryPrice - r.stopLoss);
      let reward = Float.abs(r.targetPrice - r.entryPrice);
      let rr = if (risk == 0.0) { 0.0 } else { reward / risk };
      totalRR += rr;
      i += 1;
    };
    let resolvedCount = wins + losses;
    let winRate = if (resolvedCount == 0) { 0.0 } else {
      Float.fromInt64(wins.toInt64()) / Float.fromInt64(resolvedCount.toInt64());
    };
    let avgPnl = if (resolvedCount == 0) { 0.0 } else {
      totalPnl / Float.fromInt64(resolvedCount.toInt64());
    };
    let avgRiskReward = if (store.records.size() == 0) { 0.0 } else {
      totalRR / Float.fromInt64(store.records.size().toInt64());
    };
    {
      totalTrades = store.records.size();
      wins;
      losses;
      winRate;
      totalPnl;
      avgPnl;
      avgRiskReward;
    };
  };
};
