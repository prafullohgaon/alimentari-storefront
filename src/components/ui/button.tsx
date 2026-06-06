"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 outline-none select-none",
          // Touch target size assurance (min 44px on mobile except icon/sm, where touch target is padded)
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          {
            // Oliva primary
            "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm active:bg-primary/90":
              variant === "primary",
            // Salvia secondary
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70":
              variant === "secondary",
            // Pietra outline
            "border border-border bg-transparent text-foreground hover:bg-muted/10 active:bg-muted/20":
              variant === "outline",
            // Minimal ghost
            "bg-transparent text-foreground hover:bg-muted/15 active:bg-muted/25":
              variant === "ghost",
            // Terracotta accent
            "bg-accent text-accent-foreground hover:bg-accent/95 shadow-sm active:bg-accent/90":
              variant === "accent",
          },
          {
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-5 text-base": size === "md", // touch-friendly height 44px
            "h-14 px-8 text-lg": size === "lg",   // heavy call-to-action
            "h-11 w-11 p-0": size === "icon",    // standard touch icon button
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Caricamento...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
