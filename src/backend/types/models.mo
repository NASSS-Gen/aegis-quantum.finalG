import Common "./common";
import Predictions "./predictions";

module {
  // ─── Re-export shim ────────────────────────────────────────────────────
  // The canonical ModelSignal, ModelDirection, and QuantModel definitions
  // live in types/predictions.mo (ModelSignal, ModelDirection) and
  // types/common.mo (QuantModel). This file re-exports them so existing
  // `Types.ModelSignal` / `Types.QuantModel` imports in lib/models.mo and
  // mixins/models-api.mo keep working without duplication or schema drift.
  public type ModelDirection = Predictions.ModelDirection;
  public type ModelSignal = Predictions.ModelSignal;
  public type QuantModel = Common.QuantModel;
};
