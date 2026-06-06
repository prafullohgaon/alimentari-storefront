"use client";

import React from "react";
import { Store, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

import { useCartStore, selectCartCount } from "@/store/cart";

interface MobileBottomNavProps {
  activeTab: "shop" | "search" | "cart" | "account";
  onTabChange: (tab: "shop" | "search" | "cart" | "account") => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
}: MobileBottomNavProps) {
  const cartCount = useCartStore(selectCartCount);

  const navItems = [
    { id: "shop" as const, label: "Spesa", icon: Store },
    { id: "search" as const, label: "Cerca", icon: Search },
    { id: "cart" as const, label: "Carrello", icon: ShoppingCart, badge: cartCount },
    { id: "account" as const, label: "Profilo", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-border/60 shadow-lg px-4 pb-safe-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full text-center transition-all duration-150 select-none btn-touch-active",
                isActive ? "text-primary scale-105" : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <div className="relative flex items-center justify-center p-1">
                <Icon
                  className={cn(
                    "w-[22px] h-[22px] transition-transform duration-200",
                    isActive ? "stroke-[2.5]" : "stroke-[2]"
                  )}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-accent-foreground text-[10px] font-bold h-[18px] min-w-[18px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm animate-scaleIn">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold mt-0.5 tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
