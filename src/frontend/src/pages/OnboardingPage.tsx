import { ONBOARDING_SLIDES } from "@/lib/mockData";
import { useAppStore } from "@/store/appStore";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useState } from "react";

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  const current = ONBOARDING_SLIDES[slide];
  const total = ONBOARDING_SLIDES.length;
  const isLast = slide === total - 1;

  const complete = () => {
    // Write to both Zustand (reactive — triggers Root re-render) and
    // localStorage (backward compat for any legacy checks).
    setOnboardingDone(true);
    localStorage.setItem("aegis_onboarding_done", "true");
    navigate({ to: "/home" });
  };

  const next = () => {
    if (slide < total - 1) setSlide((s) => s + 1);
    else complete();
  };

  const prev = () => {
    if (slide > 0) setSlide((s) => s - 1);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6"
      data-ocid="onboarding_page"
    >
      {/* Skip button */}
      <button
        type="button"
        onClick={complete}
        className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth z-[102]"
        data-ocid="onboarding.skip_button"
      >
        <X className="w-4 h-4" />
        Skip
      </button>

      {/* Slide counter */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground tabular-nums z-[102]"
        data-ocid="onboarding.slide_counter"
      >
        {String(slide + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      {/* Main panel */}
      <div
        className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-elevated overflow-hidden"
        data-ocid="onboarding.slide_panel"
      >
        {/* Phase header */}
        <div className="px-8 py-5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-2.5 py-1 rounded-md bg-secondary">
              {current.phase}
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {current.title}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {current.subtitle}
          </span>
        </div>

        {/* Content: two columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 min-h-[360px]">
          {/* Left: description + stats */}
          <div className="p-8 flex flex-col gap-6 sm:border-r sm:border-border">
            <p className="text-sm leading-relaxed text-foreground/80">
              {current.description}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {current.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-xl bg-secondary/60 border border-border"
                >
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    {stat.label}
                  </div>
                  <div className="text-base font-semibold text-foreground tabular-nums">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: ASCII art */}
          <div className="p-8 flex items-center justify-center bg-muted/30">
            <pre className="text-xs leading-5 select-none text-foreground/70 font-mono whitespace-pre">
              {current.art.join("\n")}
            </pre>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-foreground transition-smooth"
            style={{ width: `${((slide + 1) / total) * 100}%` }}
          />
        </div>

        {/* Navigation footer */}
        <div className="px-8 py-5 flex items-center justify-between border-t border-border">
          <button
            type="button"
            onClick={prev}
            disabled={slide === 0}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-smooth h-10 px-4 rounded-xl border border-border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:shadow-focus"
            data-ocid="onboarding.prev_button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {ONBOARDING_SLIDES.map((slideData, i) => (
              <button
                key={slideData.phase}
                type="button"
                onClick={() => setSlide(i)}
                className="transition-smooth rounded-full focus-visible:outline-none focus-visible:shadow-focus"
                style={{
                  width: i === slide ? "24px" : "8px",
                  height: "8px",
                  backgroundColor:
                    i === slide
                      ? "oklch(var(--foreground))"
                      : "oklch(var(--surface-4))",
                }}
                data-ocid={`onboarding.dot_${i + 1}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-2 text-sm font-medium text-background bg-foreground transition-smooth h-10 px-5 rounded-xl hover:opacity-90 focus-visible:outline-none focus-visible:shadow-focus"
            data-ocid="onboarding.next_button"
          >
            {isLast ? "Get started" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
