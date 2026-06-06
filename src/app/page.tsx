"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Sparkles, Truck, Leaf, Gift, Mail, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { PRODUCTS, CATEGORIES, Product } from "@/lib/data";
import { getProductHandle } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/grocery/product-card";
import { CategoryCard } from "@/components/grocery/category-card";
import { MobileBottomNav } from "@/components/grocery/mobile-bottom-nav";
import { CartDrawer } from "@/components/grocery/cart-drawer";
import { ProductModal } from "@/components/grocery/product-modal";
import { Notification } from "@/components/grocery/notification";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { SearchOverlay } from "@/components/grocery/search-overlay";
import { Footer } from "@/components/grocery/footer";

import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";

// Static hero data — module-level to prevent recreation on every render
const HERO_SLIDES = [
  {
    badge: "✨ Speciale Puglia",
    title: "Olio Coratina & Focaccia Baresi",
    description: "Scopri il sapore intenso delle olive Coratina estratte a freddo abbinato alla sofficità della focaccia barese cotta in forno a legna.",
    image: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?q=80&w=800&auto=format&fit=crop",
    btnText: "Fai la Spesa",
    link: "/reparto?dept=dispensa"
  },
  {
    badge: "🍷 Bollicine & Salumi",
    title: "Franciacorta DOCG & Delicatessen",
    description: "Il binomio perfetto per i tuoi aperitivi di lusso: bollicine Millesimate e Prosciutto di Parma DOP stagionato 18 mesi.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800&auto=format&fit=crop",
    btnText: "Scopri Enoteca",
    link: "/reparto?dept=enoteca"
  },
  {
    badge: "🧀 I Maestri Caseari",
    title: "Parmigiano DOP & Bufala Campana",
    description: "Selezionati dai migliori caseifici locali: Mozzarella di Bufala freschissima e Parmigiano stagionato 30 mesi ricchissimo di aromi.",
    image: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?q=80&w=800&auto=format&fit=crop",
    btnText: "Ordina Latticini",
    link: "/reparto?dept=latticini%20&%20salumi"
  }
];
const HERO_COUNT = HERO_SLIDES.length;

