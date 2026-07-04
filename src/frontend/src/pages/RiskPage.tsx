import { PracticeHeader, RiskManagementView } from "@/pages/PracticePage";

/**
 * Risk section — standalone page at /risk.
 *
 * Renders the Risk Management view: position size calculator, drawdown
 * profile, portfolio heatmap, and quick risk controls. PRACTICE ONLY — NO
 * REAL MONEY.
 */
export default function RiskPage() {
  return (
    <div className="flex flex-col gap-8" data-ocid="risk.page">
      <PracticeHeader
        title="Risk"
        description="Size positions with disciplined risk controls and monitor drawdown across your paper portfolio."
      />
      <RiskManagementView />
    </div>
  );
}
