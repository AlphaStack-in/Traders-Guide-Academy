"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRecentSignalAlerts, type SignalAlertRow } from "@/lib/signal-alerts";
import { inferHitTargetLabel } from "@/lib/signal-metrics";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";
import {
  TradeAlertOverlay,
  type CelebrationEvent,
  type SlHitEvent,
} from "@/components/site/trade-alert-overlay";

const STORAGE_KEY = "signalflow-sound-alerts-enabled";
// How recently a signal's closedTime must be for this UPDATE event to count
// as "just closed" rather than a later edit to an already-closed trade —
// same window convention as the existing silentUpdateAt check below.
const RECENT_CLOSE_WINDOW_MS = 10_000;
// Was an instant Supabase Realtime push; now a periodic poll against
// getRecentSignalAlerts(), diffed client-side against the last poll.
const POLL_INTERVAL_MS = 20_000;

function playAlertTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [660, 880, 1320];
  const noteGap = 0.14;
  const noteDuration = 0.18;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const start = now + i * noteGap;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.4, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration + 0.02);
  });
}

// Bigger, more distinct chime for a brand-new signal entry — a wider
// ascending arpeggio at a louder gain than the regular update blip, so a
// fresh call reads as a bigger deal than an in-progress note edit.
function playNewSignalTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 784, 1046.5, 1318.5];
  const noteGap = 0.11;
  const noteDuration = 0.32;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const start = now + i * noteGap;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.55, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration + 0.02);
  });
}

// Bright ascending flourish for a closed trade hitting its target — distinct
// from playNewSignalTone so "a fresh call arrived" and "a call paid off"
// don't sound the same.
function playCelebrationTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 784, 1046.5, 1318.5, 1567.98];
  const noteGap = 0.1;
  const noteDuration = 0.3;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const start = now + i * noteGap;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.5, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration + 0.02);
  });
}

// Soft, quiet two-note descent for a stop-loss hit — deliberately muted
// rather than harsh, since this is a real-money loss notification.
function playSlHitTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes = [392, 329.63];
  const noteGap = 0.18;
  const noteDuration = 0.32;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * noteGap;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + noteDuration + 0.02);
  });
}

function signalLabelOf(row: {
  instrument?: InstrumentLiteral | null;
  strike?: number;
  optionType?: string;
}) {
  const prefix = row.instrument ? `${INSTRUMENT_LABEL[row.instrument]} ` : "";
  return `${prefix}${row.strike ?? ""} ${row.optionType ?? ""}`.trim();
}

interface SoundAlertContextValue {
  enabled: boolean;
  justAlerted: boolean;
  toggle: () => void;
  playUpdateAlert: () => void;
}

const SoundAlertContext = createContext<SoundAlertContextValue | null>(null);

