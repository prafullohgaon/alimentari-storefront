"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  X,
  History,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
  Leaf,
  Sparkles
} from "lucide-react";
import { Product } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface SearchOverlayProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (productId: string) => void;
  onSearchSubmit: (query: string) => void;
}

const TRENDING_SEARCHES = [
  "Olio Extra Vergine",
  "Pecorino Romano DOP",
  "Chianti Classico DOCG",
  "Focaccia calda",
  "Tartufo Bianco",
  "Limoni di Sorrento",
];

const DIETARY_QUICK_FILTERS = ["Bio", "Gluten Free", "Vegan", "Senza Lattosio"];

export function SearchOverlay({
  products,
  onProductClick,
  onAddToCart,
  onSearchSubmit,
}: SearchOverlayProps) {
  // Read open state and close action directly from the global UI store
  const isOpen = useUiStore((state) => state.searchOpen);
  const onClose = useUiStore((state) => state.closeSearch);

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Pasta Gragnano",
    "Parmigiano Reggiano",
    "Prosciutto di Parma",
  ]);
  const [recentViewed, setRecentViewed] = useState<Product[]>([]);

  // Active Shopify search suggestions state
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  // Simulation loading state for premium high-performance headless autocomplete
  const [isLoading, setIsLoading] = useState(false);
  
  // Quick filters inside overlay
  const [activeDietary, setActiveDietary] = useState<string | null>(null);

  // Keyboard navigation suggested list indexing
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto focus input and load recent viewed items
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);

      // Load mock recently viewed items
      const mockViews = products.filter((p) => p.id === "1" || p.id === "3" || p.id === "8");
      setRecentViewed(mockViews);
    } else {
      setQuery("");
      setSuggestedProducts([]);
      setActiveDietary(null);
      setSelectedIndex(-1);
    }
  }, [isOpen, products]);


  const searchRef = useFocusTrap({ active: isOpen, onEscape: onClose });

  // Cleanup pending search timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const handleQueryChange = async (val: string) => {
    setQuery(val);
    setSelectedIndex(-1);

    if (val.trim()) {
      setIsLoading(true);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(async () => {
        try {
          const { searchProducts } = await import("@/lib/shopify");
          const { trackSearch } = await import("@/lib/analytics");
          const results = await searchProducts(val);
          setSuggestedProducts(results);
          trackSearch(val, results.length);
        } catch (e) {
          console.error("Search API failed:", e);
        } finally {
          setIsLoading(false);
        }
      }, 350); // 350ms of modern micro-shimmer transition
    } else {
      setIsLoading(false);
      setSuggestedProducts([]);
    }
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
  };

  const handleSearchClick = (search: string) => {
    setQuery(search);
    handleQueryChange(search);
    onSearchSubmit(search);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (!recentSearches.includes(query.trim())) {
        setRecentSearches((prev) => [query.trim(), ...prev.slice(0, 4)]);
      }
      onSearchSubmit(query);
    }
  };

  // Filter matching suggestions (incorporating quick dietary tags too)
  const displayedProducts = activeDietary
    ? suggestedProducts.filter((p) => p.dietary === activeDietary)
    : suggestedProducts;

  const suggestedCategories = Array.from(
    new Set(suggestedProducts.map((p) => p.category))
  );

  const groupedProducts = React.useMemo(() => {
    const groups: Record<string, Product[]> = {};
    displayedProducts.forEach((p) => {
      if (!groups[p.category]) {
        groups[p.category] = [];
      }
      groups[p.category].push(p);
    });
    return groups;
  }, [displayedProducts]);

  // Keyboard navigation keyboard triggers
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (!isOpen || isLoading || displayedProducts.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < displayedProducts.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedProducts.length - 1));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < displayedProducts.length) {
          e.preventDefault();
          const targetProduct = displayedProducts[selectedIndex];
          onProductClick(targetProduct);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [isOpen, isLoading, displayedProducts, selectedIndex, onProductClick, onClose]);

  // Text highlight helper for search suggestions
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, idx) =>
          regex.test(part) ? (
            <mark key={idx} className="bg-primary/10 text-primary font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      ref={searchRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-[100] bg-[#FAF7F2] flex flex-col animate-fadeIn select-none"
    >
      <h2 id="search-modal-title" className="sr-only">Ricerca Prodotti</h2>
      
      {/* 1. Sticky Premium Header Bar */}
      <div className="border-b border-[#EFECE6] bg-white px-4 md:px-6 h-16 flex items-center justify-between gap-4 select-none">
        <form onSubmit={handleFormSubmit} className="flex-grow max-w-3xl mx-auto flex items-center relative">
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground stroke-[2.5]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Cerca specialità DOP, pasta fresca, formaggi..."
            className="w-full h-11 bg-[#FAF7F2] border border-[#EFECE6] rounded-xl pl-12 pr-10 text-base outline-none focus:border-[#1C3B2B] focus:ring-1 focus:ring-[#1C3B2B] transition-all font-medium text-[#181816] placeholder:text-muted/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              className="absolute right-4 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/20 text-muted-foreground transition-all"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </form>

        <button
          onClick={onClose}
          className="h-10 px-4 rounded-lg font-bold text-sm text-[#1C3B2B] hover:bg-muted/15 flex items-center justify-center gap-1.5 transition-all select-none btn-touch-active"
        >
          <span>Chiudi</span>
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Scrollable Search Contents Body */}
      <div className="flex-grow overflow-y-auto bg-[#FAF7F2]/50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 select-text">
          
          {/* A. If empty query, show Recent viewed, recent searches & trendings */}
          {!query ? (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Double Column Widget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline select-none">
                      <h4 className="text-xs font-bold text-[#1C3B2B] uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4 stroke-[2]" />
                        Ricerche Recenti
                      </h4>
                      <button
                        onClick={handleClearRecent}
                        className="text-[10px] font-bold text-muted-foreground hover:text-error transition-colors uppercase tracking-wider"
                      >
                        Cancella
                      </button>
                    </div>
                    <div className="flex flex-col border border-[#EFECE6] rounded-xl bg-white overflow-hidden shadow-sm">
                      {recentSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => handleSearchClick(search)}
                          className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-muted/5 border-b border-[#EFECE6]/60 last:border-b-0 text-foreground transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{search}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 stroke-[2.5]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending searches */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#1C3B2B] uppercase tracking-widest flex items-center gap-2 select-none">
                    <TrendingUp className="w-4 h-4 stroke-[2]" />
                    Ricerche Frequenti
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearchClick(search)}
                        className="px-4 py-2 text-sm font-semibold border border-[#EFECE6] hover:border-[#1C3B2B] bg-white rounded-full transition-all duration-150 shadow-soft"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Spesa Frequente staples list (Italian realism & trust) */}
              {recentViewed.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-[#EFECE6]/60 select-none">
                  <h4 className="text-xs font-bold text-[#1C3B2B] uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C9623B] stroke-[2]" />
                    Spesa Frequente & Preferiti
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {recentViewed.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onProductClick(p);
                          onClose();
                        }}
                        className="border border-[#EFECE6]/80 rounded-xl p-3 bg-white hover:border-[#1C3B2B]/60 transition-all cursor-pointer flex gap-3 items-center shadow-soft"
                      >
                        <div className="w-10 h-10 relative flex-shrink-0">
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-cover rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                              e.currentTarget.srcset = "";
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-serif font-bold text-xs text-foreground truncate block">
                            {p.name}
                          </h5>
                          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                            €{p.price.toFixed(2)} • <span className="text-success font-bold">Acquistato</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : isLoading ? (
            /* B. SHIMMER SKELETON SEARCHING TRANSITION (Predictive autocomplete wow experience) */
            <div className="space-y-6 animate-fadeIn select-none">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Ricerca in corso...
              </h4>
              <div className="border border-[#EFECE6] rounded-xl bg-white overflow-hidden divide-y divide-border/60 shadow-sm">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 items-center">
                    <Skeleton className="w-16 h-16 rounded-lg bg-muted/30" />
                    <div className="flex-grow space-y-2">
                      <Skeleton className="h-4 w-2/3 bg-muted/30" />
                      <Skeleton className="h-3 w-1/4 bg-muted/30" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* C. MATCHED RESULTS PANEL */
            <div className="space-y-6 animate-fadeIn">
              
              {/* Category and Dietary Chips Filter strip inside search overlay */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none pb-2 border-b border-[#EFECE6]/60">
                <div className="flex items-center gap-2">
                  {suggestedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedCategories.slice(0, 2).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            onSearchSubmit(cat);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-[#1C3B2B]/5 border border-[#1C3B2B]/20 text-[#1C3B2B] rounded hover:bg-[#1C3B2B]/10 transition-colors"
                        >
                          Reparto {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dietary filters inside search */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Filtra:</span>
                  <div className="flex gap-1 overflow-x-auto scrollbar-none">
                    {DIETARY_QUICK_FILTERS.map((diet) => {
                      const isActive = activeDietary === diet;
                      return (
                        <button
                          key={diet}
                          onClick={() => setActiveDietary(isActive ? null : diet)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border transition-all whitespace-nowrap",
                            isActive
                              ? "bg-[#1C3B2B] border-[#1C3B2B] text-white"
                              : "bg-white border-[#EFECE6] text-muted-foreground hover:border-primary"
                          )}
                        >
                          {diet}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Match Output list */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-baseline select-none">
                  <h4 className="text-[10px] font-bold text-[#1C3B2B] uppercase tracking-widest">
                    Prodotti Trovati ({displayedProducts.length})
                  </h4>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Premi ArrowUp/Down e Invio per navigare con la tastiera
                  </span>
                </div>

                {displayedProducts.length === 0 ? (
                  /* Empty state inside results */
                  <div className="py-16 text-center select-none bg-white border border-[#EFECE6] rounded-2xl shadow-soft max-w-md mx-auto space-y-4">
                    <div className="w-12 h-12 bg-secondary/40 rounded-full flex items-center justify-center text-primary mx-auto">
                      <Leaf className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Nessun abbinamento gastronomico per &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
                        Prova ad allentare i filtri o cerca termini più generici (es. Olio, Pasta, Bio).
                      </p>
                    </div>
                    <button
                      onClick={() => handleQueryChange("")}
                      className="text-xs font-bold text-primary underline"
                    >
                      Resetta Ricerca
                    </button>
                  </div>
                ) : (
                  /* Category-Grouped Suggestions (Visually Lightweight) */
                  <div className="space-y-6 select-none">
                    {Object.entries(groupedProducts).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        {/* Group Category Header */}
                        <div className="flex items-center gap-3 px-1 select-none">
                          <span className="text-[9px] font-bold text-[#1C3B2B] uppercase tracking-widest bg-[#E2EAE5]/60 px-2 py-0.5 rounded-full">
                            Reparto {category}
                          </span>
                          <div className="flex-grow h-px bg-[#EFECE6]/80" />
                        </div>

                        {/* Items container */}
                        <div className="divide-y divide-[#EFECE6]/80 border border-[#EFECE6] rounded-xl bg-white overflow-hidden shadow-soft">
                          {items.map((p) => {
                            const flatIndex = displayedProducts.findIndex((item) => item.id === p.id);
                            const isKeyboardSelected = selectedIndex === flatIndex;
                            const isLowStock = p.stock && p.stock <= 15;

                            return (
                              <div
                                key={p.id}
                                onMouseEnter={() => setSelectedIndex(flatIndex)}
                                className={cn(
                                  "flex gap-4 p-4 group transition-all duration-150",
                                  isKeyboardSelected ? "bg-[#1C3B2B]/5 border-l-4 border-l-[#1C3B2B] pl-3" : "hover:bg-muted/5"
                                )}
                              >
                                {/* Thumbnail */}
                                <div
                                  onClick={() => {
                                    onProductClick(p);
                                    onClose();
                                  }}
                                  className="w-16 h-16 rounded-xl overflow-hidden border border-[#EFECE6] flex-shrink-0 bg-muted/10 cursor-pointer relative"
                                >
                                  <Image
                                    src={p.imageUrl}
                                    alt={p.name}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                                      e.currentTarget.srcset = "";
                                    }}
                                  />
                                </div>

                                {/* Details content */}
                                <div className="flex-grow min-w-0 flex flex-col justify-between select-text">
                                  <div
                                    onClick={() => {
                                      onProductClick(p);
                                      onClose();
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between gap-2 select-none">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                          {p.brand}
                                        </span>
                                        {p.isOrganic && (
                                          <span className="text-[8px] font-extrabold text-success uppercase bg-success/5 px-1.5 py-0.2 rounded border border-success/10">
                                            Bio
                                          </span>
                                        )}
                                      </div>
                                      {p.rating && (
                                        <div className="flex items-center gap-0.5 text-warning text-[10px] font-bold">
                                          <span>★</span>
                                          <span className="text-foreground">{p.rating.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <h5 className="font-serif text-base font-bold leading-tight text-foreground truncate pr-6 group-hover:text-[#1C3B2B] transition-colors mt-1">
                                      {highlightText(p.name, query)}
                                    </h5>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-semibold">
                                      <span>{p.unit}</span>
                                      {isLowStock && (
                                        <span className="text-[#C9623B] font-bold text-[9px] uppercase tracking-wider">
                                          • Solo {p.stock} rimasti
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-4 mt-2.5 select-none">
                                    <span className="font-bold text-sm text-foreground">€{p.price.toFixed(2)}</span>
                                    <button
                                      onClick={() => onAddToCart(p.id)}
                                      className="h-8 px-3.5 bg-[#1C3B2B] hover:bg-[#1C3B2B]/90 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                                      Aggiungi
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
