import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/quant";

module {
  public type QuantStore = Map.Map<Principal, Types.QuantSettings>;

  // Default quant settings used when a caller has not customized their
  // configuration. Exposed publicly so the predictions-api mixin can pass
  // settings into the model signal generators without a quant-store binding.
  public let defaultSettings : Types.QuantSettings = {
    indicatorSet = #Minimal;
    confluenceWeights = {
      lowerTimeframe = 20;
      selectedTimeframe = 50;
      higherTimeframe = 30;
      m15 = 25;
      h1 = 30;
      h4 = 25;
      d1 = 20;
    };
    maxRiskPercent = 1.0;
    accountSize = 100_000.0;
    backtestLookback = 100;
    useVWAP = true;
    useRegimeFilter = true;
    minConfidence = 60;
  };

  public func getSettings(store : QuantStore, caller : Principal) : Types.QuantSettings {
    switch (store.get(caller)) {
      case (?settings) settings;
      case null defaultSettings;
    };
  };

  public func setSettings(
    store : QuantStore,
    caller : Principal,
    settings : Types.QuantSettings,
  ) {
    store.add(caller, settings);
  };
};
