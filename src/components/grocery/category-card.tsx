"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  itemCount?: number;
}

interface CategoryCardProps {
  category: Category;
  isActive?: boolean;
  onClick?: () => void;
}

function getCategoryEmoji(id: string) {
  switch (id.toLowerCase()) {
    case "dispensa":
      return "🥫";
    case "latticini & salumi":
      return "🧀";
    case "panetteria":
      return "🥖";
    case "enoteca":
      return "🍷";
    case "frutta & verdura":
      return "🥦";
    case "casa & persona":
      return "🧼";
    default:
      return "🛒";
  }
}

export function CategoryCard({ category, isActive = false, onClick }: CategoryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-slate-100/80 rounded-md cursor-pointer select-none border border-slate-200/80 shadow-sm transition-all duration-200",
        isActive
          ? "border-green-600 ring-2 ring-green-600/10"
          : "hover:border-slate-300 hover:shadow-md"
      )}
    >
      <div className="text-3.5xl mb-2 select-none group-hover:scale-110 transition-transform duration-300">
        {getCategoryEmoji(category.id)}
      </div>
      <h4 className="font-sans text-xs font-bold text-slate-800 text-center tracking-tight leading-tight mb-1">
        {category.name}
      </h4>
      {category.itemCount !== undefined && (
        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
          {category.itemCount} Prodotti
        </span>
      )}
    </div>
  );
}
