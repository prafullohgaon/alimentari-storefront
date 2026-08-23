"use client";

import React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { Heart, Plus, ListPlus } from "lucide-react";
import { SaveToListModal } from "@/components/grocery/save-to-list-modal";
import { useWishlistStore } from "@/store/wishlist";
import { Product } from "@/lib/data";
export type { Product };

import { useTranslation } from "@/hooks/use-translation";

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onQuantityChange: (id: string, qty: number) => void;
  onQuickView?: (product: Product) => void;
}

function isDefaultVariantTitle(title?: string): boolean {
  if (!title) return true;
  const tStr = title.trim().toLowerCase();
  return (
    tStr === "default title" ||
    tStr === "default" ||
    tStr === "title" ||
    tStr === "default title - 1" ||
    tStr.startsWith("default title")
  );
}




function ProductCardComponent({
  product,
  quantityInCart,
  onQuantityChange,
  onQuickView,
}: ProductCardProps) {
  const { t } = useTranslation();
  const [imgSrc, setImgSrc] = React.useState(product.imageUrl);
  const [showSaveToList, setShowSaveToList] = React.useState(false);
  const wishlistIds = useWishlistStore((state) => state.ids);
  const toggleWishlistAction = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = wishlistIds.includes(product.id);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlistAction(product.id);
  };

  const isSale = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const cleanUnit = product.unit && !isDefaultVariantTitle(product.unit) ? product.unit : undefined;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden select-none">
      {/* Top Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        {product.isOrganic && (
          <Badge className="bg-emerald-700 text-white border-none text-[9px] font-extrabold py-0.5 px-2 rounded-md shadow-xs">
            🌱 BIO
          </Badge>
        )}
        {isSale && (
          <Badge className="bg-rose-600 text-white border-none text-[9px] font-extrabold py-0.5 px-2 rounded-md shadow-xs">
            -{discountPercent}%
          </Badge>
        )}
      </div>

      {/* Save to list & Wishlist Action Overlays */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowSaveToList(true);
          }}
          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center border border-slate-200 shadow-xs hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer min-h-[32px] min-w-[32px]"
          aria-label={t("pdp.saveToList")}
          title={t("pdp.saveToList")}
        >
          <ListPlus className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={toggleWishlist}
          className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center border border-slate-200 shadow-xs hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer min-h-[32px] min-w-[32px]"
          aria-label={isWishlisted ? t("pdp.wishlistRemove") : t("pdp.wishlistAdd")}
          suppressHydrationWarning
        >
          <Heart
            className={cn(
              "w-3.5 h-3.5 transition-colors duration-200 stroke-[2.5]",
              hasMounted && isWishlisted ? "text-rose-500 fill-rose-500" : "text-slate-400"
            )}
          />
        </button>
      </div>

      <SaveToListModal
        product={product}
        isOpen={showSaveToList}
        onClose={() => setShowSaveToList(false)}
      />

      {/* Product Image Stage (Modest padding reduction for better density) */}
      <div
        onClick={() => onQuickView?.(product)}
        className="relative w-full bg-slate-50 cursor-pointer overflow-hidden select-none aspect-square"
      >
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgSrc("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop")}
          priority={product.id === "1" || product.id === "2"}
        />

        {/* Shipping badge */}
        <span className="absolute bottom-1.5 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-extrabold py-0.5 px-1.5 rounded-md tracking-wider uppercase">
          {product.category === "Latticini & Salumi" ? "❄️ Refrigerato" : "📦 Standard"}
        </span>
      </div>

      {/* Card Body */}
      <div className="flex flex-col p-3 bg-white select-none flex-grow justify-between">
        <div>
          {/* Brand */}
          {product.brand && (
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block truncate mb-1">
              {product.brand}
            </span>
          )}


          {/* Name */}
          <h3
            onClick={() => onQuickView?.(product)}
            className="font-serif text-xs md:text-sm font-bold text-slate-900 line-clamp-2 leading-tight cursor-pointer hover:text-emerald-700 transition-colors mb-1 min-h-[2.25rem]"
          >
            {product.name}
          </h3>

          {/* Genuine Variant Unit Label (Hidden if Default Title) */}
          {cleanUnit && (
            <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">{cleanUnit}</span>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100 mt-auto">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight">
              €{product.price.toFixed(2)}
            </span>
            {isSale && (
              <span className="text-[11px] text-slate-400 line-through font-semibold truncate">
                €{product.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart button / Quantity Selector */}
          {quantityInCart === 0 ? (
            <button
              type="button"
              onClick={() => onQuantityChange(product.id, 1)}
              className="w-9 h-9 min-h-[36px] min-w-[36px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-all shadow-xs cursor-pointer"
              aria-label={t("pdp.addToCart")}
            >
              <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          ) : (
            <QuantitySelector
              value={quantityInCart}
              onChange={(qty) => onQuantityChange(product.id, qty)}
              className="h-9 w-full max-w-[100px]"
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const ProductCard = React.memo(
  ProductCardComponent,
  (prevProps, nextProps) =>
    prevProps.quantityInCart === nextProps.quantityInCart &&
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.imageUrl === nextProps.product.imageUrl
);
