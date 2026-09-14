import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared presentational building blocks for the "My Subscriptions" terminal
 * dashboard (src/app/account/subscriptions/page.tsx and its section
 * components). Pulled out once all five section cards converged on the same
 * dense, bordered-card-with-header look, so the visual language (borders,
 * spacing, stat tiles, the plan progress ring) lives in one place instead of
 * being copy-pasted five times. Purely presentational — no data fetching or
 * business logic here, see lib/subscriptions.ts for that.
 */

const ACCENT_BORDER_CLASS = {
  primary: "signalflow-primary-border",
  gold: "signalflow-gold-border",
  neutral: "signalflow-neutral-border",
  win: "signalflow-win-border",
  loss: "signalflow-loss-border",
  none: "",
} as const;

export type CardAccent = keyof typeof ACCENT_BORDER_CLASS;

interface TerminalCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Small icon swatch to the left of the title, e.g. an emoji or lucide icon. */
  icon?: ReactNode;
  /** Right-aligned badge/status, e.g. "Live", "1 Enrolled". */
  badge?: ReactNode;
  /** Right-aligned action(s) rendered instead of `badge` when both don't fit (e.g. Cancel Autopay). */
  action?: ReactNode;
  accent?: CardAccent;
  /** Compact = p-4 (dense terminal cards); default = p-5 (matches the original single-column cards). */
  padding?: "default" | "compact";
  className?: string;
  children: ReactNode;
}

export function TerminalCard({
  title,
  subtitle,
  icon,
  badge,
  action,
  accent = "neutral",
  padding = "default",
  className,
  children,
}: TerminalCardProps) {
  return (
    <div
      className={cn(
        "signalflow-glass relative flex flex-col gap-3 overflow-hidden rounded-2xl border",
        padding === "compact" ? "p-4" : "p-5",
        ACCENT_BORDER_CLASS[accent],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon && (
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-heading text-base font-bold leading-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {(badge || action) && <div className="shrink-0">{badge ?? action}</div>}
      </div>
      {children}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "win" | "loss" | "gold" | "primary";
  className?: string;
}

const TONE_CLASS: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-foreground",
  win: "text-[var(--signalflow-win)]",
  loss: "text-[var(--signalflow-loss)]",
  gold: "signalflow-gold-text",
  primary: "text-primary",
};

/** One metric tile in a stat-tile row (e.g. Total Value / Contributed / Growth). */
export function StatTile({ label, value, sub, tone = "default", className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-3",
        className,
      )}
    >
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className={cn("mt-1 font-heading text-xl font-extrabold tracking-tight", TONE_CLASS[tone])}>
        {value}
      </div>
      {sub && <span className="mt-1 block text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

interface ProgressRingProps {
  /** 0-100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Defaults to `${percent}%`. */
  label?: ReactNode;
  color?: string;
}

/** Small circular progress indicator — used for "how far through the current billing period" on the Plan & Billing card. */
export function ProgressRing({ percent, size = 48, strokeWidth = 3.5, label, color = "var(--primary)" }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 36 36" className="-rotate-90">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-white">
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
}

/** Small uppercase eyebrow badge, e.g. "Active", "Live". */
export function EyebrowBadge({
  children,
  tone = "primary",
  pulse = false,
}: {
  children: ReactNode;
  tone?: "primary" | "win" | "gold" | "muted";
  pulse?: boolean;
}) {
  const toneClass: Record<string, string> = {
    primary: "bg-primary/15 text-primary border-primary/30",
    win: "bg-[var(--signalflow-win)]/10 text-[var(--signalflow-win)] border-[var(--signalflow-win)]/30",
    gold: "bg-[var(--signalflow-gold-start)]/15 text-[var(--signalflow-gold-end)] border-[var(--signalflow-gold-start)]/30",
    muted: "bg-white/5 text-muted-foreground border-white/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        toneClass[tone],
      )}
    >
      {pulse && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            tone === "primary" && "bg-primary",
            tone === "win" && "bg-[var(--signalflow-win)]",
            tone === "gold" && "bg-[var(--signalflow-gold-start)]",
            tone === "muted" && "bg-muted-foreground",
          )}
        />
      )}
      {children}
    </span>
  );
}
