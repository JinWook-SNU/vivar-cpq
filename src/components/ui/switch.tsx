import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className, label, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={checked}
        onClick={(event) => {
          onCheckedChange?.(!checked);
          props.onClick?.(event);
        }}
        type="button"
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-neutral-900" : "bg-neutral-200",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full bg-white transition-transform shadow",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
        {label ? <span className="sr-only">{label}</span> : null}
      </button>
    );
  }
);
Switch.displayName = "Switch";
