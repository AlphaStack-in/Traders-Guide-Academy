"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked"> {
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean | "indeterminate";
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const isChecked = checked === true || checked === "indeterminate";

    return (
      <label className="relative inline-flex cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked === true}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-white/20 bg-black/40 text-black transition-colors hover:border-primary/60 peer-focus-visible:outline-none peer-focus-visible:ring-1 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            isChecked && "border-primary bg-primary text-primary-foreground",
            className,
          )}
        >
          {checked === true && <Check className="h-3 w-3 text-black stroke-[3]" />}
          {checked === "indeterminate" && <div className="h-2 w-2 rounded-xs bg-black" />}
        </div>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
