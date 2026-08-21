"use client";

import { AlarmClock, AlarmClockOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundAlert } from "@/components/site/sound-alert-provider";

export function SoundAlertToggle() {
  const { enabled, justAlerted, toggle } = useSoundAlert();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={
        enabled
          ? "Sound alerts on — click to mute"
          : "Click to get a sound alert whenever admin posts or updates a signal"
      }
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
        enabled
          ? "border-[var(--signalflow-win)]/50 bg-[var(--signalflow-win)]/10 text-[var(--signalflow-win)]"
          : "border-white/10 text-muted-foreground hover:text-foreground",
        justAlerted && "animate-pulse",
      )}
    >
      {enabled ? <AlarmClock className="h-4 w-4" /> : <AlarmClockOff className="h-4 w-4" />}
    </button>
  );
}
