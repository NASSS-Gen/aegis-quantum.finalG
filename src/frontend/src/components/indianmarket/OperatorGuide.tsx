import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GUIDE_ITEMS = [
  {
    term: "NSE",
    desc: "National Stock Exchange. India's largest equity derivatives exchange.",
  },
  {
    term: "BSE",
    desc: "Bombay Stock Exchange. Asia's oldest exchange.",
  },
];

/**
 * Operator guide panel — concise glossary of exchange terms plus trading
 * hours. The beginner-mode F&O explainer was removed (mode selector is out
 * of scope); the guide is now a single clean reference card.
 */
export default function OperatorGuide() {
  return (
    <Card data-ocid="market.operator_guide" className="shadow-subtle">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">
          Operator Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-3">
          {GUIDE_ITEMS.map((item) => (
            <div key={item.term} className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {item.term}
              </dt>
              <dd className="text-xs leading-relaxed text-muted-foreground">
                {item.desc}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Trading Hours
          </span>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            09:15–15:30 IST
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="market.download_docs_button"
          className="w-full text-xs font-medium uppercase tracking-wide"
        >
          Download full docs
        </Button>
      </CardContent>
    </Card>
  );
}
