import Map "mo:core/Map";
import Types "../types/settings";
import SettingsLib "../lib/settings";

mixin (store : SettingsLib.SettingsStore) {
  public shared query ({ caller }) func getUserSettings() : async Types.UserSettings {
    SettingsLib.getSettings(store, caller);
  };

  public shared ({ caller }) func setMode(mode : Types.Mode) : async () {
    SettingsLib.setMode(store, caller, mode);
  };

  public shared ({ caller }) func setOnboardingComplete() : async () {
    SettingsLib.setOnboardingComplete(store, caller);
  };
};
