import Map "mo:core/Map";
import Types "../types/settings";

module {
  public type SettingsStore = Map.Map<Principal, Types.UserSettings>;

  let defaultSettings : Types.UserSettings = {
    mode = #Beginner;
    onboardingComplete = false;
  };

  public func getSettings(store : SettingsStore, caller : Principal) : Types.UserSettings {
    switch (store.get(caller)) {
      case (?s) s;
      case null defaultSettings;
    };
  };

  public func setMode(store : SettingsStore, caller : Principal, mode : Types.Mode) {
    let current = getSettings(store, caller);
    store.add(caller, { current with mode });
  };

  public func setOnboardingComplete(store : SettingsStore, caller : Principal) {
    let current = getSettings(store, caller);
    store.add(caller, { current with onboardingComplete = true });
  };
};
