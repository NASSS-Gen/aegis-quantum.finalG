# Design Brief

## Direction

**AEGIS QUANTUM** — Apple-inspired monochrome trading workspace. Pure white canvas, near-black ink, generous rounded surfaces, and soft elevation shadows. Calm, focused, and effortless — the opposite of the prior neon terminal.

## Tone

Refined minimalism: quiet confidence, generous whitespace, system-typographic precision. Every element earns its place. No glow, no noise — just clarity.

## Differentiation

A pure black-and-white trading interface that feels like a native macOS app on the web — system fonts, rounded-xl cards, hairline borders, and layered elevation instead of decoration. Memorable because of its restraint.

## Color Palette

| Token        | OKLCH      | Role                                |
| ------------ | ---------- | ----------------------------------- |
| background   | 1 0 0      | Pure white canvas                   |
| foreground   | 0.21 0 0   | Near-black ink                      |
| card         | 0.99 0 0   | Card surface (off-white)            |
| primary      | 0.21 0 0   | Primary buttons, active states      |
| secondary    | 0.96 0 0   | Secondary buttons, subtle fills     |
| muted        | 0.96 0 0   | Muted backgrounds                   |
| accent       | 0.93 0 0   | Hover fills, selected rows          |
| destructive  | 0.4 0 0    | Destructive actions (dark grey)      |
| border       | 0.9 0 0    | 1px hairline borders                |
| surface-1..5 | 1 → 0.9    | 5 greyscale steps for surfaces      |
| chart.area   | 0.21 0 0   | Equity curve fill (black)           |
| chart.dd     | 0.75 0 0   | Drawdown zone tint (light grey)     |

## Typography

- Display & Body: **SF Pro / system-ui stack** — `-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif`. No bundled fonts; rely on the OS for native feel.
- Mono: `ui-monospace, 'SF Mono', Menlo, monospace` — only for tabular numbers and code.
- Scale: hero 28-32px semibold (-0.02em tracking), h2 20px semibold, label 12px medium, body 14-15px regular, metric value 22-26px semibold.

## Elevation & Depth

Depth through layered soft shadows, not glow. Three tiers: `shadow-subtle` (resting), `shadow-card` (cards), `shadow-elevated` (hover/popovers). Focus uses a 4px dark ring at 8% opacity. Borders are 1px hairlines in `--border` (0.9 lightness).

## Structural Zones

| Zone           | Background | Border         | Notes                                       |
| -------------- | ---------- | -------------- | ------------------------------------------- |
| Header         | surface-2  | border-b       | Sticky; app title left, nav center, actions right |
| Sidebar        | surface-2  | border-r       | 240px; rounded active item, hairline divider |
| Content        | background | —              | Centered max-width 1280px; generous padding  |
| Footer         | surface-3  | border-t       | Subtle status row, muted text               |
| Cards          | card       | 1px border     | rounded-xl + shadow-card; hover → elevated   |
| Metric cards   | card       | 1px border     | rounded-xl; label muted, value semibold      |
| Trade log rows | —          | —              | Even rows surface-3 stripe; hover surface-4  |
| Config panel   | card       | 1px border     | rounded-2xl; inputs white bg, focus ring     |

## Spacing & Rhythm

Generous Apple-style spacing: section gaps 32-48px, card padding 20-24px, grid gaps 16-20px. Content max-width 1280px, centered. Metric summary grid: 2-col, 16px gap. Trade log: 12px row padding, 16px column padding.

## Component Patterns

- **Buttons**: Primary = black bg + white text, rounded-xl; Secondary = surface-3 bg + ink text + 1px border; Destructive = dark grey bg. Hover: subtle darken + shadow-subtle. All 14px medium.
- **Cards**: surface-2 bg, 1px border, rounded-xl, shadow-card. Hover: border darkens, shadow-elevated.
- **Metric cards**: Card style; muted 12px label; 22-26px semibold value; optional muted sub-label. Sign encoded by font-weight (positive 600, negative 500), not color.
- **Equity curve**: Card panel; black area fill gradient (18% → 0%); light grey grid (60% opacity); drawdown zones light grey tint; axis labels 10px muted.
- **Trade log table**: Card panel; 12px medium headers; tabular-nums values; even-row stripe; hover surface-4. Direction badges: filled black (LONG) / outlined grey (SHORT).
- **Config form**: Card panel; 12px medium labels; inputs white bg + 1px border; focus = dark border + 4px focus ring.
- **Badges**: Rounded-full, 12px medium — filled black (active/win), outlined grey (open/pending), dark grey (loss).

## Motion

- **Entrance**: fade-in 0.3s with 4px upward translate on panel mount.
- **Hover**: shadow elevation tier-up + border darken, 0.2s ease-apple.
- **Focus**: 4px dark ring at 8% opacity, 0.15s.
- **No decoration**: no scanlines, no blink, no flicker, no sweep, no pulse, no glow. Restraint is the aesthetic.

## Constraints

- Pure monochrome — zero chroma anywhere (`C = 0` on every token). No color utilities.
- Generous border-radius: `--radius: 1rem` (16px); cards rounded-xl, panels rounded-2xl.
- System font stack only — no bundled font files; rely on `-apple-system` / `system-ui`.
- All colors via OKLCH tokens — no hardcoded hex or rgb in components.
- Soft elevation shadows only — no glow, no neon, no text-shadow.
- Charts monochrome: black area, light grey grid, grey drawdown zones.
- Sign encoded by font-weight, never by color.

## Signature Detail

**Native macOS feel on the web** — system-typographic, pure black-on-white, rounded-xl cards floating on soft layered shadows with 1px hairline borders. The absence of color forces hierarchy through weight, spacing, and elevation, producing a trading workspace that feels calm, premium, and effortless to use.

## Backtesting Page Layout

- **Top**: Config form card (asset, timeframe, date range, strategy params) — rounded-2xl, collapsible, dark-focus inputs.
- **Middle-left (2/3)**: Equity curve card — black area fill, light grey grid, grey drawdown zones, muted axis.
- **Middle-right (1/3)**: Metrics summary grid — 8 metric cards (total return, win rate, Sharpe, Sortino, max DD, profit factor, avg win, avg loss) in 2-col grid.
- **Bottom**: Trade log card — full-width, scrollable, striped rows, direction badges, hover surface-4.
