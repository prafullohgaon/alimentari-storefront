"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  className?: string;
  size?: "sm" | "md";
}

export function QuantitySelector({
  value,
  onChange,
  max = 99,
  min = 0,
  className,
  size = "md",
}: QuantitySelectorProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-between border border-border bg-card rounded-lg overflow-hidden select-none",
        {
          "h-8 px-1 gap-1.5": size === "sm",
          "h-11 px-1.5 gap-3": size === "md",
        },
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className={cn(
          "flex items-center justify-center text-foreground hover:bg-muted/15 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors",
          {
            "w-6 h-6": size === "sm",
            "w-8 h-8": size === "md",
          }
        )}
        aria-label="Rimuovi unità"
      >
        <Minus className={cn("stroke-[2.5]", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </button>

      <span
        className={cn(
          "font-semibold text-foreground text-center tabular-nums min-w-[1.25rem]",
          size === "sm" ? "text-sm" : "text-base"
        )}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className={cn(
          "flex items-center justify-center text-foreground hover:bg-muted/15 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors",
          {
            "w-6 h-6": size === "sm",
            "w-8 h-8": size === "md",
          }
        )}
        aria-label="Aggiungi unità"
      >
        <Plus className={cn("stroke-[2.5]", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </button>
    </div>
  );
}
