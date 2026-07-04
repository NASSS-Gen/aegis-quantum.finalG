import Types "../types/practice";
import PracticeLib "../lib/practice";

mixin (store : PracticeLib.PracticeStore) {
  public shared func addPracticeTrade(
    assetId : Text,
    assetClass : Text,
    scope : Text,
    direction : Types.Direction,
    entryPrice : Float,
    targetPrice : Float,
    stopLoss : Float,
  ) : async Types.PracticeTrade {
    PracticeLib.addPracticeTrade(
      store,
      assetId,
      assetClass,
      scope,
      direction,
      entryPrice,
      targetPrice,
      stopLoss,
    );
  };

  public shared func resolvePracticeTradeFromPrice(
    id : Nat,
    currentPrice : Float,
  ) : async ?Types.PracticeTrade {
    PracticeLib.resolvePracticeTradeFromPrice(store, id, currentPrice);
  };

  public query func getPracticeTradeHistory() : async [Types.PracticeTrade] {
    PracticeLib.getPracticeTradeHistory(store);
  };

  public query func getPracticeTradeStats() : async Types.PracticeStats {
    PracticeLib.getPracticeTradeStats(store);
  };
};
