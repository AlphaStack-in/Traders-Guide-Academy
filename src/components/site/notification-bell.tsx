"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { getRecentAdminUpdates } from "@/app/admin/(protected)/signals/actions";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

const STORAGE_KEY = "thc-notifications-last-seen";

interface UpdateItem {
  id: string;
  strike: number;
  optionType: string;
  instrument: InstrumentLiteral | null;
  message: string;
  createdAt: string;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function groupByDay(items: UpdateItem[]): { label: string; items: UpdateItem[] }[] {
  const groups: { label: string; items: UpdateItem[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    const data = await getRecentAdminUpdates();
    setUpdates(data);

    const lastSeen = localStorage.getItem(STORAGE_KEY);
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
    setUnreadCount(data.filter((u) => new Date(u.createdAt).getTime() > lastSeenTime).length);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setUnreadCount(0);
    }
  }

  const groups = groupByDay(updates);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--thc-loss)] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="thc-glass absolute right-0 top-11 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-white/10 p-3 shadow-xl sm:w-96">
          <p className="mb-2 font-heading text-sm font-semibold">Updates from Admin</p>
          {groups.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No updates yet — they&apos;ll show up here as trades are updated.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <div key={group.label} className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-white/5 bg-black/20 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading text-xs font-bold thc-gold-text">
                          {item.instrument ? `${INSTRUMENT_LABEL[item.instrument]} ` : ""}
                          {item.strike} {item.optionType}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-foreground/90">{item.message}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