export function SoundAlertProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [justAlerted, setJustAlerted] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationEvent | null>(null);
  const [slHitAlert, setSlHitAlert] = useState<SlHitEvent | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    // Sound alerts default to on for every visitor; only an explicit past
    // toggle-off ("false") should keep them muted on return visits.
    const shouldEnable = localStorage.getItem(STORAGE_KEY) !== "false";
    setEnabled(shouldEnable);
    if (shouldEnable && !audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
  }, []);

  useEffect(() => {
    // A freshly created AudioContext starts "suspended" until a user
    // gesture — this covers sound restored from a previous visit, where
    // there's no fresh toggle click to satisfy the browser's autoplay policy.
    function resumeOnInteraction() {
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    }
    document.addEventListener("click", resumeOnInteraction);
    document.addEventListener("keydown", resumeOnInteraction);
    return () => {
      document.removeEventListener("click", resumeOnInteraction);
      document.removeEventListener("keydown", resumeOnInteraction);
    };
  }, []);

  // Always polling, independent of the sound toggle — refreshes whatever
  // page is currently open so new/updated signals show up, with sound as an
  // opt-in layer on top rather than a requirement for live content.
  //
  // Was an instant Supabase Realtime push ("postgres_changes" on Signal);
  // now a periodic poll against getRecentSignalAlerts(), diffed against
  // seenRef (this component's memory of what it saw last poll) to infer
  // the same INSERT-vs-UPDATE distinction Realtime used to hand us directly.
  // null seenRef means "haven't polled yet" — the first poll seeds it
  // silently so pre-existing signals don't all fire alerts on page load.
  const seenRef = useRef<Map<string, { status: string; updatedAt: string }> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const rows = await getRecentSignalAlerts();
      if (cancelled) return;

      if (seenRef.current === null) {
        seenRef.current = new Map(rows.map((r) => [r.id, { status: r.status, updatedAt: r.updatedAt }]));
        return;
      }

      let changed = false;

      for (const row of rows) {
        const prev = seenRef.current.get(row.id);
        seenRef.current.set(row.id, { status: row.status, updatedAt: row.updatedAt });

        if (!prev) {
          // Wasn't in our last poll at all — a brand-new signal (INSERT).
          changed = true;
          if (enabledRef.current && audioCtxRef.current) {
            playNewSignalTone(audioCtxRef.current);
            setJustAlerted(true);
            setTimeout(() => setJustAlerted(false), 1500);
          }
          continue;
        }

        if (prev.updatedAt === row.updatedAt) continue; // unchanged since last poll

        changed = true;

        // A plain edit from the Manage Signals table sets silentUpdateAt
        // right before this fires — skip the sound (but still refresh) so
        // correcting a field doesn't buzz every subscriber's device.
        const isSilentEdit =
          !!row.silentUpdateAt && Date.now() - new Date(row.silentUpdateAt).getTime() < 10_000;
        if (isSilentEdit) continue;

        const closedRecently =
          !!row.closedTime && Date.now() - new Date(row.closedTime).getTime() < RECENT_CLOSE_WINDOW_MS;

        if (closedRecently && row.status === "TARGET_HIT" && row.sellPrice != null) {
          const signalLabel = signalLabelOf(row);
          const targetLabel = inferHitTargetLabel(row.targets ?? [], row.sellPrice);
          const pnlPercent = row.pnlPercent ?? 0;
          const pnlText = `${pnlPercent > 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`;

          setCelebration({ key: row.updatedAt, signalLabel, targetLabel, pnlPercent });
          setTimeout(() => setCelebration(null), 3000);

          toast.success(
            `Target Hit${targetLabel ? ` (${targetLabel})` : ""}! ${pnlText} gain on ${signalLabel}`,
          );

          if (enabledRef.current && audioCtxRef.current) {
            playCelebrationTone(audioCtxRef.current);
          }
          continue;
        }

        if (closedRecently && row.status === "SL_HIT" && row.sellPrice != null) {
          const signalLabel = signalLabelOf(row);

          setSlHitAlert({ key: row.updatedAt, signalLabel, sellPrice: row.sellPrice });
          setTimeout(() => setSlHitAlert(null), 2500);

          toast.warning(`Stop Loss Hit — ${signalLabel} closed at ${row.sellPrice}`);

          if (enabledRef.current && audioCtxRef.current) {
            playSlHitTone(audioCtxRef.current);
          }
          continue;
        }

        if (enabledRef.current && audioCtxRef.current) {
          playAlertTone(audioCtxRef.current);
          setJustAlerted(true);
          setTimeout(() => setJustAlerted(false), 1500);
        }
      }

      if (changed) {
        router.refresh();
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(STORAGE_KEY, String(next));

    if (next) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      playAlertTone(audioCtxRef.current);
    }
  }

  // Callable from anywhere (e.g. NotificationBell's own AdminUpdate poll)
  // so admin-note updates get sound without this component running its own
  // separate poll just to play a tone. Fails silently if sound is off or the
  // AudioContext hasn't been created/resumed yet.
  //
  // Wrapped in useCallback with no deps — it only ever reads from refs, so
  // it must stay referentially stable. NotificationBell depends on this
  // identity inside its own poll effect; letting it change on every render
  // (e.g. every time justAlerted flips) would re-run that effect's setup on
  // every single alert and could cause the panel's message list to lag
  // behind the sound.
  const playUpdateAlert = useCallback(() => {
    if (!enabledRef.current || !audioCtxRef.current) return;
    if (audioCtxRef.current.state === "suspended") return;
    playAlertTone(audioCtxRef.current);
    setJustAlerted(true);
    setTimeout(() => setJustAlerted(false), 1500);
  }, []);

  return (
    <SoundAlertContext.Provider value={{ enabled, justAlerted, toggle, playUpdateAlert }}>
      {children}
      <TradeAlertOverlay celebration={celebration} slHitAlert={slHitAlert} />
    </SoundAlertContext.Provider>
  );
}

export function useSoundAlert() {
  const ctx = useContext(SoundAlertContext);
  if (!ctx) {
    throw new Error("useSoundAlert must be used within a SoundAlertProvider");
  }
  return ctx;
}
