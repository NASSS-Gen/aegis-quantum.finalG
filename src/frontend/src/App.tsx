import { AppShell } from "@/components/layout/AppShell";
import ArbitragePage from "@/pages/ArbitragePage";
import BacktestPage from "@/pages/BacktestPage";
import DashboardPage from "@/pages/DashboardPage";
import DollarProgramPage from "@/pages/DollarProgramPage";
import IndianMarketPage from "@/pages/IndianMarketPage";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import OverviewPage from "@/pages/OverviewPage";
import PracticeArenaPage from "@/pages/PracticeArenaPage";
import PredictPage from "@/pages/PredictPage";
import RiskPage from "@/pages/RiskPage";
import TerminalPage from "@/pages/TerminalPage";
import { useAppStore } from "@/store/appStore";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Navigate,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/**
 * Route map — 10 distinct top-level sections, each its own dedicated page.
 *
 * Sections: Overview, Dashboard, Predictions, Terminal, Indian Market,
 * Arbitrage, Practice Arena, Backtest, Risk, $1 Program. Legacy alias paths
 * (/home, and the old consolidated routes /predict, /markets, /practice)
 * redirect to their restored destinations so existing bookmarks keep working.
 */

const rootRoute = createRootRoute({
  component: Root,
});

function Root() {
  const { isAuthenticated } = useInternetIdentity();
  // Read from reactive Zustand store so Root re-renders when onboarding completes.
  const onboardingDone = useAppStore((s) => s.onboardingDone);

  if (!isAuthenticated) return <LoginPage />;
  if (!onboardingDone) return <OnboardingPage />;

  return <AppShell />;
}

/* --- Top-level section routes (9 distinct pages) --- */

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  component: OverviewPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const predictionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/predictions",
  component: PredictPage,
});

const terminalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terminal",
  component: TerminalPage,
});

const indianMarketRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/indian-market",
  component: IndianMarketPage,
});

const arbitrageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/arbitrage",
  component: ArbitragePage,
});

const practiceArenaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/practice-arena",
  component: PracticeArenaPage,
});

const backtestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/backtest",
  component: BacktestPage,
});

const riskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/risk",
  component: RiskPage,
});

const dollarProgramRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dollar-program",
  component: DollarProgramPage,
});

/* --- Legacy alias redirects --- */

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <Navigate to="/overview" />,
});

const homeRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: () => <Navigate to="/overview" />,
});

/* Old consolidated routes redirect to their restored destinations. */
const predictRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/predict",
  component: () => <Navigate to="/predictions" />,
});

const marketsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/markets",
  component: () => <Navigate to="/indian-market" />,
});

const practiceRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/practice",
  component: () => <Navigate to="/practice-arena" />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  overviewRoute,
  dashboardRoute,
  predictionsRoute,
  terminalRoute,
  indianMarketRoute,
  arbitrageRoute,
  practiceArenaRoute,
  backtestRoute,
  riskRoute,
  dollarProgramRoute,
  homeRedirect,
  predictRedirect,
  marketsRedirect,
  practiceRedirect,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
