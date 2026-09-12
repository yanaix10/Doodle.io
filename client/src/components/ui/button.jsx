import * as React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-bold transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 select-none disabled:opacity-50 disabled:pointer-events-none disabled:transform-none";

    const variants = {
      default: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:bg-indigo-800",
      secondary: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shadow-sm",
      outline: "border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700",
      destructive: "bg-rose-500 hover:bg-rose-600 text-white shadow-sm",
      ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
      success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
    };

    const sizes = {
      sm: "h-9 px-3 text-sm rounded-xl",
      default: "h-11 px-5 text-base rounded-2xl",
      lg: "h-13 px-7 text-lg rounded-2xl",
      icon: "h-11 w-11 p-0 rounded-2xl"
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
