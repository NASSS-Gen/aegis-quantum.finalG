import Common "../types/common";
import Quant "../types/quant";
import Predictions "../types/predictions";

module {
  // ─── Re-export shim ────────────────────────────────────────────────────
  // The canonical regime types live in types/common.mo (MarketRegime),
  // types/quant.mo (RegimeHistoryEntry, RegimeStrategyWeights), and
  // types/predictions.mo (RegimeAssessment). This file re-exports them so
  // existing `Types.RegimeAssessment` / `Types.RegimeHistoryEntry` /
  // `Types.RegimeStrategyWeights` imports in lib/regime.mo and
  // mixins/regime-api.mo keep working without duplication or schema drift.
  public type MarketRegime = Common.MarketRegime;
  public type RegimeHistoryEntry = Quant.RegimeHistoryEntry;
  public type RegimeStrategyWeights = Quant.RegimeStrategyWeights;
  public type RegimeAssessment = Predictions.RegimeAssessment;
};
