interface LiveIndicatorProps {
  label?: string;
  /** Visual tone — all rendered in monochrome via design tokens. */
  tone?: "default" | "muted" | "warning" | "danger";
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
}

const toneMap: Record<
  NonNullable<LiveIndicatorProps["tone"]>,
  { dot: string; text: string }
> = {
  default: { dot: "bg-foreground", text: "text-foreground" },
  muted: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
  warning: { dot: "bg-warning", text: "text-warning" },
  danger: { dot: "bg-destructive", text: "text-destructive" },
};

const sizeMap = {
  xs: { dot: "w-1.5 h-1.5", text: "text-[10px]", gap: "gap-1" },
  sm: { dot: "w-2 h-2", text: "text-xs", gap: "gap-1.5" },
  md: { dot: "w-2.5 h-2.5", text: "text-sm", gap: "gap-2" },
};

export function LiveIndicator({
  label = "LIVE",
  tone = "default",
  pulse = true,
  size = "sm",
}: LiveIndicatorProps) {
  const t = toneMap[tone];
  const s = sizeMap[size];

  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      <span className="relative inline-flex flex-shrink-0">
        <span
          className={`${s.dot} ${t.dot} rounded-full inline-block`}
          aria-hidden="true"
        />
        {pulse && (
          <span
            className={`absolute inset-0 ${s.dot} ${t.dot} rounded-full opacity-60 animate-ping`}
            aria-hidden="true"
          />
        )}
      </span>
      {label && (
        <span
          className={`${s.text} ${t.text} font-medium uppercase tracking-wide`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
