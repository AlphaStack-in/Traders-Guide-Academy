"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Realtime, type Message } from "ably";
import { Bell, ChevronDown } from "lucide-react";
import { getRecentAdminUpdates } from "@/app/admin/(protected)/signals/actions";
import { useSoundAlert } from "@/components/site/sound-alert-provider";
import {
  ADMIN_UPDATES_CHANNEL,
  ADMIN_UPDATE_EVENT,
  type AdminUpdatePushPayload,
} from "@/lib/ably-shared";
import { formatInstrumentLabel, type InstrumentValue } from "@/lib/instruments";
import { cn, formatUpdateTime } from "@/lib/utils";
import type { OrderBroker } from "@/lib/client-config";
import { PlaceOrderTrigger } from "@/components/account/place-order-trigger";
import { OrderExpansionPanel } from "@/components/account/order-expansion-panel";

const CLEARED_AT_KEY = "signalflow-notifications-cleared-at";
const READ_IDS_KEY = "signalflow-notifications-read-ids";
const READ_IDS_CAP = 500;
const MARK_READ_DELAY_MS = 1500;
// Instant delivery now comes from the Ably subscription set up below --
// this poll is just a reconciliation safety net for the rare case a
// push is missed (a brief disconnect, or ABLY_API_KEY not configured
// at all, e.g. a fresh local clone), so it can afford to be slow.
const POLL_INTERVAL_MS = 45_000;