export default function Home() {
  const router = useRouter();
  // Page UI States
  const [activeTab, setActiveTab] = useState<"shop" | "search" | "cart" | "account">("shop");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // Rotating Hero Slider State
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_COUNT);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = useCallback(() => {
    setHeroIndex((prev) => (prev - 1 + HERO_COUNT) % HERO_COUNT);
  }, []);

  const handleNextSlide = useCallback(() => {
    setHeroIndex((prev) => (prev + 1) % HERO_COUNT);
  }, []);

  // Zustand Global Cart Store integration
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  // Centralized Cart Handlers
  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = PRODUCTS.find((p) => p.id === productId);

    // Fire toast notification for new additions (not quantity changes)
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

  // Synchronize bottom tab highlights with global overlay openings
  const cartOpen = useUiStore((state) => state.cartOpen);
  const searchOpen = useUiStore((state) => state.searchOpen);

  useEffect(() => {
    if (cartOpen) {
      setActiveTab("cart");
    } else if (searchOpen) {
      setActiveTab("search");
    } else {
      setActiveTab("shop");
    }
  }, [cartOpen, searchOpen]);

  // High-Density Categories & Shelves Filtering
  const hotDeals = PRODUCTS.filter((p) => p.originalPrice && p.originalPrice > p.price).slice(0, 4);
  const milanPopular = PRODUCTS.filter((p) => Number(p.id) % 2 === 0).slice(0, 4);
  const organicEssentials = PRODUCTS.filter((p) => p.isOrganic).slice(0, 4);
  const newArrivals = PRODUCTS.slice(4, 8);
  const wineCollection = PRODUCTS.filter((p) => p.category === "Enoteca").slice(0, 4);
  const chefRecommend = PRODUCTS.filter((p) => p.tags?.includes("Trafilata a Bronzo") || p.tags?.includes("Estratto a Freddo") || p.id === "10").slice(0, 4);
  
  // Returning Customer Simulated Shelves
  const buyAgain = [PRODUCTS[0], PRODUCTS[1], PRODUCTS[10]]; // Olio, Paccheri, Mozzarella
  const recentlyViewed = [PRODUCTS[2], PRODUCTS[11]]; // Parmigiano, Franciacorta

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 flex flex-col font-sans">
      
      {/* 1. Flash Offer Ticker Ribbon */}
      <div className="bg-accent text-accent-foreground py-2 px-4 text-center text-xs font-bold tracking-wide select-none animate-fadeIn">
        🔥 OFFERTE VOLANTINO: Mozzarella di Bufala DOP a soli €5,90 e Detersivo Piatti Eco a -25%. Valido solo questa settimana!
      </div>

      {/* 2. Responsive Header System */}
      <DesktopNavbar
        onCategorySelect={() => {}}
      />

      <MobileNavbar
        onCategorySelect={() => {}}
      />


      {/* 3. High-Density Homepage Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-10">
        
        {/* HOMEPAGE SECTION 1: World-Class Interactive Rotating Hero Slider */}
        <section className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-premium relative h-[420px] md:h-[460px] select-none flex items-center">
          {/* Background image display */}
          <div className="absolute inset-0 z-0">
            <Image
              src={HERO_SLIDES[heroIndex].image}
              alt={HERO_SLIDES[heroIndex].title}
              fill
              sizes="100vw"
              className="object-cover transition-all duration-1000 ease-in-out filter brightness-[0.8]"
              priority={true}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/60 to-transparent" />
          </div>

          {/* Left Arrow */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
            aria-label="Slide precedente"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNextSlide}
            className="absolute right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
            aria-label="Prossima slide"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Content Block */}
          <div className="relative z-10 pl-6 pr-6 md:pl-16 max-w-2xl text-white space-y-5">
            <Badge variant="success" className="bg-white/15 backdrop-blur-md text-white border-white/25 py-1 px-3.5 font-bold text-[10px] tracking-wider uppercase">
              {HERO_SLIDES[heroIndex].badge}
            </Badge>
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              {HERO_SLIDES[heroIndex].title}
            </h2>
            <p className="text-sm text-white/90 leading-relaxed max-w-md font-medium">
              {HERO_SLIDES[heroIndex].description}
            </p>
            <div className="flex gap-3 pt-2">
              <Link href={HERO_SLIDES[heroIndex].link}>
                <Button variant="accent" size="lg" className="font-bold text-xs h-12 shadow-soft px-8">
                  {HERO_SLIDES[heroIndex].btnText}
                </Button>
              </Link>
            </div>
          </div>

          {/* Indicator dots bottom */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  heroIndex === idx ? "bg-white w-6" : "bg-white/40"
                }`}
                aria-label={`Slide index ${idx}`}
              />
            ))}
          </div>
        </section>

        {/* HOMEPAGE SECTION 2: Swipeable Department Categories */}
        <section className="space-y-4">
          <div className="flex justify-between items-baseline select-none">
            <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Esplora i Reparti Spesa
            </h3>
            <Link href="/reparto" className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Vedi Tutti ({CATEGORIES.length})
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x touch-pan-x px-4 -mx-4 md:px-0 md:mx-0 md:grid md:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="snap-start flex-shrink-0 w-[180px] md:w-auto">
                <CategoryCard
                  category={cat}
                  onClick={() => {
                    router.push(`/reparto?dept=${cat.id}`);
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* MOCK RETURNING USER SECTION (Highly realistic buy again staple lists) */}
        <section className="bg-secondary/15 rounded-3xl p-6 md:p-8 border border-[#EFECE6] select-none space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1C3B2B] text-white font-bold flex items-center justify-center text-sm shadow-soft">
                RM
              </div>
              <div>
                <h3 className="font-serif text-lg md:text-xl font-bold text-foreground">
                  Bentornato, Ronan! Acquista di Nuovo
                </h3>
                <p className="text-[10px] md:text-xs text-muted-foreground font-semibold">
                  I tuoi articoli preferiti acquistati regolarmente in base alle spese precedenti.
                </p>
              </div>
            </div>
            <button
              onClick={() => alert("Reordering all staples...")}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Riordina Tutto
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {buyAgain.map((prod) => {
              const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
              return (
                <div key={prod.id} className="bg-white p-3 rounded-2xl border border-border shadow-soft flex items-center gap-3.5">
                  <div className="w-16 h-16 relative flex-shrink-0 rounded-xl overflow-hidden border bg-[#FAF7F2]">
                    <Image
                      src={prod.imageUrl}
                      alt={prod.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                        e.currentTarget.srcset = "";
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-grow flex flex-col justify-between h-16">
                    <div>
                      <h4 className="font-serif font-bold text-xs truncate leading-snug">{prod.name}</h4>
                      <span className="text-[10px] text-muted-foreground block">{prod.unit}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-bold text-primary">€{prod.price.toFixed(2)}</span>
                      {cartQty === 0 ? (
                        <button
                          onClick={() => handleQuantityChange(prod.id, 1)}
                          className="bg-[#1C3B2B] text-white hover:bg-[#1C3B2B]/90 font-bold text-[10px] py-1 px-2.5 rounded-lg active:scale-95 transition-all shadow-sm"
                        >
                          + Aggiungi
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/15 px-2 py-0.5 rounded">
                          Nel Carrello ({cartQty})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOMEPAGE SECTION 3: Asymmetrical Editorial Banners (Premium Gastronomy storytelling) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
          {/* Main Editorial Spotlight: Alba & Chianti (8 Columns) */}
          <div className="lg:col-span-8 bg-[#FAF7F2] rounded-2xl border border-[#EFECE6] overflow-hidden shadow-soft flex flex-col md:flex-row justify-between relative group min-h-[240px]">
            <div className="p-6 md:p-8 flex flex-col justify-between z-10 md:max-w-[55%] space-y-4">
              <div className="space-y-2">
                <Badge variant="primary" className="bg-primary/95 font-bold text-[9px] uppercase tracking-widest text-primary-foreground py-0.5 px-2">
                  La Caccia d&apos;Autunno
                </Badge>
                <h4 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                  Tartufo d&apos;Alba & <br />
                  Grandi Rossi Toscani
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  Il profumo avvolgente del Tartufo Bianco Pregiato d&apos;Alba incontra le note fruttate del Chianti Classico Riserva DOCG. Un connubio raro di profonda tradizione boschiva piemontese e collina toscana.
                </p>
              </div>
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    router.push("/reparto?dept=dispensa");
                  }}
                  className="font-bold text-xs"
                >
                  Esplora Selezione
                </Button>
              </div>
            </div>
            
            <div className="md:w-[45%] h-[180px] md:h-full relative overflow-hidden bg-muted/10 border-t md:border-t-0 md:border-l border-border/60">
              <Image
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop"
                alt="Selected red wines and truffles"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover group-hover:scale-[1.015] transition-transform duration-700 ease-expo-out"
              />
            </div>
          </div>

          {/* Secondary Editorial Spotlight: Bronte & Modena (4 Columns) */}
          <div className="lg:col-span-4 bg-[#E2EAE5]/40 rounded-2xl border border-[#EFECE6] p-6 flex flex-col justify-between shadow-soft min-h-[240px] relative overflow-hidden group">
            <div className="space-y-3 z-10 relative">
              <Badge variant="accent" className="font-bold text-[9px] uppercase tracking-widest py-0.5 px-2 text-white">
                Eccellenze del Sud & Centro
              </Badge>
              <h4 className="font-serif text-2xl font-bold tracking-tight text-foreground leading-tight">
                Pistacchio di Bronte & <br />
                Balsamico Invecchiato
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                La dolcezza vulcanica dell&apos;Oro Verde dell&apos;Etna unita alla complessità sciropposa dell&apos;Aceto Balsamico Tradizionale di Modena IGP.
              </p>
            </div>
            
            <div className="z-10 relative mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push("/reparto?dept=dispensa");
                }}
                className="font-bold text-xs bg-white/80 hover:bg-white text-foreground"
              >
                Scopri Specialità
              </Button>
            </div>

            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-4 translate-x-4 text-primary">
              <Leaf className="w-36 h-36" />
            </div>
          </div>
        </section>

        {/* DENSE GRID SHELVES LISTING (World-class marketplace layout) */}
        
        {/* SHELF 1: I più venduti (Asymmetrical Visual Merchandising Grid) */}
        <section className="space-y-6 select-none">
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
                I Più Venduti a Milano
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">Le specialità italiane preferite dai nostri clienti, DOP e biologiche.</p>
            </div>
            <Link href="/reparto" className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Vedi Tutti
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Premium Editorial Spotlight Card (Col-span 4) */}
            <div className="md:col-span-4 bg-[#FAF7F2] border border-[#EFECE6] rounded-2xl p-6 flex flex-col justify-between shadow-soft relative overflow-hidden group min-h-[280px]">
              <div className="space-y-3 z-10 relative">
                <Badge variant="success" className="bg-[#1C3B2B]/10 text-[#1C3B2B] border-none font-bold text-[9px] uppercase tracking-widest py-0.5 px-2">
                  Selezione Locali
                </Badge>
                <h4 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
                  Le Eccellenze della Terra di Bari
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  Dagli uliveti secolari della cultivar Coratina alle focacce lievitate 24h e cotte nei forni a legna di Altamura.
                </p>
              </div>
              <div className="z-10 relative mt-4">
                <button
                  onClick={() => router.push("/reparto?dept=dispensa")}
                  className="text-xs font-bold text-primary underline"
                >
                  Scopri la filiera corta
                </button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-6 translate-x-6 text-[#1C3B2B]">
                <Leaf className="w-36 h-36" />
              </div>
            </div>

            {/* Product Cards Row (Col-span 8) - 3 Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {milanPopular.slice(0, 3).map((prod) => {
                const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    quantityInCart={cartQty}
                    onQuantityChange={handleQuantityChange}
                    onQuickView={(p) => {
                      router.push(`/prodotto/${getProductHandle(p)}`);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* SHELF 2: Offerte speciale */}
        <section className="space-y-6 select-none">
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                📂 Offerte Speciali
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">Sconti e promozioni settimanali da non perdere.</p>
            </div>
            <Link href="/reparto" className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Vedi Tutti Sconti
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {hotDeals.map((prod) => {
              const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
              return (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  quantityInCart={cartQty}
                  onQuantityChange={handleQuantityChange}
                  onQuickView={(p) => {
                    router.push(`/prodotto/${getProductHandle(p)}`);
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* SHELF 3: Nuovi Arrivi */}
        <section className="space-y-6 select-none">
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Nuovi Arrivi Regionali
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">Articoli gastrononici appena inseriti nel catalogo, tracciati in filiera.</p>
            </div>
            <Link href="/reparto" className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Scopri Novità
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((prod) => {
              const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
              return (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  quantityInCart={cartQty}
                  onQuantityChange={handleQuantityChange}
                  onQuickView={(p) => {
                    router.push(`/prodotto/${getProductHandle(p)}`);
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* SHELF 4: Biologico essenziale */}
        <section className="space-y-6 select-none">
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Biologico Certificato & Sostenibile
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">La spesa sana che rispetta l&apos;ambiente, 100% da colture biologiche.</p>
            </div>
            <Link href="/reparto?organic=true" className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Vedi Bio
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {organicEssentials.map((prod) => {
              const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
              return (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  quantityInCart={cartQty}
                  onQuantityChange={handleQuantityChange}
                  onQuickView={(p) => {
                    router.push(`/prodotto/${getProductHandle(p)}`);
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* SHELF 5: Enoteca */}
        <section className="space-y-6 select-none">
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Enoteca: Grandi Cantine & Abbinamenti
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">Spumanti Millesimati e vini DOC/DOCG conservati in cantina climatizzata.</p>
            </div>
            <Link href="/reparto?dept=enoteca" className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Sfoglia Cantina
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Wine Editorial Spotlight Card (Col-span 4) */}
            <div className="md:col-span-4 bg-primary text-primary-foreground rounded-2xl p-6 flex flex-col justify-between shadow-soft min-h-[280px] relative overflow-hidden group">
              <div className="space-y-3 z-10 relative">
                <Badge variant="accent" className="bg-white/10 text-white border-none font-bold text-[9px] uppercase tracking-widest py-0.5 px-2">
                  Metodo Classico
                </Badge>
                <h4 className="font-serif text-xl md:text-2xl font-bold tracking-tight mt-1 leading-tight">
                  La Cantina Climatizzata Alimentari
                </h4>
                <p className="text-xs text-white/80 leading-relaxed font-semibold">
                  Tutte le nostre bottiglie riposano a temperatura e umidità costanti, garantendo la conservazione perfetta delle proprietà organolettiche e aromi.
                </p>
              </div>
              <div className="z-10 relative mt-4">
                <button
                  onClick={() => router.push("/reparto?dept=enoteca")}
                  className="text-xs font-bold text-accent hover:underline"
                >
                  Sfoglia la cantina
                </button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-6 translate-x-6 text-white">
                <Sparkles className="w-36 h-36" />
              </div>
            </div>

            {/* Product Cards Row (Col-span 8) - 3 Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {wineCollection.slice(0, 3).map((prod) => {
                const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    quantityInCart={cartQty}
                    onQuantityChange={handleQuantityChange}
                    onQuickView={(p) => {
                      router.push(`/prodotto/${getProductHandle(p)}`);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* SHELF 6: Consigli dello chef */}
        <section className="space-y-6 select-none">
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Consigliati dallo Chef
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">Gli ingredienti ideali per comporre ricette tradizionali della gastronomia italiana.</p>
            </div>
            <Link href="/reparto" className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Scopri Ricette
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {chefRecommend.map((prod) => {
              const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
              return (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  quantityInCart={cartQty}
                  onQuantityChange={handleQuantityChange}
                  onQuickView={(p) => {
                    router.push(`/prodotto/${getProductHandle(p)}`);
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* SHELF 7: Visualizzati di recente */}
        <section className="space-y-6 select-none">
          <div className="flex justify-between items-baseline">
            <div className="space-y-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Visualizzati Di Recente
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">I prodotti che hai consultato nelle ultime sessioni di spesa.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {recentlyViewed.map((prod) => {
              const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
              return (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  quantityInCart={cartQty}
                  onQuantityChange={handleQuantityChange}
                  onQuickView={(p) => {
                    router.push(`/prodotto/${getProductHandle(p)}`);
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* HOMEPAGE SECTION 7: Premium Gift Card Promotional Spotlight (Dark contrast banner) */}
        <section className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 select-none shadow-premium">
          <div className="space-y-2 md:max-w-[65%] text-center md:text-left">
            <span className="text-[10px] font-bold text-accent bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest leading-none">Regala l&apos;eccellenza</span>
            <h4 className="font-serif text-2xl md:text-3xl font-bold tracking-tight mt-2">
              Idee Regalo & Carte Regalo Alimentari
            </h4>
            <p className="text-xs text-white/80 leading-relaxed font-semibold">
              Sorprendi le persone che ami con una Gift Card digitale o un cesto gastronomico personalizzato contenente le nostre selezioni DOP.
            </p>
          </div>
          <button
            onClick={() => alert("Redirecting to Shopify Gift Card Page...")}
            className="px-6 h-12 bg-white text-primary hover:bg-white/95 font-bold text-sm rounded-lg flex items-center justify-center gap-2 flex-shrink-0 active:scale-95 transition-all shadow-soft"
          >
            <Gift className="w-4.5 h-4.5 stroke-[2]" />
            Acquista Gift Card
          </button>
        </section>

        {/* HOMEPAGE SECTION 8: Trust + Cold Chain Delivery Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/80 select-none">
          <div className="flex gap-4 p-5 bg-card border border-border/60 rounded-xl shadow-soft">
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-primary flex-shrink-0">
              <Truck className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-foreground leading-snug">Consegna Refrigerata 24h</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-semibold">
                Spediamo in contenitori termici brevettati per mantenere intatta la catena del freddo (+4°C) e la freschezza dei cibi.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-card border border-border/60 rounded-xl shadow-soft">
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-primary flex-shrink-0">
              <Shield className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-foreground leading-snug">Artigianato DOP & Certificato</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-semibold">
                Tutti i formaggi, salumi e oli sono corredati da certificato D.O.P. di autenticità del consorzio di tutela.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-card border border-border/60 rounded-xl shadow-soft">
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-primary flex-shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-foreground leading-snug">Filiera Tracciabile e Corta</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-semibold">
                Acquistiamo direttamente alla fonte senza intermediari, remunerando equamente i piccoli produttori italiani.
              </p>
            </div>
          </div>
        </section>

        {/* HOMEPAGE SECTION 9: Email Newsletter */}
        <section className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 select-none shadow-soft">
          <div className="space-y-1 md:max-w-[55%] text-center md:text-left">
            <h4 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Unisciti alla nostra tavola
            </h4>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Iscriviti per ricevere ricette stagionali di chef italiani, storie di artigiani locali e uno sconto del 10% sul primo ordine.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto max-w-sm flex-shrink-0">
            <div className="relative flex-grow">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="La tua email..."
                className="w-full h-11 bg-background border border-border/80 rounded-lg pl-10 pr-3 text-xs outline-none focus:border-primary font-semibold shadow-soft"
              />
            </div>
            <Button size="sm" variant="primary" className="h-11 px-5 font-bold text-xs shadow-sm">
              Iscriviti
            </Button>
          </div>
        </section>
      </main>

      {/* 5. Unified Shared Footer */}
      <Footer />

      {/* 6. Sticky Bottom Menus & Overlays */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "cart") useUiStore.getState().openCart();
          if (tab === "search") useUiStore.getState().openSearch();
          if (tab === "account") router.push("/account");
        }}
      />

      <CartDrawer />

      <ProductModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={() => setQuickViewProduct(null)}
        quantityInCart={cart.find((item) => item.product.id === quickViewProduct?.id)?.quantity || 0}
        onQuantityChange={handleQuantityChange}
      />

      <Notification
        toast={toast}
        onClose={() => setToast(null)}
      />

      <SearchOverlay
        products={PRODUCTS}
        onProductClick={(p) => {
          router.push(`/prodotto/${getProductHandle(p)}`);
        }}
        onAddToCart={(id) => handleQuantityChange(id, 1)}
        onSearchSubmit={() => {}}
      />

    </div>
  );
}
