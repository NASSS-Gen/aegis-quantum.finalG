import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * $1 Program enrollment state, persisted alongside the rest of the app
 * store so a user's program seat survives reloads.
 */
export type DollarProgramEnrollment =
  | "not_enrolled"
  | "in_progress"
  | "completed";

/**
 * Experience mode — drives progressive disclosure across the app.
 * `advanced` is the default so existing power users see the full
 * institutional board on first load, matching the prior version.
 */
export type ExperienceMode =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "optional";

interface AppState {
  currentPage: string;
  onboardingDone: boolean;
  dollarProgramEnrollment?: DollarProgramEnrollment;
  mode: ExperienceMode;
  setCurrentPage: (page: string) => void;
  setOnboardingDone: (done: boolean) => void;
  setMode: (mode: ExperienceMode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: "/overview",
      // Seed from localStorage so existing users who completed onboarding
      // before this Zustand field existed aren't forced to repeat it.
      onboardingDone:
        typeof window !== "undefined" &&
        localStorage.getItem("aegis_onboarding_done") === "true",
      mode: "advanced",
      setCurrentPage: (page) => set({ currentPage: page }),
      setOnboardingDone: (done) => set({ onboardingDone: done }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "aegis-app-store",
    },
  ),
);
