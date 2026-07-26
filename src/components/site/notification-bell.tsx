"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { getRecentAdminUpdates } from "@/app/admin/(protected)/signals/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

const STORAGE_KEY = "thc-notifications-last-seen";
const CLEARED_AT_KEY = "thc-notifications-cleared-at";

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
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  async function load() {
    const data = await getRecentAdminUpdates();
    setUpdates(data);

    const lastSeen = localStorage.getItem(STORAGE_KEY);
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
    setUnreadCount(data.filter((u) => new Date(u.createdAt).getTime() > lastSeenTime).length);
  }

  useEffect(() => {
    setClearedAt(localStorage.getItem(CLEARED_AT_KEY));
    load();
  }, []);

  // Each admin update is its own row (see getRecentAdminUpdates), so a new
  // one always arrives as a brand-new entry here — never merged into a
  // previous message — and pushes instantly via realtime instead of waiting
  // for the bell to be reopened.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("admin-update-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "AdminUpdate" },
        (payload) => {
          const row = payload.new as {
            id: string;
            strike: number;
            optionType: string;
            instrument: InstrumentLiteral | null;
            message: string;
            createdAt: string;
          };
          const item: UpdateItem = {
            id: row.id,
            strike: row.strike,
            optionType: row.optionType,
            instrument: row.instrument,
            message: row.message,
            createdAt: row.createdAt,
          };
          setUpdates((prev) => (prev.some((u) => u.id === item.id) ? prev : [item, ...prev]));
          if (!openRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  function handleClear() {
    const now = new Date().toISOString();
    localStorage.setItem(CLEARED_AT_KEY, now);
    setClearedAt(now);
  }

  const clearedAtTime = clearedAt ? new Date(clearedAt).getTime() : 0;
  const visibleUpdates = updates.filter((u) => new Date(u.createdAt).getTime() > clearedAtTime);
  const groups = groupByDay(visibleUpdates);

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
        <div
          className="thc-glass absolute right-0 top-11 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-white/10 p-3 shadow-xl sm:w-96"
          style={{ background: "color-mix(in oklab, var(--card) 97%, transparent)" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="font-heading text-sm font-normal">Updates from Admin</p>
            {visibleUpdates.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Clear
              </button>
            )}
          </div>
          {groups.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No updates yet — they&apos;ll show up here as trades are updated.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <div key={group.label} className="flex flex-col gap-2">
                  <p className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-heading font-normal thc-gold-text">
                          {item.instrument ? `${INSTRUMENT_LABEL[item.instrument]} ` : ""}
                          {item.strike} {item.optionType}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-foreground/90">{item.message}</p>
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