interface UpdateItem {
  id: string;
  // Null for a general broadcast update posted with no specific signal
  // attached (see postGeneralAdminUpdate) — grouped together under a
  // synthetic "general" key by groupBySignal below, since there's no real
  // per-signal identity to group them by.
  signalId: string | null;
  strike: number | null;
  optionType: string | null;
  instrument: InstrumentValue | null;
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

const GENERAL_GROUP_KEY = "general";

function groupBySignal(items: UpdateItem[], readIds: Set<string>): SignalGroup[] {
  const order: string[] = [];
  const bySignal = new Map<string, UpdateItem[]>();
  for (const item of items) {
    const key = item.signalId ?? GENERAL_GROUP_KEY;
    if (!bySignal.has(key)) {
      order.push(key);
      bySignal.set(key, []);
    }
    bySignal.get(key)!.push(item);
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
  if (item.signalId == null) return "General Update";
  const label = formatInstrumentLabel(item.instrument);
  return `${label ? `${label} ` : ""}${item.strike} ${item.optionType}`;
}

export function NotificationBell({
  activeBroker = null,
  notificationsEnabled = true,
}: {
  activeBroker?: OrderBroker | null;
  // Subscriber's own "Notification bell alerts" preference (see
  // /account/settings) — false suppresses sound alerts, auto-open, and the
  // instant Ably push subscription, but the bell still shows past updates
  // when opened manually and the ~45s poll still keeps its contents fresh.
  notificationsEnabled?: boolean;
}) {
  const ORDER_BROKER = activeBroker;
  const { playUpdateAlert } = useSoundAlert();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [orderExpanded, setOrderExpanded] = useState<Set<string>>(new Set());
  const [clearedAt, setClearedAt] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  // null until the first poll completes — used to tell "first load" (seed
  // silently, no sound) apart from "actually new since last poll".
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Stable (empty deps besides playUpdateAlert, itself stable) so the poll
  // effect below doesn't need to re-run every time this identity would
  // otherwise change.
  const load = useCallback(async () => {
    const data = await getRecentAdminUpdates();
    setUpdates(data);

    if (seenIdsRef.current === null) {
      // First load — seed silently. Nothing here is actually "new".
      seenIdsRef.current = new Set(data.map((u) => u.id));
      return;
    }

    const hasNew = data.some((u) => !seenIdsRef.current!.has(u.id));
    data.forEach((u) => seenIdsRef.current!.add(u.id));

    if (hasNew) {
      if (notificationsEnabled) {
        playUpdateAlert();
        if (!openRef.current) {
          setOpen(true);
        }
      }
      // The "Admin Updates" panel on /signals and /admin/signals
      // (OngoingSignals) is rendered server-side from a prop and has no
      // poll of its own — refresh the current route so a brand-new
      // AdminUpdate row shows up there too, not just in this dropdown.
      router.refresh();
    }
  }, [playUpdateAlert, router, notificationsEnabled]);

  useEffect(() => {
    setClearedAt(localStorage.getItem(CLEARED_AT_KEY));
    setReadIds(loadReadIds());
    load();
  }, [load]);

  // load() itself diffs the polled list against what it saw last time to
  // decide whether to play a sound / auto-open the panel — the Ably push
  // effect below does the equivalent diff for a single incoming message.
  useEffect(() => {
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Instant push: every admin action that creates an AdminUpdate row
  // (see the publishAdminUpdate() call sites in signals/actions.ts and
  // subscribers/actions.ts) also publishes it on this Ably channel. The
  // token comes from /api/ably-auth so the real API key never reaches the
  // browser (see src/lib/ably.ts) — if ABLY_API_KEY isn't configured that
  // endpoint 503s, Ably's client just keeps retrying quietly in the
  // background, and the poll above is what actually delivers updates.
  useEffect(() => {
    // Off means no proactive alerting at all — don't even open the Ably
    // connection. The bell still works on manual open via the poll above.
    if (!notificationsEnabled) return;

    let cancelled = false;
    const client = new Realtime({ authUrl: "/api/ably-auth", authMethod: "GET" });
    const channel = client.channels.get(ADMIN_UPDATES_CHANNEL);

    function handlePush(msg: Message) {
      if (cancelled) return;
      const payload = msg.data as AdminUpdatePushPayload;

      // Only mark it "seen" for the poll's own diffing once that poll has
      // actually seeded itself — otherwise a push that lands before the
      // very first load() would make that first load wrongly treat every
      // pre-existing update as new (see load()'s null-check above).
      if (seenIdsRef.current !== null) {
        seenIdsRef.current.add(payload.id);
      }

      setUpdates((prev) =>
        prev.some((u) => u.id === payload.id)
          ? prev
          : [
              {
                id: payload.id,
                signalId: payload.signalId,
                strike: payload.strike,
                optionType: payload.optionType,
                instrument: payload.instrument as InstrumentValue | null,
                message: payload.message,
                createdAt: payload.createdAt,
              },
              ...prev,
            ],
      );

      playUpdateAlert();
      if (!openRef.current) {
        setOpen(true);
      }
      // Keeps the server-rendered "Admin Updates" panel (OngoingSignals)
      // in sync the instant a push arrives too — see the matching call in
      // load() above for why that panel needs this at all.
      router.refresh();
    }

    channel.subscribe(ADMIN_UPDATE_EVENT, handlePush);

    return () => {
      cancelled = true;
      channel.unsubscribe(ADMIN_UPDATE_EVENT, handlePush);
      client.close();
    };
  }, [playUpdateAlert, router, notificationsEnabled]);

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

  // Sends the user to wherever this notification actually lives — the
  // public Trade Log's Admin Updates panel, or the admin equivalent
  // when the bell is opened from inside /admin — since there is no
  // dedicated per-signal detail page today.
  function handleNotificationClick() {
    setOpen(false);
    const base = pathname?.startsWith("/admin") ? "/admin/signals" : "/signals";
    router.push(`${base}#admin-updates`);
  }

  function handleClear() {
    const now = new Date().toISOString();
    localStorage.setItem(CLEARED_AT_KEY, now);
    setClearedAt(now);
  }

  function toggleOrderExpanded(signalId: string) {
    setOrderExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(signalId)) next.delete(signalId);
      else next.add(signalId);
      return next;
    });
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
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--signalflow-loss)] px-1 text-[9px] font-bold text-black">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="signalflow-glass absolute right-0 top-11 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-white/10 p-3 shadow-xl sm:w-96"
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
                        {/* Clicking the notification itself navigates to
                            where it actually lives; the chevron is its own
                            control (stopPropagation) so it only expands the
                            thread instead of also navigating away. */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={handleNotificationClick}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleNotificationClick();
                            }
                          }}
                          className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
                        >
                          <span className="flex items-center gap-1.5 font-heading font-normal signalflow-gold-text">
                            {isUnread && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signalflow-loss)]" />
                            )}
                            {signalLabel(group.latest)}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                            {formatUpdateTime(group.latest.createdAt)}
                            {group.messages.length > 1 && (
                              <button
                                type="button"
                                aria-label={isExpanded ? "Collapse messages" : "Expand messages"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(group.signalId);
                                }}
                                className="rounded p-0.5 hover:bg-white/10"
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3 transition-transform",
                                    isExpanded && "rotate-180",
                                  )}
                                />
                              </button>
                            )}
                          </span>
                        </div>
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
                                    {formatUpdateTime(m.createdAt)}
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
                        {ORDER_BROKER && group.latest.signalId != null && (
                          <div className="mt-2 flex flex-col gap-2">
                            <div className="flex justify-end">
                              <PlaceOrderTrigger
                                signalId={group.signalId}
                                brokerType={ORDER_BROKER}
                                expanded={orderExpanded.has(group.signalId)}
                                onToggle={() => toggleOrderExpanded(group.signalId)}
                              />
                            </div>
                            {orderExpanded.has(group.signalId) && (
                              <OrderExpansionPanel signalId={group.signalId} brokerType={ORDER_BROKER} />
                            )}
                          </div>
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
