import Map "mo:core/Map";

import CommonTypes "types/common";

import OutCall "mo:caffeineai-http-outcalls/outcall";

import PredictionsLib "lib/predictions";
import QuantLib "lib/quant";
import BacktestLib "lib/backtest";
import PracticeLib "lib/practice";
import SettingsLib "lib/settings";
import MarketDataLib "lib/marketData";
import CalibrationLib "lib/calibration";

import Migration "migration";

import MarketDataMixin "mixins/marketData-api";
import PredictionsMixin "mixins/predictions-api";
import QuantMixin "mixins/quant-api";
import BacktestMixin "mixins/backtest-api";
import PracticeMixin "mixins/practice-api";
import SettingsMixin "mixins/settings-api";
import ModelsMixin "mixins/models-api";
import VolumeMixin "mixins/volume-api";
import RegimeMixin "mixins/regime-api";
import CalibrationMixin "mixins/calibration-api";

(with migration = Migration.run)
actor {

  // ---------------------------------------------------------------------------
  // Stable stores
  // ---------------------------------------------------------------------------

   var settingsStore : SettingsLib.SettingsStore = Map.empty();
   var predictionStore : PredictionsLib.PredictionStore = PredictionsLib.emptyStore();
   var quantStore : QuantLib.QuantStore = Map.empty();
   var marketDataCache : MarketDataLib.MarketDataCache = MarketDataLib.emptyCache();
   var backtestStore : BacktestLib.BacktestStore = BacktestLib.emptyStore();
   var practiceStore : PracticeLib.PracticeStore = PracticeLib.emptyStore();
   var calibrationStore : CalibrationLib.CalibrationStore = CalibrationLib.emptyStore();

  // ---------------------------------------------------------------------------
  // Shared transform (Candid <-> stable) used by prediction/market mixins
  // ---------------------------------------------------------------------------

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ---------------------------------------------------------------------------
  // Mixin composition
  // ---------------------------------------------------------------------------

  include SettingsMixin(settingsStore);
  include PredictionsMixin(predictionStore, marketDataCache, transform, calibrationStore, backtestStore);
  include QuantMixin(quantStore);
  include MarketDataMixin(marketDataCache, transform);
  include BacktestMixin(backtestStore, marketDataCache, transform);
  include PracticeMixin(practiceStore);
  include ModelsMixin();
  include VolumeMixin(marketDataCache, transform);
  include RegimeMixin(marketDataCache, transform);
  include CalibrationMixin(calibrationStore, predictionStore);

};
