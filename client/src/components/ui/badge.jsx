import * as React from "react";
import { cn } from "../../lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    destructive: "bg-rose-100 text-rose-700 border border-rose-200"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
