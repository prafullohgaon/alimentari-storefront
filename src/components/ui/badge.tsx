import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "outline" | "accent" | "success" | "warning";
}

export function Badge({
  className,
  variant = "secondary",
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase select-none transition-colors duration-150",
        {
          // Deep Oliva
          "bg-primary text-primary-foreground": variant === "primary",
          // Muted Salvia/Pietra
          "bg-secondary text-secondary-foreground": variant === "secondary",
          // Clean Border Outline
          "border border-border text-foreground bg-transparent": variant === "outline",
          // Italian Terracotta
          "bg-accent text-accent-foreground": variant === "accent",
          // Healthy/Organic Soft Green
          "bg-success/10 text-success border border-success/20": variant === "success",
          // Warning Yellow
          "bg-warning/10 text-warning-foreground border border-warning/20": variant === "warning",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
