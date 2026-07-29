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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { inferHitTargetLabel } from "@/lib/signal-metrics";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";
import {
  TradeAlertOverlay,
  type CelebrationEvent,
  type SlHitEvent,
} from "@/components/site/trade-alert-overlay";

const STORAGE_KEY = "thc-sound-alerts-enabled";
// How recently a signal's closedTime must be for this UPDATE event to count
// as "just closed" rather than a later edit to an already-closed trade —
// same window convention as the existing silentUpdateAt check below.
const RECENT_CLOSE_WINDOW_MS = 10_000;

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

  // Always subscribed, independent of the sound toggle — refreshes whatever
  // page is currently open so new/updated signals show up live, with sound
  // as an opt-in layer on top rather than a requirement for live content.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("signal-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Signal" },
        (payload) => {
          router.refresh();

          // A plain edit from the Manage Signals table sets silentUpdateAt
          // right before this fires — skip the sound (but still refresh)
          // so correcting a field doesn't buzz every subscriber's device.
          const silentUpdateAt = (payload.new as { silentUpdateAt?: string } | null)
            ?.silentUpdateAt;
          const isSilentEdit =
            payload.eventType === "UPDATE" &&
            !!silentUpdateAt &&
            Date.now() - new Date(silentUpdateAt).getTime() < 10_000;

          if (isSilentEdit) return;

          const newRow =
            payload.eventType === "UPDATE"
              ? (payload.new as {
                  status?: string;
                  closedTime?: string | null;
                  sellPrice?: number | null;
                  pnlPercent?: number | null;
                  targets?: number[];
                  strike?: number;
                  optionType?: string;
                  instrument?: InstrumentLiteral | null;
                })
              : null;

          const closedRecently =
            !!newRow?.closedTime &&
            Date.now() - new Date(newRow.closedTime).getTime() < RECENT_CLOSE_WINDOW_MS;

          // TEMP DIAGNOSTIC — remove once the trade-alert trigger is confirmed working.
          console.log("[trade-alert-debug]", {
            eventType: payload.eventType,
            newRow,
            closedRecently,
          });

          if (closedRecently && newRow?.status === "TARGET_HIT" && newRow.sellPrice != null) {
            const signalLabel = signalLabelOf(newRow);
            const targetLabel = inferHitTargetLabel(newRow.targets ?? [], newRow.sellPrice);
            const pnlPercent = newRow.pnlPercent ?? 0;
            const pnlText = `${pnlPercent > 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`;

            setCelebration({
              key: `${payload.commit_timestamp}`,
              signalLabel,
              targetLabel,
              pnlPercent,
            });
            setTimeout(() => setCelebration(null), 3000);

            toast.success(
              `Target Hit${targetLabel ? ` (${targetLabel})` : ""}! ${pnlText} gain on ${signalLabel}`,
            );

            if (enabledRef.current && audioCtxRef.current) {
              playCelebrationTone(audioCtxRef.current);
            }
            return;
          }

          if (closedRecently && newRow?.status === "SL_HIT" && newRow.sellPrice != null) {
            const signalLabel = signalLabelOf(newRow);

            setSlHitAlert({ key: `${payload.commit_timestamp}`, signalLabel, sellPrice: newRow.sellPrice });
            setTimeout(() => setSlHitAlert(null), 2500);

            toast.warning(`Stop Loss Hit — ${signalLabel} closed at ${newRow.sellPrice}`);

            if (enabledRef.current && audioCtxRef.current) {
              playSlHitTone(audioCtxRef.current);
            }
            return;
          }

          if (enabledRef.current && audioCtxRef.current) {
            if (payload.eventType === "INSERT") {
              playNewSignalTone(audioCtxRef.current);
            } else {
              playAlertTone(audioCtxRef.current);
            }
            setJustAlerted(true);
            setTimeout(() => setJustAlerted(false), 1500);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  // Callable from anywhere (e.g. the notification bell's own AdminUpdate
  // realtime listener) so admin-note updates get sound without opening a
  // second Supabase channel just to play a tone. Fails silently if sound is
  // off or the AudioContext hasn't been created/resumed yet.
  //
  // Wrapped in useCallback with no deps — it only ever reads from refs, so
  // it must stay referentially stable. A caller (NotificationBell) depends
  // on this identity in a realtime-subscription effect; letting it change
  // on every render (e.g. every time justAlerted flips) was tearing down
  // and re-subscribing that Supabase channel on every single alert, which
  // is what caused the panel's message list to lag behind the sound.
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
