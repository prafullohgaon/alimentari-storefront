"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { Heart, Plus } from "lucide-react";

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
  originalPrice?: number;
}

import { useWishlistStore } from "@/store/wishlist";

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onQuantityChange: (id: string, qty: number) => void;
  onQuickView?: (product: Product) => void;
}

function getProductBrand(product: Product) {
  if (product.name.toLowerCase().includes("pasta") || product.name.toLowerCase().includes("paccheri")) return "Pastificio Liguori";
  if (product.name.toLowerCase().includes("olio")) return "Antico Frantoio";
  if (product.name.toLowerCase().includes("parmigiano")) return "Consorzio Parmigiano";
  if (product.name.toLowerCase().includes("mozzarella")) return "Caseificio Campano";
  if (product.name.toLowerCase().includes("franciacorta") || product.name.toLowerCase().includes("vino")) return "Bellavista Enoteca";
  if (product.name.toLowerCase().includes("prosciutto")) return "Salumificio Devodier";
  return "Alimentari Selezione";
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

  const wishlistIds = useWishlistStore((state) => state.ids);
  const toggleWishlistAction = useWishlistStore((state) => state.toggleWishlist);

  const [hasMounted, setHasMounted] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState(product.imageUrl);

  React.useEffect(() => { setHasMounted(true); }, []);
  React.useEffect(() => { setImgSrc(product.imageUrl); }, [product.imageUrl]);

  const isWishlisted = wishlistIds.includes(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlistAction(product.id);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col bg-card rounded-md border border-border overflow-hidden",
        "hover:border-primary/40 hover:shadow-sm transition-all duration-200"
      )}
    >
      {/* Sale badge — top-left */}
      <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-0.5 pointer-events-none">
        {product.isOrganic && (
          <Badge className="bg-primary text-primary-foreground border-none text-[8px] font-bold py-0 px-1 rounded-sm leading-4">
            BIO
          </Badge>
        )}
        {isSale && (
          <Badge className="bg-red-500 text-white border-none text-[8px] font-bold py-0 px-1 rounded-sm leading-4">
            -{discountPercent}%
          </Badge>
        )}
      </div>

      {/* Wishlist — top-right, small */}
      <button
        type="button"
        onClick={toggleWishlist}
        className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-card/90 flex items-center justify-center border border-border shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Aggiungi ai preferiti"
        suppressHydrationWarning
      >
        <Heart
          className={cn(
            "w-3 h-3 transition-colors duration-200 stroke-[2.5]",
            hasMounted && isWishlisted ? "text-red-500 fill-red-500" : "text-muted"
          )}
        />
      </button>

      {/* Image — reduced to 3:4 aspect, slightly rectangular like Vico */}
      <div
        onClick={() => onQuickView?.(product)}
        className="relative w-full bg-secondary cursor-pointer overflow-hidden select-none"
        style={{ aspectRatio: "1 / 1", maxHeight: "200px" }}
      >
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 20vw, 16vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={() => setImgSrc("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop")}
          priority={product.id === "1" || product.id === "2"}
        />
        {/* Minimal shipping tag */}
        <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[7px] font-bold py-0.5 px-1 rounded tracking-wide uppercase">
          {product.category === "Latticini & Salumi" ? "Refrigerato" : "Standard"}
        </span>
      </div>

      {/* Content — minimal padding, tight layout */}
      <div className="flex flex-col p-1 bg-card select-none">
        {/* Brand */}
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1 truncate">
          {getProductBrand(product)}
        </span>

        {/* Name */}
        <h3
          onClick={() => onQuickView?.(product)}
          className="font-sans text-[14px] font-semibold text-foreground line-clamp-2 leading-tight cursor-pointer hover:text-primary transition-colors mb-0.5"
          style={{ minHeight: "2rem" }}
        >
          {product.name}
        </h3>

        {/* Unit */}
        <span className="text-[12px] text-muted font-medium leading-none mb-1">{product.unit}</span>

        {/* Price row + add button on same row (Vico style) */}
        <div className="flex items-center justify-between mt-1 gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-[16px] text-foreground leading-none">
              €{product.price.toFixed(2)}
            </span>
            {isSale && (
              <span className="text-[10px] text-muted line-through font-medium">
                €{product.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Vico-style: small square add button when qty=0, compact selector when qty>0 */}
          {quantityInCart === 0 ? (
            <button
              onClick={() => onQuantityChange(product.id, 1)}
              className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md flex items-center justify-center flex-shrink-0 active:scale-95 transition-all shadow-sm"
              aria-label="Aggiungi al carrello"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <QuantitySelector
              value={quantityInCart}
              onChange={(qty) => onQuantityChange(product.id, qty)}
              className="h-8 w-full max-w-[96px]"
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
