"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { getRecentAdminUpdates } from "@/app/admin/(protected)/signals/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSoundAlert } from "@/components/site/sound-alert-provider";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";
import { cn } from "@/lib/utils";

const CLEARED_AT_KEY = "thc-notifications-cleared-at";
const READ_IDS_KEY = "thc-notifications-read-ids";
const READ_IDS_CAP = 500;
const MARK_READ_DELAY_MS = 1500;

interface UpdateItem {
  id: string;
  signalId: string;
  strike: number;
  optionType: string;
  instrument: InstrumentLiteral | null;
  message: string;
  createdAt: string;
}

interface SignalGroup {
  signalId: string;
  latest: UpdateItem;
  messages: UpdateItem[]; // newest first
  unreadCount: number;
}

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  const arr = Array.from(ids);
  const trimmed = arr.length > READ_IDS_CAP ? arr.slice(arr.length - READ_IDS_CAP) : arr;
  localStorage.setItem(READ_IDS_KEY, JSON.stringify(trimmed));
}

const IST = "Asia/Kolkata";

// Pinned to IST explicitly (not the runtime's local timezone) so this
// renders identically during SSR and client hydration regardless of
// server/browser timezone — otherwise a UTC server vs. IST browser can
// format the same instant differently and trip a hydration mismatch.
function istDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: IST }); // YYYY-MM-DD, stable to compare
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (istDateKey(date) === istDateKey(today)) return "Today";
  if (istDateKey(date) === istDateKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST,
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: IST,
  });
}

function groupBySignal(items: UpdateItem[], readIds: Set<string>): SignalGroup[] {
  const order: string[] = [];
  const bySignal = new Map<string, UpdateItem[]>();
  for (const item of items) {
    if (!bySignal.has(item.signalId)) {
      order.push(item.signalId);
      bySignal.set(item.signalId, []);
    }
    bySignal.get(item.signalId)!.push(item);
  }
  return order.map((signalId) => {
    const newestFirst = bySignal.get(signalId)!;
    return {
      signalId,
      latest: newestFirst[0],
      messages: newestFirst,
      unreadCount: newestFirst.filter((u) => !readIds.has(u.id)).length,
    };
  });
}

function signalLabel(item: UpdateItem) {
  return `${item.instrument ? `${INSTRUMENT_LABEL[item.instrument]} ` : ""}${item.strike} ${item.optionType}`;
}

export function NotificationBell() {
  const { playUpdateAlert } = useSoundAlert();
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Stable (empty deps) so the realtime effect below doesn't need to
  // resubscribe every time this identity would otherwise change.
  const load = useCallback(async () => {
    const data = await getRecentAdminUpdates();
    setUpdates(data);
  }, []);

  useEffect(() => {
    setClearedAt(localStorage.getItem(CLEARED_AT_KEY));
    setReadIds(loadReadIds());
    load();
  }, [load]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("admin-update-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "AdminUpdate" },
        () => {
          // Re-fetch from the server rather than splicing the payload into
          // local state — updateAdminNote() also writes Signal.adminNote,
          // which fires sound-alert-provider's separate Signal-table
          // listener and triggers router.refresh(). That refresh re-renders
          // the async Navbar this component lives under, which can reset
          // local state out from under a manually-spliced update. A fresh
          // fetch is correct regardless of what else remounts around it.
          load();
          playUpdateAlert();
          if (!openRef.current) {
            setOpen(true);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "AdminUpdate" },
        () => {
          // Fires when a signal is deleted from Manage Signals (its
          // AdminUpdate rows get deleted alongside it) — no sound/auto-open,
          // just drop the removed entries from the panel.
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playUpdateAlert, load]);

  // Whatever's loaded while the panel is open fades from unread to read
  // shortly after — long enough to actually notice the highlight first.
  useEffect(() => {
    if (!open || updates.length === 0) return;
    const timer = setTimeout(() => {
      setReadIds((prev) => {
        let changed = false;
        const next = new Set(prev);
        for (const u of updates) {
          if (!next.has(u.id)) {
            next.add(u.id);
            changed = true;
          }
        }
        if (changed) persistReadIds(next);
        return changed ? next : prev;
      });
    }, MARK_READ_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, updates]);

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
    if (next) load();
  }

  function handleClear() {
    const now = new Date().toISOString();
    localStorage.setItem(CLEARED_AT_KEY, now);
    setClearedAt(now);
  }

  function toggleExpanded(signalId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(signalId)) next.delete(signalId);
      else next.add(signalId);
      return next;
    });
  }

  const clearedAtTime = clearedAt ? new Date(clearedAt).getTime() : 0;
  const visibleUpdates = updates.filter((u) => new Date(u.createdAt).getTime() > clearedAtTime);
  const groups = useMemo(() => groupBySignal(visibleUpdates, readIds), [visibleUpdates, readIds]);
  const totalUnread = groups.reduce((sum, g) => sum + g.unreadCount, 0);

  function dayGroups(items: SignalGroup[]) {
    const out: { label: string; items: SignalGroup[] }[] = [];
    for (const item of items) {
      const label = dayLabel(item.latest.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(item);
      else out.push({ label, items: [item] });
    }
    return out;
  }

  const dayed = dayGroups(groups);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--thc-loss)] px-1 text-[9px] font-bold text-white">
            {totalUnread > 9 ? "9+" : totalUnread}
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
            {groups.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Clear
              </button>
            )}
          </div>
          {dayed.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No updates yet — they&apos;ll show up here as trades are updated.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {dayed.map((day) => (
                <div key={day.label} className="flex flex-col gap-2">
                  <p className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
                    {day.label}
                  </p>
                  {day.items.map((group) => {
                    const isExpanded = expanded.has(group.signalId);
                    const isUnread = group.unreadCount > 0;
                    return (
                      <div
                        key={group.signalId}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-xs transition-colors",
                          isUnread
                            ? "border-primary/40 bg-primary/10"
                            : "border-primary/15 bg-primary/5",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(group.signalId)}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <span className="flex items-center gap-1.5 font-heading font-normal thc-gold-text">
                            {isUnread && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--thc-loss)]" />
                            )}
                            {signalLabel(group.latest)}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                            {timeLabel(group.latest.createdAt)}
                            {group.messages.length > 1 && (
                              <ChevronDown
                                className={cn(
                                  "h-3 w-3 transition-transform",
                                  isExpanded && "rotate-180",
                                )}
                              />
                            )}
                          </span>
                        </button>
                        {isExpanded ? (
                          <div className="mt-2 flex flex-col gap-2 border-l border-white/10 pl-2">
                            {group.messages.map((m) => (
                              <div
                                key={m.id}
                                className={cn(
                                  "rounded-lg px-2 py-1",
                                  !readIds.has(m.id) && "bg-primary/10",
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="whitespace-pre-line text-foreground/90">
                                    {m.message}
                                  </span>
                                  <span className="shrink-0 text-[10px] text-muted-foreground">
                                    {timeLabel(m.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 whitespace-pre-line text-foreground/90">
                            {group.latest.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
