"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function IstClock() {
  const [timeStr, setTimeStr] = useState<string | null>(null);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const formatted = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setTimeStr(`IST ${formatted}`);
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary shadow-sm"
    >
      <Clock className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
      <span>{timeStr || "IST --:--:-- --"}</span>
    </div>
  );
}
