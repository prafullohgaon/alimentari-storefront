"use client";

import React, { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ArrowUpDown, Check, X, ChevronRight, LayoutGrid, List } from "lucide-react";
import { Footer } from "@/components/grocery/footer";
import { cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES, Product } from "@/lib/data";
import { getProductHandle } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/grocery/product-card";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { CartDrawer } from "@/components/grocery/cart-drawer";
import { SearchOverlay } from "@/components/grocery/search-overlay";
import { Notification } from "@/components/grocery/notification";
import { useCartStore } from "@/store/cart";
import RepartoLoading from "./loading";

const DIETARY_OPTIONS = ["Gluten Free", "Vegan", "Senza Lattosio", "Bio"];
const BRAND_OPTIONS = ["Antico Frantoio", "Pastificio Liguori", "Consorzio Parmigiano", "Salumificio Devodier", "Sicilia Antica", "Castello di Brolio", "Verde Natura"];

function RepartoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Page UI Toast notification
  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // Mobile Drawer Toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 1. Derive Filter state directly from URL Query Search parameters
  const selectedDept = searchParams.get("dept") || "tutti";
  const onlyOrganic = searchParams.get("organic") === "true";
  
  const priceRange = useMemo(() => {
    const min = Number(searchParams.get("minPrice")) || 0;
    const max = Number(searchParams.get("maxPrice")) || 50;
    return { min, max };
  }, [searchParams]);

  const sortOption = searchParams.get("sort") || "default";
  const currentPage = Number(searchParams.get("page")) || 1;
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const selectedDietary = useMemo(() => {
    const val = searchParams.get("dietary");
    return val ? val.split(",") : [];
  }, [searchParams]);

  const selectedBrands = useMemo(() => {
    const val = searchParams.get("brands");
    return val ? val.split(",") : [];
  }, [searchParams]);

  // Local state for price range slider to prevent history log flooding during drag
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(50);

  useEffect(() => {
    setLocalMaxPrice(priceRange.max);
  }, [priceRange.max]);

  // Zustand Global Cart Store integrations
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  // Centralized Cart Handlers
  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = PRODUCTS.find((p) => p.id === productId);

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
  }, [addItem, removeItem, updateQuantity]);

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

    // Reset pagination on search filter change
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

  const toggleBrand = (brand: string) => {
    const nextBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    updateFiltersInUrl({ brands: nextBrands.length > 0 ? nextBrands.join(",") : null });
  };

  const clearAllFilters = () => {
    router.push("/reparto", { scroll: false });
  };

  // Filter & Sort Processing Pipeline
  const processedProducts = useMemo(() => {
    let result = [...PRODUCTS];

    // 1. Department Filter
    if (selectedDept !== "tutti") {
      result = result.filter(
        (p) => p.category.toLowerCase() === selectedDept.toLowerCase()
      );
    }

    // 2. Price Bound Filter
    result = result.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);

    // 3. Organic Only Filter
    if (onlyOrganic) {
      result = result.filter((p) => p.isOrganic);
    }

    // 4. Dietary Checklist Filter
    if (selectedDietary.length > 0) {
      result = result.filter((p) => p.dietary && selectedDietary.includes(p.dietary));
    }

    // 5. Brands Checklist Filter
    if (selectedBrands.length > 0) {
      result = result.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    // 6. Sorting
    if (sortOption === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [selectedDept, priceRange, onlyOrganic, selectedDietary, selectedBrands, sortOption]);

  // Paginated Slices
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(start, start + itemsPerPage);
  }, [processedProducts, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 flex flex-col font-sans">
      <DesktopNavbar onCategorySelect={(catId) => updateFiltersInUrl({ dept: catId })} />
      <MobileNavbar onCategorySelect={(catId) => updateFiltersInUrl({ dept: catId })} />

      <main className="flex-grow max-w-[1600px] w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3 select-none">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 stroke-[2.5]" />
              <span className="text-foreground font-bold">Reparti Spesa</span>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground capitalize mt-2">
              {selectedDept === "tutti" ? "Tutti i Reparti" : selectedDept}
            </h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Trovati <strong className="text-foreground">{processedProducts.length}</strong> prodotti
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <aside className="hidden lg:block space-y-6 sticky top-28 self-start overflow-y-auto pr-2 scrollbar-none select-none bg-card rounded-lg shadow-md">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" /> Filtra
              </h3>
              <button onClick={clearAllFilters} className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors">
                Resetta
              </button>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Reparti</h4>
              <div className="flex flex-col gap-1.5 font-semibold text-sm">
                <button
                  onClick={() => { updateFiltersInUrl({ dept: "tutti" }); }}
                  className={cn("text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center", selectedDept === "tutti" ? "bg-primary text-primary-foreground" : "hover:bg-muted/10 text-muted-foreground hover:text-foreground")}
                >
                  <span>Tutti</span>
                  <span className="text-xs opacity-75">{PRODUCTS.length}</span>
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { updateFiltersInUrl({ dept: cat.id }); }}
                    className={cn("text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center capitalize", selectedDept === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted/10 text-muted-foreground hover:text-foreground")}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-75">{cat.itemCount}</span>
                  </button>
                ))}
               </div>
            </div>
            <div className="space-y-2.5 pt-4 border-t border-border/60">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Prezzo Max</h4>
              <div className="space-y-2 px-1">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                  onMouseUp={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  onTouchEnd={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-border rounded-lg"
                />
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>€0</span>
                  <span className="text-primary font-bold">€{localMaxPrice.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-1 space-y-2">
            <div className="flex items-center justify-between gap-4 bg-card border border-border/50 p-1 rounded-xl">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setViewMode("grid")} className={cn("h-8 w-8 p-0", viewMode === "grid" && "bg-muted")}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className={cn("h-8 w-8 p-0", viewMode === "list" && "bg-muted")}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                <span>Per pagina:</span>
                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-transparent border-none outline-none text-foreground cursor-pointer">
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>

            {(selectedDept !== "tutti" || onlyOrganic || priceRange.max < 50 || selectedDietary.length > 0 || selectedBrands.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center animate-fadeIn">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">Filtri attivi:</span>
                {selectedDept !== "tutti" && (
                  <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1.5 rounded-full text-xs font-bold border bg-primary/5 text-primary border-primary/20 select-none">
                    {CATEGORIES.find(c => c.id === selectedDept)?.name || selectedDept}
                    <button onClick={() => updateFiltersInUrl({ dept: null })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/15 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {onlyOrganic && (
                  <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1.5 rounded-full text-xs font-bold border bg-primary/5 text-primary border-primary/20 select-none">
                    Solo Biologico
                    <button onClick={() => updateFiltersInUrl({ organic: null })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/15 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {priceRange.max < 50 && (
                  <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1.5 rounded-full text-xs font-bold border bg-primary/5 text-primary border-primary/20 select-none">
                    Max €{priceRange.max}
                    <button onClick={() => updateFiltersInUrl({ maxPrice: null })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/15 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {selectedDietary.map((diet) => (
                  <span key={diet} className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1.5 rounded-full text-xs font-bold border bg-primary/5 text-primary border-primary/20 select-none">
                    {diet}
                    <button onClick={() => toggleDietary(diet)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/15 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {selectedBrands.map((brand) => (
                  <span key={brand} className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1.5 rounded-full text-xs font-bold border bg-primary/5 text-primary border-primary/20 select-none">
                    {brand}
                    <button onClick={() => toggleBrand(brand)} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/15 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <button onClick={clearAllFilters} className="text-[10px] font-bold text-muted hover:text-primary transition-colors underline underline-offset-2 ml-1">
                  Azzera tutto
                </button>
              </div>
            )}

            {paginatedProducts.length === 0 ? (
              <div className="py-20 text-center select-none bg-card border border-border rounded-2xl shadow-soft">
                <h4 className="font-serif text-lg font-semibold mb-1">Nessun prodotto corrisponde ai filtri</h4>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto mb-6">
                  Prova a resettare o allargare i filtri per visualizzare le specialità.
                </p>
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Resetta Filtri
                </Button>
              </div>
            ) : (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {paginatedProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      quantityInCart={cart.find((item) => item.product.id === prod.id)?.quantity || 0}
                      onQuantityChange={handleQuantityChange}
                      onQuickView={(p) => { router.push(`/prodotto/${getProductHandle(p)}`); }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  {paginatedProducts.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      quantityInCart={cart.find((item) => item.product.id === prod.id)?.quantity || 0}
                      onQuantityChange={handleQuantityChange}
                      onQuickView={(p) => { router.push(`/prodotto/${getProductHandle(p)}`); }}
                    />
                  ))}
                </div>
              )
            )}

            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-8 border-t border-border/60 select-none">
                <Button variant="outline" size="md" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="font-bold text-xs">Precedente</Button>
                <span className="text-xs font-semibold text-muted-foreground">Pagina <strong className="text-foreground">{currentPage}</strong> di {totalPages}</span>
                <Button variant="outline" size="md" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="font-bold text-xs">Successivo</Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col md:hidden animate-fadeIn select-none">
          <div onClick={() => setMobileFilterOpen(false)} className="fixed inset-0 bg-espresso/50 backdrop-blur-sm cursor-pointer" />
          <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-card border-t border-border rounded-t-2xl shadow-elevation flex flex-col z-10">
            <div className="px-4 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold">Filtra e Ordina</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted/15 btn-touch-active">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto px-4 py-4 space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Reparti</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFiltersInUrl({ dept: "tutti" })}
                    className={cn("px-4 py-2.5 rounded-lg text-xs font-semibold border min-h-[44px] flex items-center justify-center", selectedDept === "tutti" ? "bg-primary border-primary text-white" : "border-border bg-card")}
                  >
                    Tutti ({PRODUCTS.length})
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateFiltersInUrl({ dept: cat.id })}
                      className={cn("px-4 py-2.5 rounded-lg text-xs font-semibold border capitalize min-h-[44px] flex items-center justify-center", selectedDept === cat.id ? "bg-primary border-primary text-white" : "border-border bg-card")}
                    >
                      {cat.name} ({cat.itemCount})
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Prezzo Massimo</h4>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                  onMouseUp={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  onTouchEnd={() => updateFiltersInUrl({ maxPrice: String(localMaxPrice) })}
                  className="w-full accent-primary h-1.5 bg-border rounded-lg"
                />
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <span>€0</span>
                  <span className="text-primary">Fino a €{localMaxPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <span className="text-xs font-bold text-foreground">Solo Biologico</span>
                <button
                  type="button"
                  onClick={() => updateFiltersInUrl({ organic: onlyOrganic ? null : "true" })}
                  className={cn("relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors", onlyOrganic ? "bg-success" : "bg-border")}
                >
                  <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition", onlyOrganic ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Intolleranze & Preferenze</h4>
                <div className="grid grid-cols-2 gap-2">
                  {DIETARY_OPTIONS.map((diet) => {
                    const isChecked = selectedDietary.includes(diet);
                    return (
                      <button
                        key={diet}
                        onClick={() => toggleDietary(diet)}
                        className={cn("px-4 py-3 border rounded-lg text-xs font-semibold text-left flex justify-between items-center min-h-[44px]", isChecked ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground")}
                      >
                        <span>{diet}</span>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-card">
              <Button
                onClick={() => setMobileFilterOpen(false)}
                variant="primary"
                className="w-full h-12 text-sm font-bold shadow-soft"
              >
                Mostra {processedProducts.length} Risultati
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Overlays */}
      <CartDrawer />

      <SearchOverlay
        products={PRODUCTS}
        onProductClick={(p) => {
          router.push(`/prodotto/${getProductHandle(p)}`);
        }}
        onAddToCart={(id) => handleQuantityChange(id, 1)}
        onSearchSubmit={() => {}}
      />

      <Notification
        toast={toast}
        onClose={() => setToast(null)}
      />

    </div>
  );
}

export default function RepartoPage() {
  return (
    <Suspense fallback={<RepartoLoading />}>
      <RepartoContent />
    </Suspense>
  );
}
