import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
          grid: "oklch(var(--chart-grid) / <alpha-value>)",
          axis: "oklch(var(--chart-axis) / <alpha-value>)",
          baseline: "oklch(var(--chart-baseline) / <alpha-value>)",
          area: "oklch(var(--chart-area) / <alpha-value>)",
          drawdown: "oklch(var(--chart-drawdown) / <alpha-value>)",
        },
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          foreground: "oklch(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "oklch(var(--warning) / <alpha-value>)",
          foreground: "oklch(var(--warning-foreground))",
        },
        metric: {
          positive: "oklch(var(--metric-positive) / <alpha-value>)",
          negative: "oklch(var(--metric-negative) / <alpha-value>)",
          neutral: "oklch(var(--metric-neutral) / <alpha-value>)",
        },
        table: {
          stripe: "oklch(var(--table-stripe) / <alpha-value>)",
          "row-hover": "oklch(var(--table-row-hover) / <alpha-value>)",
        },
        config: {
          "input-bg": "oklch(var(--config-input-bg))",
          label: "oklch(var(--config-label) / <alpha-value>)",
          focus: "oklch(var(--config-focus) / <alpha-value>)",
        },
        surface: {
          1: "oklch(var(--surface-1))",
          2: "oklch(var(--surface-2))",
          3: "oklch(var(--surface-3))",
          4: "oklch(var(--surface-4))",
          5: "oklch(var(--surface-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        practice: {
          accent: "oklch(var(--practice-accent) / <alpha-value>)",
          "accent-foreground": "oklch(var(--practice-accent-foreground))",
        },
        long: {
          DEFAULT: "oklch(var(--long) / <alpha-value>)",
          foreground: "oklch(var(--long-foreground))",
        },
        short: {
          DEFAULT: "oklch(var(--short) / <alpha-value>)",
          foreground: "oklch(var(--short-foreground))",
        },
        marker: {
          entry: "oklch(var(--marker-entry) / <alpha-value>)",
          target: "oklch(var(--marker-target) / <alpha-value>)",
          stop: "oklch(var(--marker-stop) / <alpha-value>)",
        },
        badge: {
          win: "oklch(var(--badge-win) / <alpha-value>)",
          "win-foreground": "oklch(var(--badge-win-foreground))",
          loss: "oklch(var(--badge-loss) / <alpha-value>)",
          "loss-foreground": "oklch(var(--badge-loss-foreground))",
          open: "oklch(var(--badge-open) / <alpha-value>)",
          "open-foreground": "oklch(var(--badge-open-foreground))",
          pending: "oklch(var(--badge-pending) / <alpha-value>)",
          "pending-foreground": "oklch(var(--badge-pending-foreground))",
        },
        disclaimer: {
          bg: "oklch(var(--disclaimer-bg))",
          border: "oklch(var(--disclaimer-border) / <alpha-value>)",
          foreground: "oklch(var(--disclaimer-foreground))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.04)",
        subtle: "0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 3px 0 rgba(0,0,0,0.06)",
        card: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)",
        elevated: "0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 6px -1px rgba(0,0,0,0.04)",
        focus: "0 0 0 4px rgba(0,0,0,0.08)",
        "inner-hairline": "inset 0 0 0 1px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
