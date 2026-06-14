// src/components/grocery/mega-menu.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavCategory } from "@/lib/navigation";

interface MegaMenuProps {
  category: NavCategory;
  onCategorySelect: (catId: string) => void;
  className?: string;
}

export function MegaMenu({ category, onCategorySelect, className }: MegaMenuProps) {
  const router = useRouter();

  return (
    <div className={cn("w-full bg-white shadow-2xl border-t border-slate-100 overflow-hidden select-none", className)}>
      <div className="max-w-full mx-auto px-8 py-6 lg:px-12 lg:py-8 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Content columns */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-2">
          {category.columns.map((col, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="font-sans text-[15px] font-bold text-slate-900 uppercase tracking-wider mb-2">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => onCategorySelect(category.id)}
                      className="text-[14px] text-slate-600 hover:text-emerald-700 transition-colors py-0.5 block text-left"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Promotional image column */}
        <div className="lg:border-l border-slate-100 lg:pl-6 flex flex-col gap-4">
          <div className="relative group overflow-hidden rounded-lg aspect-[4/3] w-full">
            <Image
              src={category.promoImageUrl}
              alt={`${category.name} promo`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          </div>
          <button
            onClick={() => onCategorySelect(category.id)}
            className="text-sm font-bold text-emerald-700 flex items-center gap-2 group"
          >
            Scopri tutti i prodotti
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 py-4 px-8 lg:px-12">
        <div className="max-w-full mx-auto flex items-center justify-between text-[11px] uppercase font-bold text-slate-500 tracking-widest">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Spesa protetta e refrigerata</span>
          </div>
          <span>Supporto 24/7</span>
        </div>
      </div>
    </div>
  );
}
