import { Outlet } from "@tanstack/react-router";
import { BottomStatusBar } from "./BottomStatusBar";
import { LeftSidebar } from "./LeftSidebar";
import { TopNav } from "./TopNav";

/**
 * Apple-inspired application shell.
 *
 * Layout: fixed top nav (bg-card, hairline border, subtle shadow) + fixed left
 * sidebar (bg-card, hairline border) + scrollable main content (bg-background,
 * centered max-width) + fixed bottom status bar (bg-card, hairline border).
 *
 * All surfaces use semantic design tokens — zero hardcoded hex, zero CRT
 * effects, zero inline <style> blocks. Rounded corners and soft layered
 * shadows follow the monochrome Apple aesthetic.
 */
export function AppShell() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <TopNav />
      <LeftSidebar />

      {/* Main content area — offset for fixed top nav + sidebar */}
      <main
        className="pt-16 pl-56 pb-12 min-h-screen bg-background"
        data-ocid="main_content"
      >
        <div className="mx-auto w-full max-w-[1280px] px-8 py-10">
          <Outlet />
        </div>
      </main>

      <BottomStatusBar />
    </div>
  );
}
