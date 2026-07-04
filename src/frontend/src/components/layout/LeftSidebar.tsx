import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  CandlestickChart,
  DollarSign,
  Gauge,
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  Repeat2,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

/**
 * Left sidebar — 10 distinct top-level nav sections.
 *
 * Apple-inspired minimal icons + labels. Pure monochrome tokens, hairline
 * border, rounded active state. Active item uses bg-accent with primary text;
 * inactive items use muted-foreground and lift to foreground on hover.
 *
 * Sections: Overview, Dashboard, Predictions, Terminal, Indian Market,
 * Arbitrage, Practice Arena, Backtest, Risk, $1 Program.
 */

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    path: "/overview",
    icon: Gauge,
    ocid: "sidebar.overview",
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    ocid: "sidebar.dashboard",
  },
  {
    label: "Predictions",
    path: "/predictions",
    icon: CandlestickChart,
    ocid: "sidebar.predictions",
  },
  {
    label: "Terminal",
    path: "/terminal",
    icon: Activity,
    ocid: "sidebar.terminal",
  },
  {
    label: "Indian Market",
    path: "/indian-market",
    icon: TrendingUp,
    ocid: "sidebar.indian_market",
  },
  {
    label: "Arbitrage",
    path: "/arbitrage",
    icon: Repeat2,
    ocid: "sidebar.arbitrage",
  },
  {
    label: "Practice Arena",
    path: "/practice-arena",
    icon: Target,
    ocid: "sidebar.practice_arena",
  },
  {
    label: "Backtest",
    path: "/backtest",
    icon: LineChart,
    ocid: "sidebar.backtest",
  },
  {
    label: "Risk",
    path: "/risk",
    icon: ShieldCheck,
    ocid: "sidebar.risk",
  },
  {
    label: "$1 Program",
    path: "/dollar-program",
    icon: DollarSign,
    ocid: "sidebar.dollar_program",
  },
];

export function LeftSidebar() {
  const location = useLocation();

  return (
    <aside
      className="fixed left-0 top-16 bottom-12 z-40 w-56 flex flex-col bg-card border-r border-border"
      data-ocid="left_sidebar"
    >
      <nav
        className="flex flex-col gap-1 p-3 overflow-y-auto"
        aria-label="Primary"
      >
        {NAV_ITEMS.map(({ label, path, icon: Icon, ocid }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={[
                "group flex items-center gap-3 px-3 h-11 rounded-xl transition-smooth",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              ].join(" ")}
              data-ocid={ocid}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={[
                  "w-[18px] h-[18px] flex-shrink-0 transition-smooth",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                ].join(" ")}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span className="text-[14px] font-medium tracking-tight truncate">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
