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

export function CategoryCard({ category, isActive = false, onClick }: CategoryCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer select-none border border-border/80 shadow-soft transition-all duration-300",
        isActive
          ? "border-primary ring-2 ring-primary/20 ring-offset-1"
          : "hover:border-border hover:shadow-premium hover:-translate-y-0.5"
      )}
    >
      {/* Category Image */}
      <Image
        src={category.imageUrl}
        alt={category.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-expo-out"
        onError={(e) => {
          e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
          e.currentTarget.srcset = "";
        }}
      />

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
        <h4 className="font-serif text-lg md:text-xl font-medium tracking-tight leading-none mb-0.5">
          {category.name}
        </h4>
        {category.itemCount !== undefined && (
          <span className="text-[11px] font-semibold text-white/80 uppercase tracking-widest">
            {category.itemCount} Prodotti
          </span>
        )}
      </div>
    </div>
  );
}
