"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
  categories: { id: string; name: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function FilterChips({
  categories,
  activeId,
  onSelect,
  className,
}: FilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("relative w-full overflow-hidden select-none", className)}>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-none px-4 md:px-0 py-2 -my-2 touch-pan-x snap-x"
      >
        {categories.map((cat) => {
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "snap-start flex-shrink-0 h-10 px-5 rounded-full text-sm font-semibold transition-all duration-200 border",
                "active:scale-95 btn-touch-active focus:outline-none",
                isActive
                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                  : "bg-card border-border/80 text-foreground hover:bg-muted/10"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
