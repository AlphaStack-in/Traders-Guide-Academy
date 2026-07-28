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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STORAGE_KEY = "thc-sound-alerts-enabled";

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
