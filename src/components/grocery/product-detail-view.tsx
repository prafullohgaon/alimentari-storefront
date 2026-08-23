"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Star,
  Leaf,
  ChevronRight,
  ShieldCheck,
  Award,
  Truck,
  Calendar,
  Lock,
  ListPlus,
  ZoomIn,
  Sparkles
} from "lucide-react";
import { SaveToListModal } from "@/components/grocery/save-to-list-modal";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/grocery/product-card";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { CartDrawer } from "@/components/grocery/cart-drawer";
import { SearchOverlay } from "@/components/grocery/search-overlay";
import { Notification } from "@/components/grocery/notification";
import { Footer } from "@/components/grocery/footer";
import { ReviewSection } from "@/components/grocery/review-section";
import { getProductHandle } from "@/lib/shopify";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useWishlistStore } from "@/store/wishlist";
import { useTranslation } from "@/hooks/use-translation";


interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}




export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  // Zustand Global Cart Store integration
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // Gallery images resolved from Shopify or fallback
  const productGalleryImages = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => img.url);
    }
    return [product.imageUrl];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Active Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState<"storia" | "valori" | "consegna">("storia");

  const [dynamicRating, setDynamicRating] = useState<{ rating: number; count: number } | null>(null);

  const handleRatingUpdate = useCallback((avgRating: number, count: number) => {
    if (count > 0) {
      setDynamicRating({ rating: avgRating, count });
    } else {
      setDynamicRating(null);
    }
  }, []);

  // Options & Selected Variant state configuration
  const initialOptions = useMemo(() => {
    const opts: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      product.variants[0].selectedOptions.forEach((o) => {
        opts[o.name] = o.value;
      });
    } else if (product.options) {
      product.options.forEach((opt) => {
        opts[opt.name] = opt.values[0];
      });
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const [selectedOptionsState, setSelectedOptionsState] = useState<Record<string, string>>(initialOptions);

  // Reset variant selections exactly once when product ID changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setSelectedOptionsState(initialOptions);
    setActiveImageIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const currentVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      return v.selectedOptions.every((o) => selectedOptionsState[o.name] === o.value);
    }) || product.variants[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, selectedOptionsState]);

  // Dynamically resolved variant values
  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayComparePrice = currentVariant ? currentVariant.originalPrice : product.originalPrice;
  const displaySku = currentVariant ? currentVariant.sku : product.sku;
  const displayStock = currentVariant ? currentVariant.stock : (product.stock || 0);

  // Authoritative Shopify availability:
  const isAvailable = currentVariant
    ? currentVariant.available
    : (product.available ?? (product.stock !== undefined ? product.stock > 0 : true));

  const displayUnit = currentVariant && currentVariant.title !== "Default Title" ? currentVariant.title : product.unit;

  // Filter out Shopify internal single-variant "Default Title" from customer UI
  const visibleOptions = useMemo(() => {
    if (!product.options) return [];
    return product.options.filter((option) => {
      const isDefaultTitleOption =
        option.name === "Title" &&
        option.values.length === 1 &&
        (option.values[0] === "Default Title" || option.values[0] === "Default");
      return !isDefaultTitleOption;
    });
  }, [product.options]);

  // Auto-switch gallery index on variant changes
  useEffect(() => {
    if (currentVariant?.image?.url) {
      const idx = productGalleryImages.indexOf(currentVariant.image.url);
      if (idx !== -1 && idx !== activeImageIndex) {
        setActiveImageIndex(idx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVariant?.id, productGalleryImages]);

  // Hover Magnifier Zoom coordinates on desktop
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: "none" });
  const [isZooming, setIsZooming] = useState(false);

  // Fullscreen lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showSaveToList, setShowSaveToList] = useState(false);

  // Mobile swipe gesture
  const touchStartX = useRef<number | null>(null);

  // Dynamic sticky mobile purchase bar triggers
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(false);
  const mainBuyButtonRef = useRef<HTMLDivElement>(null);

  // Dynamic delivery date
  const deliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString(locale === "it" ? "it-IT" : "en-US", { weekday: "long", day: "numeric", month: "long" });
  }, [locale]);

  useEffect(() => {
    const currentRef = mainBuyButtonRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyMobileBar(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, []);

  const handleQuantityChange = (productId: string, qty: number, customProduct?: Product) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);

    let productObj: Product | undefined;
    if (customProduct) {
      productObj = customProduct;
    } else if (productId === product.id) {
      productObj = {
        ...product,
        price: displayPrice,
        originalPrice: displayComparePrice,
        sku: displaySku,
        unit: displayUnit,
        variantId: currentVariant?.id || product.variantId || undefined
      };
    } else {
      productObj = relatedProducts.find((p) => p.id === productId);
    }

    if (!existing && qty === 1 && productObj) {
      setToast({ id: String(Date.now()), product: productObj });
    }

    if (qty <= 0) {
      removeItem(productId);
    } else if (existing) {
      updateQuantity(productId, qty);
    } else if (productObj) {
      addItem(productObj, qty);
    }
  };

  const quantityInCart = cart.find((item) => item.product.id === product.id)?.quantity || 0;

  // Cross-sell combinations from related products
  const boughtTogetherItem = relatedProducts.length > 0 ? relatedProducts[0] : null;
  const boughtTogetherItem2 = relatedProducts.length > 1 ? relatedProducts[1] : null;

  const comboPrice = displayPrice + (boughtTogetherItem?.price || 0) + (boughtTogetherItem2?.price || 0);
  const comboComparePrice = (displayComparePrice || displayPrice) + (boughtTogetherItem?.originalPrice || boughtTogetherItem?.price || 0) + (boughtTogetherItem2?.originalPrice || boughtTogetherItem2?.price || 0);
  const hasComboCompareDiscount = comboComparePrice > comboPrice + 0.01;
  const comboSavingsAmount = hasComboCompareDiscount ? comboComparePrice - comboPrice : 0;


  const handleAddComboToCart = () => {
    const cartProduct = {
      ...product,
      price: displayPrice,
      originalPrice: displayComparePrice,
      sku: displaySku,
      unit: displayUnit,
      variantId: currentVariant?.id || product.variantId || undefined
    };
    addItem(cartProduct, 1);
    if (boughtTogetherItem) addItem(boughtTogetherItem, 1);
    if (boughtTogetherItem2) addItem(boughtTogetherItem2, 1);
    useUiStore.getState().openCart();
  };

  // Magnifier lens coordinates on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundImage: `url(${productGalleryImages[activeImageIndex]})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "200%"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
    setIsZooming(false);
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        setActiveImageIndex((i) => (i + 1) % productGalleryImages.length);
      } else {
        setActiveImageIndex((i) => (i - 1 + productGalleryImages.length) % productGalleryImages.length);
      }
    }
    touchStartX.current = null;
  };

  // Wishlist Action integration
  const wishlistIds = useWishlistStore((state) => state.ids);
  const toggleWishlistAction = useWishlistStore((state) => state.toggleWishlist);
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => { setHasMounted(true); }, []);
  const isWishlisted = wishlistIds.includes(product.id);
  const toggleWishlist = () => {
    toggleWishlistAction(product.id);
  };


  // Info Tabs Filter based on available metadata

  const tabs = useMemo(() => {
    const list: { id: "storia" | "valori" | "consegna"; label: string }[] = [
      { id: "storia", label: t("pdp.tabStory") }
    ];
    if (product.ingredients || product.nutrition) {
      list.push({ id: "valori", label: t("pdp.tabValues") });
    }
    list.push({ id: "consegna", label: t("pdp.tabShipping") });
    return list;
  }, [product, t]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 md:pb-12 flex flex-col font-sans select-none antialiased">
      
      {/* Navigation Headers */}
      <DesktopNavbar
        onCategorySelect={() => router.push("/reparto")}
      />

      <MobileNavbar
        onCategorySelect={() => router.push("/reparto")}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-10 space-y-10 md:space-y-14 select-text text-slate-800">
        {/* Breadcrumb Row */}
        <nav aria-label={t("nav.breadcrumbAria")} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors">{t("pdp.home")}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
          <Link href="/reparto" className="hover:text-emerald-700 transition-colors">{t("pdp.reparto")}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
          <span className="text-slate-900 font-bold truncate max-w-[240px]">{product.name}</span>
        </nav>

        {/* Double-Column Main Product Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Column Left (Gallery Showcase) */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Vertical Thumbnail Sidebar (Desktop) */}
            {productGalleryImages.length > 1 && (
              <div className="hidden md:flex md:col-span-2 flex-col gap-3 select-none">
                {productGalleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Visualizza immagine ${idx + 1}`}
                    className={cn(
                      "w-full aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-white relative shadow-xs",
                      activeImageIndex === idx
                        ? "border-emerald-600 ring-2 ring-emerald-500/20 scale-[1.02]"
                        : "border-slate-200/80 opacity-70 hover:opacity-100 hover:border-emerald-500/40"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} miniature ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                        e.currentTarget.srcset = "";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image Display */}
            <div className={cn(
              "bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden select-none transition-all hover:shadow-md",
              productGalleryImages.length > 1 ? "md:col-span-10" : "md:col-span-12"
            )}>
              
              {product.isOrganic && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-emerald-700 text-white border-none py-1.5 px-3 shadow-xs font-bold text-[10px] uppercase tracking-wider rounded-md">
                    🌱 {t("pdp.bioCertificate")}
                  </Badge>
                </div>
              )}

              {/* Zoom Overlay Hint */}
              <div className="absolute top-4 right-4 z-10 pointer-events-none hidden md:flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-full px-2.5 py-1 shadow-xs">
                <ZoomIn className="w-3 h-3 text-slate-600" />
                <span>{t("pdp.zoomAria")}</span>
              </div>

              {/* Lens Magnifier Interactive Area */}
              <div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={handleMouseLeave}
                onClick={() => setLightboxOpen(true)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="w-full relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-white"
              >
                <Image
                  src={productGalleryImages[activeImageIndex]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-2 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                    e.currentTarget.srcset = "";
                  }}
                  priority={true}
                />
                
                {isZooming && (
                  <div
                    style={zoomStyle}
                    className="absolute inset-0 pointer-events-none rounded-xl border border-slate-300 bg-no-repeat shadow-lg"
                  />
                )}
              </div>
            </div>

            {/* Mobile Carousel Pagination Dots */}
            {productGalleryImages.length > 1 && (
              <div className="flex md:hidden justify-center gap-2 py-2 w-full select-none">
                {productGalleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all cursor-pointer",
                      activeImageIndex === idx ? "bg-emerald-700 w-7" : "bg-slate-300 w-2"
                    )}
                    aria-label={`Immagine ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Column Right (Sticky Premium Purchase Card) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            
            {/* Title & Availability Banner */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="space-y-2">
                {product.brand && (
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-md px-2.5 py-1 tracking-wider uppercase inline-block">
                    {product.brand}
                  </span>
                )}
                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {product.name}
                </h1>

                {/* Stock Status Badges */}
                <div className="pt-1">
                  {!isAvailable ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-3 py-1 select-none">
                      🚫 {t("pdp.soldOut")}
                    </div>
                  ) : displayStock > 0 && displayStock < 15 ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 select-none">
                      ⚡ {t("pdp.onlyStockLeft", { stock: displayStock })}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 select-none">
                      ✓ {t("pdp.inStock")}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating & SKU metadata */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 select-none">
                {dynamicRating !== null ? (
                  <div className="flex items-center gap-1.5 font-semibold text-slate-600 font-sans">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-900">{dynamicRating.rating.toFixed(1)}</span>
                    <span className="text-slate-400">({dynamicRating.count} {locale === "it" ? "recensioni" : "reviews"})</span>
                  </div>
                ) : product.rating !== undefined ? (
                  <div className="flex items-center gap-1.5 font-semibold text-slate-600 font-sans">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-900">{product.rating.toFixed(1)}</span>
                    <span className="text-slate-400">({locale === "it" ? "Valutazione certificata" : "Certified rating"})</span>
                  </div>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("pdp.qualityCertified")}
                  </span>
                )}


                <span className="text-slate-400 font-mono text-[11px]">SKU: {displaySku || `AL-${product.id}`}</span>
              </div>
            </div>

            {/* Shopify Product Multi-Option Selectors (Hidden if only "Default Title") */}
            {visibleOptions.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                  {t("pdp.productOptions")}
                </h3>
                {visibleOptions.map((option) => (
                  <div key={option.name} className="space-y-2 select-none">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                      {option.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const isSelected = selectedOptionsState[option.name] === value;
                        return (
                          <button
                            key={value}
                            onClick={() => {
                              setSelectedOptionsState((prev) => ({
                                ...prev,
                                [option.name]: value,
                              }));
                            }}
                            className={cn(
                              "px-3.5 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer",
                              isSelected
                                ? "border-emerald-600 bg-emerald-50/80 text-emerald-800 font-bold shadow-xs"
                                : "border-slate-200 hover:border-emerald-400 bg-white text-slate-700"
                            )}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PRIMARY PURCHASE CARD */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6 select-none">
              {/* Pricing Display */}
              <div className="flex items-baseline justify-between select-none">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    €{displayPrice.toFixed(2)}
                  </span>
                  {displayComparePrice && displayComparePrice > displayPrice && (
                    <>
                      <span className="text-base text-slate-400 line-through font-semibold">
                        €{displayComparePrice.toFixed(2)}
                      </span>
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        -{Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)}%
                      </span>
                    </>
                  )}
                  <span className="text-xs text-slate-500 font-semibold">/ {displayUnit}</span>
                </div>
              </div>

              {/* Fast Delivery Pill */}
              <div className="text-[11px] font-medium bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-xl flex items-center justify-between gap-2 select-none">
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold">🔥 {locale === "it" ? "In alta richiesta" : "In high demand"}</span>
                <span className="flex items-center gap-1 text-slate-600 font-semibold">🚚 {t("pdp.refrigeratedCourier")} {deliveryDate}</span>
              </div>

              {/* Add to Cart Primary CTAs */}
              <div ref={mainBuyButtonRef} className="flex gap-3 select-none">
                {quantityInCart === 0 ? (
                  <button
                    onClick={() => {
                      const cartProduct = {
                        ...product,
                        price: displayPrice,
                        originalPrice: displayComparePrice,
                        sku: displaySku,
                        unit: displayUnit,
                        variantId: currentVariant?.id || product.variantId || undefined
                      };
                      handleQuantityChange(product.id, 1, cartProduct);
                      useUiStore.getState().openCart();
                    }}
                    disabled={!isAvailable}
                    className={cn(
                      "flex-grow h-13 font-extrabold text-sm md:text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                      isAvailable
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-emerald-700/20"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    )}
                  >
                    <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                    {!isAvailable ? t("pdp.soldOut") : t("pdp.addToCart")}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 flex-grow">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{t("pdp.qtyLabel")}</span>
                    <QuantitySelector
                      value={quantityInCart}
                      onChange={(qty) => {
                        const cartProduct = {
                          ...product,
                          price: displayPrice,
                          originalPrice: displayComparePrice,
                          sku: displaySku,
                          unit: displayUnit,
                          variantId: currentVariant?.id || product.variantId || undefined
                        };
                        handleQuantityChange(product.id, qty, cartProduct);
                      }}
                      className="flex-grow justify-between h-13"
                    />
                  </div>
                )}
                
                {/* Secondary Action: Save to Grocery List */}
                <button
                  className="h-13 w-13 p-0 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-emerald-500 active:scale-95 transition-all flex-shrink-0 bg-white shadow-xs cursor-pointer"
                  onClick={() => setShowSaveToList(true)}
                  aria-label={t("pdp.saveToList")}
                  title={t("pdp.saveToList")}
                >
                  <ListPlus className="w-5 h-5 stroke-[2] text-slate-600" />
                </button>

                {/* Secondary Action: Wishlist */}
                <button
                  className="h-13 w-13 p-0 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-emerald-500 active:scale-95 transition-all flex-shrink-0 bg-white shadow-xs cursor-pointer"
                  onClick={toggleWishlist}
                  aria-label={isWishlisted ? t("pdp.wishlistRemove") : t("pdp.wishlistAdd")}
                  suppressHydrationWarning
                >
                  <Heart
                    className={cn(
                      "w-5 h-5 stroke-[2]",
                      hasMounted && isWishlisted ? "text-rose-500 fill-rose-500" : "text-slate-400"
                    )}
                  />
                </button>

                <SaveToListModal
                  product={product}
                  isOpen={showSaveToList}
                  onClose={() => setShowSaveToList(false)}
                />
              </div>

              {/* Trust Features Grid */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] leading-tight">{t("pdp.refrigeratedCourier")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] leading-tight">{t("pdp.programmableDelivery")}</span>
                </div>
              </div>

              {/* Payments & Freshness Reassurance */}
              <div className="pt-4 border-t border-slate-100 space-y-3 select-none">
                <div className="flex flex-col gap-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">✓</span>
                    <span className="text-[11px]">{t("pdp.freshnessGuarantee")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">✓</span>
                    <span className="text-[11px]">{t("pdp.freeShippingThreshold")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("pdp.sslProtected")}</span>
                  <div className="flex items-center gap-1.5 text-slate-400 select-none">
                    <span className="text-[9px] font-bold border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono bg-slate-50">Visa</span>
                    <span className="text-[9px] font-bold border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono bg-slate-50">MC</span>
                    <span className="text-[9px] font-bold border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono bg-slate-50">Amex</span>
                    <span className="text-[9px] font-bold border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono bg-slate-50">Apple Pay</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality DOP Certification Banner */}
            <div className="border border-emerald-200/80 bg-emerald-50/50 rounded-2xl p-5 flex gap-4 items-start shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Award className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-slate-900">{t("pdp.dopTitle")}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t("pdp.dopSubtitle")}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: Dynamic Info Tabs */}
        <section className="border-t border-slate-200/80 pt-10 space-y-6">
          <div className="bg-slate-200/60 p-1.5 rounded-2xl inline-flex gap-1 border border-slate-200/80 select-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInfoTab(tab.id)}
                className={cn(
                  "px-5 py-2.5 font-sans text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer",
                  activeInfoTab === tab.id
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[140px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInfoTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm text-sm leading-relaxed text-slate-600 space-y-4"
              >
                {activeInfoTab === "storia" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-3">
                      <h4 className="font-serif font-bold text-slate-900 text-lg">
                        {locale === "it"
                          ? (product.brand ? `La Tradizione di ${product.brand}` : "La Tradizione del Produttore")
                          : (product.brand ? `The Tradition of ${product.brand}` : "Producer Tradition")}
                      </h4>

                      {product.origin && (
                        <p className="font-medium text-slate-700">
                          {t("pdp.originDescription", { origin: product.origin })}
                        </p>
                      )}
                      {product.descriptionHtml ? (
                        <div className="prose prose-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                      ) : product.description ? (
                        <p className="leading-relaxed">{product.description}</p>
                      ) : null}
                    </div>
                    {product.origin && (
                      <div className="bg-emerald-50/50 border border-emerald-200/60 p-5 rounded-xl space-y-3">
                        <h5 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                          {locale === "it" ? "Note di Filiera" : "Supply Chain Notes"}
                        </h5>
                        <div className="flex gap-3 text-xs leading-relaxed text-slate-700">
                          <Leaf className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900">{locale === "it" ? "Filiera Corta Garantita" : "Guaranteed Short Supply Chain"}</strong> <br />
                            {locale === "it"
                              ? `Questo prodotto in provenienza da ${product.origin} viaggia direttamente dal produttore alle nostre cantine di condizionamento.`
                              : `This product from ${product.origin} travels directly from the producer to our climate-controlled facilities.`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeInfoTab === "valori" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {product.ingredients && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="font-serif font-bold text-slate-900 text-lg">
                            {locale === "it" ? "Ingredienti e Tracciabilità" : "Ingredients & Traceability"}
                          </h4>
                          <p className="italic text-slate-800 font-semibold">{product.ingredients}</p>
                        </div>
                        {product.dietary && (
                          <div className="space-y-1 text-xs">
                            <h5 className="font-bold text-emerald-800 uppercase tracking-wider">{locale === "it" ? "Allergeni" : "Allergens"}</h5>
                            <p className="text-slate-700">{product.dietary === "Gluten Free" ? (locale === "it" ? "Prodotto certificato Senza Glutine." : "Certified Gluten Free product.") : `${product.dietary}.`}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {product.nutrition && product.nutrition.calories !== "N/A" && (
                      <div className="space-y-3">
                        <h4 className="font-serif font-bold text-slate-900 text-lg">
                          {locale === "it" ? "Valori Nutrizionali Medi (per 100g)" : "Average Nutritional Values (per 100g)"}
                        </h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 border border-slate-200 p-4 rounded-xl bg-slate-50 font-semibold text-xs text-slate-700">
                          <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span>{locale === "it" ? "Energia" : "Energy"}</span>
                            <span className="text-slate-900 font-bold">{product.nutrition.calories}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span>{locale === "it" ? "Grassi" : "Fat"}</span>
                            <span className="text-slate-900 font-bold">{product.nutrition.fat}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span>{locale === "it" ? "Carboidrati" : "Carbohydrates"}</span>
                            <span className="text-slate-900 font-bold">{product.nutrition.carbs}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1.5">
                            <span>{locale === "it" ? "Proteine" : "Protein"}</span>
                            <span className="text-slate-900 font-bold">{product.nutrition.protein}</span>
                          </div>
                          <div className="col-span-2 flex justify-between pt-1">
                            <span>{locale === "it" ? "Sodio" : "Sodium"}</span>
                            <span className="text-slate-900 font-bold">{product.nutrition.sodium}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeInfoTab === "consegna" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-slate-200 p-5 rounded-xl space-y-2 bg-white shadow-xs">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Truck className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <h5 className="font-sans font-bold text-slate-900">{locale === "it" ? "Catena del Freddo" : "Cold Chain"}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {locale === "it"
                          ? "I latticini, i salumi e i freschi viaggiano a temperatura controllata costante (+4°C) in furgoni refrigerati."
                          : "Dairy, cured meats, and fresh products travel at a constant controlled temperature (+4°C) in refrigerated vehicles."}
                      </p>
                    </div>

                    <div className="border border-slate-200 p-5 rounded-xl space-y-2 bg-white shadow-xs">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <h5 className="font-sans font-bold text-slate-900">{locale === "it" ? "Imballaggio Eco-Termico" : "Eco-Thermal Packaging"}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {locale === "it"
                          ? "Scatole termiche isolate 100% compostabili in fibra di cocco con gel refrigerante riutilizzabile."
                          : "100% compostable thermal boxes with reusable coolant gel."}
                      </p>
                    </div>

                    <div className="border border-slate-200 p-5 rounded-xl space-y-2 bg-white shadow-xs">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Lock className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <h5 className="font-sans font-bold text-slate-900">{locale === "it" ? "Fatturazione e Resi" : "Receipts & Returns"}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {locale === "it"
                          ? "Ricevuta di acquisto e tracciabilità del lotto associate. Rimborso garantito in caso di difetti di freschezza."
                          : "Purchase receipt and lot traceability included. Guaranteed refund in case of freshness defects."}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* SECTION 3: FREQUENTLY BOUGHT TOGETHER (COMBO RICETTA) */}
        {Boolean(boughtTogetherItem && boughtTogetherItem2) && (
          <section className="border-t border-slate-200/80 pt-10 space-y-6 select-none bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg md:text-xl font-extrabold text-slate-900">
                    {t("pdp.boughtTogetherTitle")}
                  </h3>
                  {hasComboCompareDiscount && (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {t("pdp.saveCombo", { amount: comboSavingsAmount.toFixed(2) })}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {t("pdp.boughtTogetherSub")}
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-6 justify-between pt-2">
              <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-center">
                {/* Item 1: Active Product */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white flex gap-3 items-center max-w-[210px] shadow-xs">
                  <div className="w-12 h-12 relative flex-shrink-0">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="48px"
                      className="object-cover rounded-lg border border-slate-100"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                        e.currentTarget.srcset = "";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-sans font-bold text-xs truncate text-slate-900">{product.name}</h5>
                    <span className="text-[11px] text-slate-500 font-semibold">€{displayPrice.toFixed(2)}</span>
                  </div>
                </div>

                <span className="text-xl font-bold text-slate-300 font-sans select-none">+</span>

                {/* Item 2: Bought Together 1 */}
                {boughtTogetherItem && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-white flex gap-3 items-center max-w-[210px] shadow-xs">
                    <div className="w-12 h-12 relative flex-shrink-0">
                      <Image
                        src={boughtTogetherItem.imageUrl}
                        alt={boughtTogetherItem.name}
                        fill
                        sizes="48px"
                        className="object-cover rounded-lg border border-slate-100"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                          e.currentTarget.srcset = "";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-sans font-bold text-xs truncate text-slate-900">{boughtTogetherItem.name}</h5>
                      <span className="text-[11px] text-slate-500 font-semibold">€{boughtTogetherItem.price.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <span className="text-xl font-bold text-slate-300 font-sans select-none">+</span>

                {/* Item 3: Bought Together 2 */}
                {boughtTogetherItem2 && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-white flex gap-3 items-center max-w-[210px] shadow-xs">
                    <div className="w-12 h-12 relative flex-shrink-0">
                      <Image
                        src={boughtTogetherItem2.imageUrl}
                        alt={boughtTogetherItem2.name}
                        fill
                        sizes="48px"
                        className="object-cover rounded-lg border border-slate-100"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                          e.currentTarget.srcset = "";
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-sans font-bold text-xs truncate text-slate-900">{boughtTogetherItem2.name}</h5>
                      <span className="text-[11px] text-slate-500 font-semibold">€{boughtTogetherItem2.price.toFixed(2)}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Total combo price & CTA */}
              <div className="border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col items-center lg:items-end justify-center gap-3 flex-shrink-0">
                <div className="text-center lg:text-right">
                  <span className="text-xs text-slate-500 font-semibold block">{t("pdp.comboPackagePrice")}</span>
                  <div className="flex items-baseline gap-2 mt-0.5 justify-center lg:justify-end">
                    <span className="text-2xl md:text-3xl font-extrabold text-emerald-700">€{comboPrice.toFixed(2)}</span>
                    {hasComboCompareDiscount && (
                      <span className="text-xs text-slate-400 line-through">€{comboComparePrice.toFixed(2)}</span>
                    )}
                  </div>

                </div>
                <button
                  onClick={handleAddComboToCart}
                  disabled={!isAvailable}
                  className={cn(
                    "h-11 px-6 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]",
                    isAvailable
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-emerald-700/20"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  )}
                >
                  {t("pdp.addComboToCart")}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: REVIEWS */}
        <ReviewSection
          productId={product.id}
          productName={product.name}
          productHandle={product.handle}
          onRatingUpdate={handleRatingUpdate}
        />



        {/* SECTION 5: RECOMMENDED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-8 select-none">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h3 className="font-serif text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                {t("pdp.recommendedTitle")}
              </h3>
              <Link href="/reparto" className="text-xs font-bold text-emerald-700 hover:underline underline-offset-4">
                {locale === "it" ? "Vedi tutto →" : "View all →"}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((prod) => {
                const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    quantityInCart={cartQty}
                    onQuantityChange={(id, q) => handleQuantityChange(id, q)}
                    onQuickView={(p) => {
                      router.push(`/prodotto/${getProductHandle(p)}`);
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* STICKY BOTTOM SHOPPING BAR ON MOBILE */}
      <AnimatePresence>
        {showStickyMobileBar && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 pb-safe flex justify-between items-center shadow-xl select-none"
          >
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold text-slate-500 truncate block max-w-[160px]">{product.name}</span>
              <span className="font-extrabold text-slate-900 text-base block mt-0.5">
                €{displayPrice.toFixed(2)}
              </span>
            </div>

            {quantityInCart === 0 ? (
              <button
                onClick={() => {
                  const cartProduct = {
                    ...product,
                    price: displayPrice,
                    originalPrice: displayComparePrice,
                    sku: displaySku,
                    unit: displayUnit,
                    variantId: currentVariant?.id || product.variantId || undefined
                  };
                  handleQuantityChange(product.id, 1, cartProduct);
                  useUiStore.getState().openCart();
                }}
                disabled={!isAvailable}
                className={cn(
                  "h-11 px-6 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]",
                  isAvailable
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                {isAvailable ? `+ ${t("pdp.addToCart")}` : t("pdp.soldOut")}
              </button>
            ) : (
              <QuantitySelector
                value={quantityInCart}
                onChange={(qty) => {
                  const cartProduct = {
                    ...product,
                    price: displayPrice,
                    originalPrice: displayComparePrice,
                    sku: displaySku,
                    unit: displayUnit,
                    variantId: currentVariant?.id || product.variantId || undefined
                  };
                  handleQuantityChange(product.id, qty, cartProduct);
                }}
                size="sm"
                className="w-32 h-11"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md cursor-zoom-out flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl max-h-[90vh] bg-transparent"
            >
              <div className="relative w-[90vw] h-[80vh] max-w-4xl">
                <Image
                  src={productGalleryImages[activeImageIndex]}
                  alt="Product closeup preview"
                  fill
                  sizes="(max-width: 1024px) 90vw, 800px"
                  className="object-contain rounded-2xl shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                    e.currentTarget.srcset = "";
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Overlays */}
      <CartDrawer />

      <SearchOverlay
        products={relatedProducts}
        onProductClick={(p) => {
          router.push(`/prodotto/${getProductHandle(p)}`);
        }}
        onAddToCart={(id) => handleQuantityChange(id, 1)}
        onSearchSubmit={(q) => router.push(`/reparto?q=${encodeURIComponent(q)}`)}
      />

      <Notification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
