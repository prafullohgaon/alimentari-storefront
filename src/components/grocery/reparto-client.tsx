"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Check, X, ChevronRight, LayoutGrid, List, Heart, Plus, ListPlus, Leaf } from "lucide-react";
import { Footer } from "@/components/grocery/footer";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/data";
import { getProductHandle, getCollectionProducts, getProductsWithPagination, searchProductsWithPagination } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/grocery/product-card";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { SaveToListModal } from "@/components/grocery/save-to-list-modal";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { CartDrawer } from "@/components/grocery/cart-drawer";
import { SearchOverlay } from "@/components/grocery/search-overlay";
import { Notification } from "@/components/grocery/notification";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarNode } from "@/types/sidebar";
import { useCartStore, selectProductCartQuantity } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useTranslation } from "@/hooks/use-translation";




// ─── Horizontal List View Card Component ──────────────────────────────────────

function isDefaultVariantTitle(title?: string): boolean {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  return (
    t === "default title" ||
    t === "default" ||
    t === "title" ||
    t === "default title - 1" ||
    t.startsWith("default title")
  );
}

function RepartoListViewCard({
  product,
  onQuantityChange,
  onQuickView,
}: {
  product: Product;
  onQuantityChange: (id: string, qty: number) => void;
  onQuickView: (p: Product) => void;
}) {
  const { t } = useTranslation();
  const quantityInCart = useCartStore(selectProductCartQuantity(product.id));
  const wishlistIds = useWishlistStore((state) => state.ids);
  const toggleWishlistAction = useWishlistStore((state) => state.toggleWishlist);
  const [showSaveToList, setShowSaveToList] = useState(false);

  const isWishlisted = wishlistIds.includes(product.id);
  const [hasMounted, setHasMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.imageUrl);

  useEffect(() => { setHasMounted(true); }, []);
  useEffect(() => { setImgSrc(product.imageUrl); }, [product.imageUrl]);

  const isSale = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const cleanUnit = product.unit && !isDefaultVariantTitle(product.unit) ? product.unit : undefined;

  return (
    <article className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 select-none">
      {/* Left: Image Container */}
      <div
        onClick={() => onQuickView(product)}
        className="w-full sm:w-28 md:w-36 aspect-square bg-slate-50 rounded-xl overflow-hidden relative flex-shrink-0 cursor-pointer"
      >
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, 144px"
          className="object-contain p-2 transition-transform duration-300 hover:scale-105"
          onError={() => setImgSrc("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop")}
        />
        {product.isOrganic && (
          <Badge className="absolute top-2 left-2 bg-emerald-700 text-white border-none text-[8px] font-extrabold py-0.5 px-2 rounded-md shadow-xs">
            🌱 BIO
          </Badge>
        )}
      </div>

      {/* Middle: Product Details */}
      <div className="flex-grow min-w-0 space-y-1 text-center sm:text-left w-full sm:w-auto">
        {product.brand && (
          <span className="text-[10px] font-extrabold text-emerald-800 tracking-wider uppercase block truncate">
            {product.brand}
          </span>
        )}

        <h3
          onClick={() => onQuickView(product)}
          className="font-serif text-sm md:text-base font-bold text-slate-900 leading-tight cursor-pointer hover:text-emerald-700 transition-colors line-clamp-2"
        >
          {product.name}
        </h3>
        {cleanUnit && <span className="text-xs text-slate-500 font-semibold block">{cleanUnit}</span>}

        {/* Dietary or Category Badge */}
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start pt-1">
          {product.dietary && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <Leaf className="w-3 h-3" />
              {product.dietary}
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {product.category || "Alimentari"}
          </span>
        </div>
      </div>

      {/* Right: Pricing & Actions */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0 gap-3">
        <div className="text-left sm:text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
              €{product.price.toFixed(2)}
            </span>
            {isSale && (
              <span className="text-xs text-slate-400 line-through font-semibold">
                €{product.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>
          {isSale && (
            <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
              -{discountPercent}% SCONTO
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSaveToList(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all shadow-xs cursor-pointer min-h-[36px] min-w-[36px]"
            aria-label={t("pdp.saveToList")}
          >
            <ListPlus className="w-4 h-4 stroke-[2]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlistAction(product.id);
            }}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-all shadow-xs cursor-pointer min-h-[36px] min-w-[36px]"
            aria-label={isWishlisted ? t("pdp.wishlistRemove") : t("pdp.wishlistAdd")}
            suppressHydrationWarning
          >
            <Heart
              className={cn(
                "w-4 h-4 stroke-[2]",
                hasMounted && isWishlisted ? "text-rose-500 fill-rose-500" : "text-slate-400"
              )}
            />
          </button>

          {quantityInCart === 0 ? (
            <button
              onClick={() => onQuantityChange(product.id, 1)}
              className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label={t("pdp.addToCart")}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden md:inline">{t("searchOverlay.addToCart")}</span>
            </button>
          ) : (
            <QuantitySelector
              value={quantityInCart}
              onChange={(qty) => onQuantityChange(product.id, qty)}
              className="h-9 w-28"
              size="sm"
            />
          )}
        </div>
      </div>

      <SaveToListModal
        product={product}
        isOpen={showSaveToList}
        onClose={() => setShowSaveToList(false)}
      />
    </article>
  );
}


function RepartoGridProductCard({
  product,
  onQuantityChange,
  onQuickView,
}: {
  product: Product;
  onQuantityChange: (id: string, qty: number) => void;
  onQuickView: (p: Product) => void;
}) {
  const quantityInCart = useCartStore(selectProductCartQuantity(product.id));
  return (
    <ProductCard
      product={product}
      quantityInCart={quantityInCart}
      onQuantityChange={onQuantityChange}
      onQuickView={onQuickView}
    />
  );
}

const DIETARY_OPTIONS = ["Gluten Free", "Vegan", "Senza Lattosio", "Bio"];

const getCategoryName = (handleOrId: string, t: (key: string) => string) => {
  if (handleOrId === "tutti") return t("reparto.allReparti");
  const translated = t(`categories.${handleOrId}`);
  if (translated && translated !== `categories.${handleOrId}`) return translated;
  return handleOrId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getDietaryLabel = (diet: string, t: (key: string) => string) => {
  switch (diet) {
    case "Gluten Free":
      return t("reparto.dietary.glutenFree");
    case "Vegan":
      return t("reparto.dietary.vegan");
    case "Senza Lattosio":
      return t("reparto.dietary.lactoseFree");
    case "Bio":
      return t("reparto.dietary.organic");
    default:
      return diet;
  }
};

interface RepartoClientProps {
  initialProducts: Product[];
  initialPageInfo: { hasNextPage: boolean; endCursor: string | null };
  categoryTree?: SidebarNode[];
}

export function RepartoClient({ initialProducts, initialPageInfo, categoryTree }: RepartoClientProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // Mobile Drawer Toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Derive Filter state directly from URL Query Search parameters
  const selectedDept = searchParams.get("dept") || "tutti";
  const onlyOrganic = searchParams.get("organic") === "true";

  const priceRange = useMemo(() => {
    const min = Number(searchParams.get("minPrice")) || 0;
    const maxVal = searchParams.get("maxPrice");
    const max = maxVal !== null ? Number(maxVal) : Infinity;
    return { min, max };
  }, [searchParams]);

  const sortOption = searchParams.get("sort") || "default";
  const currentPage = Number(searchParams.get("page")) || 1;
  const searchQuery = searchParams.get("q") || "";
  const [itemsPerPage] = useState(12);

  const selectedDietary = useMemo(() => {
    const val = searchParams.get("dietary");
    return val ? val.split(",") : [];
  }, [searchParams]);

  const selectedBrands = useMemo(() => {
    const val = searchParams.get("brands");
    return val ? val.split(",") : [];
  }, [searchParams]);

  // Active filter counter for mobile filter badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDept !== "tutti") count++;
    if (onlyOrganic) count++;
    if (priceRange.max < 50 || priceRange.min > 0) count++;
    count += selectedDietary.length;
    count += selectedBrands.length;
    return count;
  }, [selectedDept, onlyOrganic, priceRange, selectedDietary, selectedBrands]);

  // Local state for price range slider
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(50);

  useEffect(() => {
    setLocalMaxPrice(priceRange.max === Infinity ? 50 : priceRange.max);
  }, [priceRange.max]);

  // Zustand Global Cart Store integrations
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  // Dynamic products states & pagination control
  const [productsState, setProductsState] = useState<Product[]>(initialProducts);
  const [hasNextPage, setHasNextPage] = useState<boolean>(initialPageInfo.hasNextPage);
  const [loading, setLoading] = useState<boolean>(false);

  const pageCursors = useRef<Record<number, string | null>>({ 1: null });
  const isFirstRender = useRef<boolean>(true);
  const prevFilters = useRef({ selectedDept, sortOption, itemsPerPage, searchQuery });

  // Map UI sort choices to Shopify sort parameters
  const getSortParams = (option: string) => {
    switch (option) {
      case "price-asc":
        return { sortKey: "PRICE", reverse: false };
      case "price-desc":
        return { sortKey: "PRICE", reverse: true };
      case "newest":
        return { sortKey: "CREATED", reverse: false };
      case "best-selling":
        return { sortKey: "BEST_SELLING", reverse: false };
      case "title":
      case "alphabetical":
        return { sortKey: "TITLE", reverse: false };
      default:
        return { sortKey: undefined, reverse: undefined };
    }
  };

  // Client side refetching when searchParams or page changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (currentPage === 1 && initialPageInfo.endCursor) {
        pageCursors.current[2] = initialPageInfo.endCursor;
      }
      return;
    }

    let active = true;
    async function fetchCollection() {
      if (
        prevFilters.current.selectedDept !== selectedDept ||
        prevFilters.current.sortOption !== sortOption ||
        prevFilters.current.itemsPerPage !== itemsPerPage ||
        prevFilters.current.searchQuery !== searchQuery
      ) {
        pageCursors.current = { 1: null };
        prevFilters.current = { selectedDept, sortOption, itemsPerPage, searchQuery };
      }

      setLoading(true);
      const handle = selectedDept === "tutti" ? null : selectedDept;
      const { sortKey, reverse } = getSortParams(sortOption);
      const after = pageCursors.current[currentPage] || undefined;

      try {
        let res;
        if (searchQuery) {
          res = await searchProductsWithPagination({
            searchTerm: searchQuery,
            collectionHandle: handle,
            first: itemsPerPage,
            after,
            sortKey,
            reverse,
            locale,
          });
        } else if (handle === null) {
          res = await getProductsWithPagination({ first: itemsPerPage, after, sortKey, reverse, locale });
        } else {
          res = await getCollectionProducts(handle, itemsPerPage, after, sortKey, reverse, locale);
        }

        if (active) {
          setProductsState(res.products);
          setHasNextPage(res.pageInfo.hasNextPage);
          if (res.pageInfo.endCursor) {
            pageCursors.current[currentPage + 1] = res.pageInfo.endCursor;
          }
        }
      } catch (err) {
        console.error("Failed to load collection products on filter change:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCollection();

    return () => {
      active = false;
    };
  }, [selectedDept, currentPage, sortOption, itemsPerPage, searchQuery, initialPageInfo.endCursor, locale]);


  // Centralized Cart Handlers
  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = productsState.find((p) => p.id === productId);

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
  }, [productsState, addItem, removeItem, updateQuantity]);

  // Helper to push state changes to Next.js URL Router
  const updateFiltersInUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    if (!updates.hasOwnProperty("page")) {
      params.delete("page");
    }

    const queryString = params.toString();
    const newPath = queryString ? `/reparto?${queryString}` : "/reparto";
    router.push(newPath, { scroll: false });
  }, [searchParams, router]);

  // Pagination triggers
  const handlePageChange = (page: number) => {
    updateFiltersInUrl({ page: page === 1 ? null : String(page) });
  };

  // Toggles for filters
  const toggleDietary = (diet: string) => {
    const nextDietary = selectedDietary.includes(diet)
      ? selectedDietary.filter((d) => d !== diet)
      : [...selectedDietary, diet];
    updateFiltersInUrl({ dietary: nextDietary.length > 0 ? nextDietary.join(",") : null });
  };

  const clearAllFilters = () => {
    router.push("/reparto", { scroll: false });
  };

  // Filter & Sort Processing Pipeline
  const processedProducts = useMemo(() => {
    let result = [...productsState];

    result = result.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);

    if (onlyOrganic) {
      result = result.filter((p) => p.isOrganic);
    }

    if (selectedDietary.length > 0) {
      result = result.filter((p) => p.dietary && selectedDietary.includes(p.dietary));
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    if (sortOption === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [productsState, priceRange, onlyOrganic, selectedDietary, selectedBrands, sortOption]);

  const paginatedProducts = processedProducts;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-8 flex flex-col font-sans select-none antialiased">
      <DesktopNavbar onCategorySelect={(catId) => updateFiltersInUrl({ dept: catId })} />
      <MobileNavbar onCategorySelect={(catId) => updateFiltersInUrl({ dept: catId })} />

      <main className="flex-grow max-w-[1600px] w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 select-text text-slate-800">
        {/* Header Breadcrumbs & Category Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-3 select-none">
          <div className="space-y-1">
            <nav aria-label={t("nav.breadcrumbAria")} className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Link href="/" className="hover:text-emerald-700 transition-colors">{t("reparto.breadcrumbHome")}</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
              <span className="text-slate-900 font-bold">{t("reparto.breadcrumbReparti")}</span>
            </nav>
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 capitalize mt-1">
              {selectedDept === "tutti" ? t("reparto.allReparti") : getCategoryName(selectedDept, t)}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 self-start sm:self-auto">
            {t("reparto.foundProducts", { count: processedProducts.length })}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 items-start">
          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block space-y-6 sticky top-28 self-start overflow-y-auto pr-2 scrollbar-none select-none bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" /> {t("reparto.filterTitle")}
              </h3>
              <button onClick={clearAllFilters} className="text-[10px] font-extrabold text-slate-400 hover:text-emerald-700 uppercase tracking-wider transition-colors cursor-pointer">
                {t("reparto.filterReset")}
              </button>
            </div>
            <div className="space-y-2.5">
              <Sidebar customTree={categoryTree} />
            </div>

            {/* Price Max Filter */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">{t("reparto.priceMaxHeading")}</h4>
              <div className="space-y-2 px-1">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                  onMouseUp={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  onTouchEnd={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  className="w-full accent-emerald-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-xs font-semibold text-slate-900">
                  <span>€0</span>
                  <span className="text-emerald-700 font-extrabold">{t("reparto.priceMaxUntil", { price: localMaxPrice.toFixed(0) })}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Catalog Right Main Stage */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Catalog Main Toolbar (Filter Trigger, Sort Dropdown & Grid/List View Toggles) */}
            <div className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 p-2.5 rounded-2xl shadow-xs select-none">
              {/* Left: Mobile Filter trigger button with active badge */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl min-h-[44px]"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                  <span>
                    {t("reparto.filterTitle")} {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
                  </span>
                </Button>
              </div>

              {/* Right: Sort Dropdown & Layout View Toggles */}
              <div className="flex items-center gap-2.5 ml-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">{t("reparto.sortLabel")}</span>
                  <select
                    value={sortOption}
                    onChange={(e) => updateFiltersInUrl({ sort: e.target.value === "default" ? null : e.target.value })}
                    className="h-9 border border-slate-200 rounded-xl px-3 bg-white text-slate-800 text-xs font-bold shadow-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer"
                    aria-label={t("reparto.sortLabel")}
                  >
                    <option value="default">{t("reparto.sortOptions.default")}</option>
                    <option value="price-asc">{t("reparto.sortOptions.priceAsc")}</option>
                    <option value="price-desc">{t("reparto.sortOptions.priceDesc")}</option>
                    <option value="newest">{t("reparto.sortOptions.newest")}</option>
                    <option value="best-selling">{t("reparto.sortOptions.bestSelling")}</option>
                    <option value="title">{t("reparto.sortOptions.title")}</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    aria-label={t("reparto.gridViewAria")}
                    className={cn("h-7 w-7 p-0 rounded-lg cursor-pointer", viewMode === "grid" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("list")}
                    aria-label={t("reparto.listViewAria")}
                    className={cn("h-7 w-7 p-0 rounded-lg cursor-pointer", viewMode === "list" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedDept !== "tutti" || onlyOrganic || priceRange.max < 50 || selectedDietary.length > 0 || selectedBrands.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center text-xs bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-2xl select-none">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider shrink-0">{t("reparto.activeFiltersLabel")}</span>
                {selectedDept !== "tutti" && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
                    {getCategoryName(selectedDept, t)}
                    <button onClick={() => updateFiltersInUrl({ dept: null })} className="hover:text-rose-600 font-bold ml-1">✕</button>
                  </span>
                )}
                {onlyOrganic && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
                    Solo Bio
                    <button onClick={() => updateFiltersInUrl({ organic: null })} className="hover:text-rose-600 font-bold ml-1">✕</button>
                  </span>
                )}
                {priceRange.max < 50 && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
                    Fino a €{priceRange.max}
                    <button onClick={() => updateFiltersInUrl({ maxPrice: null })} className="hover:text-rose-600 font-bold ml-1">✕</button>
                  </span>
                )}
                {selectedDietary.map((diet) => (
                  <span key={diet} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-xs">
                    {getDietaryLabel(diet, t)}
                    <button onClick={() => toggleDietary(diet)} className="hover:text-rose-600 font-bold ml-1">✕</button>
                  </span>
                ))}
                <button onClick={clearAllFilters} className="text-[11px] font-extrabold text-slate-500 hover:text-emerald-700 underline underline-offset-2 ml-auto cursor-pointer">
                  {t("reparto.clearAllLabel")}
                </button>
              </div>
            )}

            {/* Main Products Grid/List Showcase */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-500">{t("reparto.loadingMessage")}</p>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center space-y-4 my-4 shadow-xs select-none">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="font-serif text-lg font-bold text-slate-900">{t("reparto.emptyTitle")}</h3>
                  <p className="text-xs text-slate-500 font-medium">{t("reparto.emptySubtitle")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="font-bold text-xs mt-2 rounded-xl">
                  {t("reparto.filterReset")}
                </Button>
              </div>
            ) : (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {paginatedProducts.map((prod) => (
                    <RepartoGridProductCard
                      key={prod.id}
                      product={prod}
                      onQuantityChange={handleQuantityChange}
                      onQuickView={(p) => { router.push(`/prodotto/${getProductHandle(p)}`); }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedProducts.map((prod) => (
                    <RepartoListViewCard
                      key={prod.id}
                      product={prod}
                      onQuantityChange={handleQuantityChange}
                      onQuickView={(p) => { router.push(`/prodotto/${getProductHandle(p)}`); }}
                    />
                  ))}
                </div>
              )
            )}

            {/* Pagination Controls */}
            {(currentPage > 1 || hasNextPage) && (
              <div className="flex justify-between items-center pt-8 border-t border-slate-200/80 select-none">
                <Button
                  variant="outline"
                  size="md"
                  disabled={currentPage === 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="font-bold text-xs rounded-xl min-h-[44px] min-w-[44px]"
                >
                  {t("reparto.prevPage")}
                </Button>
                <span className="text-xs font-semibold text-slate-500">
                  {t("reparto.pageInfo", { current: currentPage, total: hasNextPage ? currentPage + 1 : currentPage })}
                </span>
                <Button
                  variant="outline"
                  size="md"
                  disabled={!hasNextPage || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="font-bold text-xs rounded-xl min-h-[44px] min-w-[44px]"
                >
                  {t("reparto.nextPage")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Filters Sliding Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden select-none">
          <div onClick={() => setMobileFilterOpen(false)} className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs cursor-pointer" />
          <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white border-t border-slate-200 rounded-t-2xl shadow-2xl flex flex-col z-10">
            <div className="px-4 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-slate-900">{t("reparto.mobileFilterTitle")}</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto px-4 py-4 space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">{t("reparto.departmentsHeading")}</h4>
                <Sidebar customTree={categoryTree} />
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">{t("reparto.priceMaxHeadingMobile")}</h4>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                  onMouseUp={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  onTouchEnd={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  className="w-full accent-emerald-700 h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>€0</span>
                  <span className="text-emerald-700">{t("reparto.priceMaxUntil", { price: localMaxPrice.toFixed(2) })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between min-h-[44px]">
                <span className="text-xs font-bold text-slate-900">{t("reparto.onlyOrganicLabel")}</span>
                <button
                  type="button"
                  onClick={() => updateFiltersInUrl({ organic: onlyOrganic ? null : "true" })}
                  className={cn("relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors cursor-pointer", onlyOrganic ? "bg-emerald-700" : "bg-slate-200")}
                >
                  <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition", onlyOrganic ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">{t("reparto.mobileIntolerances")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {DIETARY_OPTIONS.map((diet) => {
                    const isChecked = selectedDietary.includes(diet);
                    return (
                      <button
                        key={diet}
                        onClick={() => toggleDietary(diet)}
                        className={cn("px-4 py-3 border rounded-xl text-xs font-semibold text-left flex justify-between items-center min-h-[44px] cursor-pointer", isChecked ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold" : "border-slate-200 bg-white text-slate-700")}
                      >
                        <span>{getDietaryLabel(diet, t)}</span>
                        {isChecked && <Check className="w-4 h-4 text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <Button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full h-12 text-sm font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md cursor-pointer"
              >
                {t("reparto.mobileShowResults", { count: processedProducts.length })}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Overlays */}
      <CartDrawer />

      <SearchOverlay
        products={productsState}
        onProductClick={(p) => {
          router.push(`/prodotto/${getProductHandle(p)}`);
        }}
        onAddToCart={(id) => handleQuantityChange(id, 1)}
        onSearchSubmit={(q) => {
          const params = new URLSearchParams(searchParams.toString());
          if (q.trim()) {
            params.set("q", q);
          } else {
            params.delete("q");
          }
          params.delete("page");
          router.push(`/reparto?${params.toString()}`);
        }}
      />

      <Notification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
