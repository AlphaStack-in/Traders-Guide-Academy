"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AddSignalForm } from "@/components/admin/add-signal-form";

export function AddSignalSection({ defaultOpen }: { defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="signalflow-glass rounded-xl border border-white/5 p-4 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <h2 className="font-heading text-lg font-bold">Add New Signal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste the raw message and hit Parse, or use the manual form. Nothing saves until you
            confirm.
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="mt-6">
          <AddSignalForm />
        </div>
      )}
    </div>
  );
}
