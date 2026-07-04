import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart2,
  Brain,
  Calculator,
  Radar,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

const ICON_MAP = { Brain, TrendingUp, Calculator, Radar, BarChart2 };

const ACTION_CARDS = [
  {
    id: "predict",
    title: "Predict",
    description: "AI-driven signal forecasts and confluence scoring.",
    stat: "72.1% win rate",
    route: "/predict",
    icon: "Brain" as const,
  },
  {
    id: "markets",
    title: "Markets",
    description: "Live tickers, heatmap, and arbitrage scanning.",
    stat: "12 assets tracked",
    route: "/markets",
    icon: "TrendingUp" as const,
  },
  {
    id: "practice",
    title: "Practice",
    description: "Risk-free arena, backtesting, and trade journal.",
    stat: "4 open positions",
    route: "/practice",
    icon: "Calculator" as const,
  },
  {
    id: "backtest",
    title: "Backtest",
    description: "Strategy validation against historical data.",
    stat: "Sharpe 3.82",
    route: "/practice",
    icon: "Radar" as const,
  },
  {
    id: "heatmap",
    title: "Heatmap",
    description: "Cross-asset performance at a glance.",
    stat: "Live",
    route: "/markets",
    icon: "BarChart2" as const,
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="px-6 py-10" data-ocid="home_page">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center text-center gap-3 mb-10"
        data-ocid="home.hero"
      >
        <span className="label-apple uppercase tracking-widest">
          Aegis Quantum
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Command Center
        </h1>
        <p className="text-base text-muted-foreground max-w-md">
          Welcome back. Your trading system is online and ready for orders.
        </p>
      </motion.div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
        data-ocid="home.cards_grid"
      >
        {ACTION_CARDS.map((card, idx) => {
          const Icon = ICON_MAP[card.icon];
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.1 + idx * 0.08,
                ease: "easeOut",
              }}
            >
              <Card
                className="metric-card rounded-2xl cursor-pointer h-full"
                onClick={() => navigate({ to: card.route })}
                data-ocid={`home.card.${idx + 1}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <h3 className="text-base font-semibold tracking-tight mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {card.description}
                  </p>
                  <span className="text-xs font-medium text-foreground">
                    {card.stat}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center mt-10">
        <Button
          variant="default"
          size="lg"
          className="rounded-full"
          onClick={() => navigate({ to: "/overview" })}
          data-ocid="home.open_overview_button"
        >
          Open Overview
        </Button>
      </div>
    </div>
  );
}
