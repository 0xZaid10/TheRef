"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  icon?:     React.ReactNode;
  iconRight?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-ref text-pitch font-700 hover:bg-ref-dim active:scale-[0.98] shadow-ref hover:shadow-ref-lg",
  secondary:
    "bg-line text-chalk hover:bg-line/80 active:scale-[0.98]",
  ghost:
    "text-mist hover:text-chalk hover:bg-line active:scale-[0.98]",
  danger:
    "bg-loss/10 text-loss border border-loss/30 hover:bg-loss/20 active:scale-[0.98]",
  outline:
    "border border-line text-chalk hover:border-ref/50 hover:text-ref active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2   text-sm rounded-xl gap-2",
  lg: "px-6 py-3   text-base rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant  = "primary",
      size     = "md",
      loading  = false,
      icon,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-body font-500",
          "transition-all duration-200 select-none cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}

        {children && (
          <span className={cn(loading && "opacity-70")}>{children}</span>
        )}

        {!loading && iconRight && (
          <span className="shrink-0">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
