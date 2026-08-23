"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();
  const isSyncing = useCartStore((state) => state.isSyncing);

  // Temporary UI state for pending rapid clicks
  const [localQty, setLocalQty] = useState<number>(value);
  const pendingTargetRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Smart resynchronization logic to prevent stale intermediate responses from overwriting pending target
  useEffect(() => {
    const pendingTarget = pendingTargetRef.current;

    if (pendingTarget === null) {
      // No pending click target: sync directly to confirmed Shopify value
      setLocalQty(value);
    } else if (value === pendingTarget) {
      // Confirmed Shopify value matches our target: pending target settled!
      setLocalQty(value);
      pendingTargetRef.current = null;
    } else if (!isSyncing && Date.now() - lastClickTimeRef.current > 600) {
      // API sync finished (or failed) and no user clicks in > 600ms: revert to confirmed Shopify value
      setLocalQty(value);
      pendingTargetRef.current = null;
    }
  }, [value, isSyncing]);

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = pendingTargetRef.current !== null ? localQty : value;
    if (current > min) {
      const next = current - 1;
      setLocalQty(next);
      pendingTargetRef.current = next;
      lastClickTimeRef.current = Date.now();
      onChange(next);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = pendingTargetRef.current !== null ? localQty : value;
    if (current < max) {
      const next = current + 1;
      setLocalQty(next);
      pendingTargetRef.current = next;
      lastClickTimeRef.current = Date.now();
      onChange(next);
    }
  };

  const displayedQty = pendingTargetRef.current !== null ? localQty : value;
  const isPending = pendingTargetRef.current !== null;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-between border border-border bg-card rounded-md overflow-hidden select-none transition-colors duration-200",
        isPending && "border-primary/50 bg-primary/5",
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
        disabled={displayedQty <= min}
        className={cn(
          "flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors",
          {
            "w-6 h-6": size === "sm",
            "w-8 h-8": size === "md",
          }
        )}
        aria-label={t("pdp.decreaseAria")}
      >
        <Minus className={cn("stroke-[2.5]", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </button>

      <span
        className={cn(
          "font-bold text-foreground text-center tabular-nums min-w-[1.25rem] transition-colors duration-200",
          size === "sm" ? "text-sm" : "text-base",
          isPending && "text-primary font-extrabold"
        )}
      >
        {displayedQty}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={displayedQty >= max}
        className={cn(
          "flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors",
          {
            "w-6 h-6": size === "sm",
            "w-8 h-8": size === "md",
          }
        )}
        aria-label={t("pdp.increaseAria")}
      >
        <Plus className={cn("stroke-[2.5]", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </button>
    </div>
  );
}
