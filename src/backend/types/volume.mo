import MarketData "./marketData";
import Predictions "./predictions";

module {
  // ─── Re-export shim ────────────────────────────────────────────────────
  // The canonical volume-profile types (VolumeProfile, VolumeBin, NodeClass,
  // PricePosition, VolumeNode) live in types/predictions.mo. This file
  // re-exports them so existing `Types.VolumeProfile` imports in
  // lib/volumeProfile.mo and mixins/volume-api.mo keep working without
  // duplication or schema drift.
  public type VolumeBin = Predictions.VolumeBin;
  public type NodeClass = Predictions.NodeClass;
  public type PricePosition = Predictions.PricePosition;
  public type VolumeNode = Predictions.VolumeNode;
  public type VolumeProfile = Predictions.VolumeProfile;
  public type OHLC = MarketData.OHLC;
};
