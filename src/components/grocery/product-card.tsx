"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { ShoppingBag, Star, Leaf, Heart } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  category: string;
  rating?: number;
  tags?: string[];
  isOrganic?: boolean;
  originalPrice?: number; // for sales
}

import { useWishlistStore } from "@/store/wishlist";

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onQuantityChange: (id: string, qty: number) => void;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({
  product,
  quantityInCart,
  onQuantityChange,
  onQuickView,
}: ProductCardProps) {
  const isSale = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Centralized Wishlist Store Integration
  const wishlistIds = useWishlistStore((state) => state.ids);
  const toggleWishlistAction = useWishlistStore((state) => state.toggleWishlist);
  
  const [hasMounted, setHasMounted] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState(product.imageUrl);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    setImgSrc(product.imageUrl);
  }, [product.imageUrl]);

  const isWishlisted = wishlistIds.includes(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlistAction(product.id);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-card rounded-xl border border-border/80 overflow-hidden shadow-soft",
        "hover:border-border hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300"
      )}
    >
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.isOrganic && (
          <Badge variant="success" className="gap-1 bg-white/95 backdrop-blur-sm">
            <Leaf className="w-3 h-3 text-success fill-success/10" />
            Bio
          </Badge>
        )}
        {isSale && (
          <Badge variant="accent" className="bg-accent/95 text-white">
            -{discountPercent}%
          </Badge>
        )}
        {product.tags?.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="bg-white/90 backdrop-blur-sm text-[10px] font-semibold border-border/60"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Floating Wishlist Button — suppressed until after mount to avoid hydration mismatch */}
      <button
        type="button"
        onClick={toggleWishlist}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-border/40 shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Aggiungi ai preferiti"
        suppressHydrationWarning
      >
        <Heart
          className={cn(
            "w-4 h-4 transition-colors duration-200 stroke-[2.5]",
            hasMounted && isWishlisted ? "text-accent fill-accent" : "text-[#C9623B]"
          )}
        />
      </button>

      {/* Image Gallery Container (Gentle Editorial Zoom) */}
      <div
        onClick={() => onQuickView?.(product)}
        className="relative aspect-square w-full bg-[#FAF7F2] cursor-pointer overflow-hidden select-none"
      >
        {/* Primary Image */}
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-expo-out group-hover:scale-[1.025]"
          onError={() => {
            setImgSrc("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop");
          }}
          priority={product.id === "1" || product.id === "2"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Real-world shipping tag */}
        <div className="absolute bottom-2 left-2 z-10 select-none pointer-events-none">
          <span className="bg-[#1C3B2B]/85 backdrop-blur-sm text-white text-[8px] font-bold py-0.5 px-2 rounded tracking-widest uppercase">
            {product.category === "Latticini & Salumi" ? "Refrigerato" : "Standard"}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-grow p-4">
        {/* Category & Rating Row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {product.category}
          </span>
          {product.rating && (
            <div className="flex items-center gap-0.5 text-warning select-none">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-semibold text-foreground">
                {product.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Product Title (Fixed Height for Alignment) */}
        <h3
          onClick={() => onQuickView?.(product)}
          className="font-serif text-base md:text-lg font-medium text-foreground tracking-tight line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors min-h-[2.5rem] md:min-h-[2.75rem]"
        >
          {product.name}
        </h3>

        {/* Price & Quantity Info (Fixed Height for Alignment) */}
        <div className="flex flex-col min-h-[3rem] md:min-h-[3.25rem] justify-end pt-1 pb-3">
          <span className="text-[11px] md:text-xs text-muted-foreground font-medium">
            {product.unit}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-semibold text-base md:text-lg text-foreground tracking-tight">
              €{product.price.toFixed(2)}
            </span>
            {isSale && (
              <span className="text-xs text-muted-foreground line-through decoration-muted font-medium">
                €{product.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic CTA Layer */}
        <div className="mt-auto">
          {quantityInCart === 0 ? (
            <button
              onClick={() => onQuantityChange(product.id, 1)}
              className={cn(
                "w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 select-none shadow-sm transition-all duration-200",
                "active:scale-[0.98] active:bg-primary/90 btn-touch-active"
              )}
            >
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
              Aggiungi
            </button>
          ) : (
            <QuantitySelector
              value={quantityInCart}
              onChange={(qty) => onQuantityChange(product.id, qty)}
              className="w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
