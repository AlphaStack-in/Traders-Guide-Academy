"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  // Candidate values shown as suggestions. Filtered against the current
  // typed value (substring match, case-insensitive); the field always
  // accepts free text too — suggestions are a shortcut, not a whitelist.
  suggestions: string[];
  placeholder?: string;
  className?: string;
  // Force typed input to uppercase as the user types — for symbol-style
  // fields (stock tickers) where that's the display convention.
  uppercase?: boolean;
  maxSuggestions?: number;
}

// Lightweight text-input-with-suggestions, built without a Popover/Command
// dependency (none exists in this project yet) — a plain absolutely
// positioned list below the input, closed on outside click or Escape.
export function Combobox({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  uppercase = false,
  maxSuggestions = 8,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const query = value.trim().toUpperCase();
  const filtered = (query
    ? suggestions.filter((s) => s.toUpperCase().includes(query) && s.toUpperCase() !== query)
    : suggestions
  ).slice(0, maxSuggestions);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(uppercase ? e.target.value.toUpperCase() : e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full",
          className,
        )}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-white/10 bg-[#12131a] shadow-xl">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                // mousedown (not click) fires before the input's blur, so
                // the outside-click handler above doesn't close this first.
                e.preventDefault();
                onChange(s);
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left text-xs font-mono text-foreground hover:bg-primary/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
