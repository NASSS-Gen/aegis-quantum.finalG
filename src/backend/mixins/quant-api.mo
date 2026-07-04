import Types "../types/quant";
import QuantLib "../lib/quant";

mixin (store : QuantLib.QuantStore) {
  public shared query ({ caller }) func getQuantSettings() : async Types.QuantSettings {
    QuantLib.getSettings(store, caller);
  };

  public shared ({ caller }) func setQuantSettings(settings : Types.QuantSettings) : async () {
    QuantLib.setSettings(store, caller, settings);
  };
};
