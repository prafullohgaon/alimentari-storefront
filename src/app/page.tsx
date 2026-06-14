"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Sparkles, Truck, Leaf, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { PRODUCTS, CATEGORIES, Product } from "@/lib/data";
import { getProductHandle } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/grocery/product-card";
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

// Single full-width hero slides (Vico style — compact, bright supermarket promotional)
const HERO_SLIDES = [
  {
    badge: "PER I NOSTRI VICO LOVERS",
    title: "Prodotti Italiani per i tuoi Amici a 4 Zampe",
    subtitle: "Italian products online and emotions in one service. L'Italia a casa tua!",
    bgColor: "#FFD1DC",
    accentColor: "#1a3c2b",
    textColor: "#1a1a1a",
    btnText: "Scopri la Selezione",
    btnBg: "#1a3c2b",
    link: "/reparto?dept=dispensa",
    imageUrl: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?q=80&w=900&auto=format&fit=crop",
  },
  {
    badge: "SPEDIZIONE GRATUITA",
    title: "Spesa Italiana Online",
    subtitle: "Spedizione gratuita in tutta Europa da €49. Prodotti freschi a casa tua.",
    bgColor: "#C8F7C5",
    accentColor: "#1a3c2b",
    textColor: "#1a1a1a",
    btnText: "Inizia la Spesa",
    btnBg: "#1a3c2b",
    link: "/reparto",
    imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=900&auto=format&fit=crop",
  },
  {
    badge: "TUTTO SOTTO 2€",
    title: "Risparmia ogni giorno",
    subtitle: "Prodotti essenziali per la dispensa a prezzi bloccati, sempre freschi.",
    bgColor: "#FFF9C4",
    accentColor: "#f97316",
    textColor: "#1a1a1a",
    btnText: "Vedi le Offerte",
    btnBg: "#f97316",
    link: "/reparto",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=900&auto=format&fit=crop",
  },
];
const HERO_COUNT = HERO_SLIDES.length;

// Vico-style product shelf with horizontal slider + badge label
function ProductShelf({
  badge,
  badgeBg,
  title,
  linkHref,
  linkText,
  products,
  cart,
  onQuantityChange,
  onQuickView,
}: {
  badge: string;
  badgeBg: string;
  title: string;
  linkHref: string;
  linkText: string;
  products: Product[];
  cart: { product: Product; quantity: number }[];
  onQuantityChange: (id: string, qty: number) => void;
  onQuickView: (p: Product) => void;
}) {
  const [offset, setOffset] = useState(0);
  const visibleCount = 6;
  const canLeft = offset > 0;
  const canRight = offset + visibleCount < products.length;

  return (
    <section className="space-y-2">
      {/* Shelf header: small badge left, "See all" right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-sm text-white uppercase tracking-wider"
            style={{ background: badgeBg }}
          >
            {badge}
          </span>
          <h3 className="font-extrabold text-slate-900 text-[15px]">{title}</h3>
        </div>
        <Link href={linkHref} className="text-[12px] font-bold text-[#1a3c2b] hover:underline">
          {linkText}
        </Link>
      </div>

      {/* Slider wrapper */}
      <div className="relative">
        {canLeft && (
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full shadow flex items-center justify-center hover:bg-slate-50 transition-all"
            aria-label="Precedente"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
        )}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 overflow-hidden">
          {products.slice(offset, offset + visibleCount).map((prod) => {
            const cartQty = cart.find((item) => item.product.id === prod.id)?.quantity || 0;
            return (
              <ProductCard
                key={prod.id}
                product={prod}
                quantityInCart={cartQty}
                onQuantityChange={onQuantityChange}
                onQuickView={onQuickView}
              />
            );
          })}
        </div>
        {canRight && (
          <button
            onClick={() => setOffset((o) => Math.min(products.length - visibleCount, o + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full shadow flex items-center justify-center hover:bg-slate-50 transition-all"
            aria-label="Successivo"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        )}
      </div>
    </section>
  );
}

// 4-tile illustrated category card section — vibrant Vico style
const CATEGORY_TILES = [
  {
    id: "casa & persona",
    label: "Cura del Corpo",
    bg: "#FFDEE9",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1607868894064-2b6e7ed1b324?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "dispensa",
    label: "Snack Salati",
    bg: "#FFF0B3",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "panetteria",
    label: "Senza Glutine",
    bg: "#FFDEDE",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "enoteca",
    label: "Bevande & Vini",
    bg: "#FFF0B3",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop",
  },
];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"shop" | "search" | "cart" | "account">("shop");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // Hero slider
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setHeroIndex((prev) => (prev + 1) % HERO_COUNT), 6000);
    return () => clearInterval(timer);
  }, []);
  const handlePrevSlide = useCallback(() => setHeroIndex((p) => (p - 1 + HERO_COUNT) % HERO_COUNT), []);
  const handleNextSlide = useCallback(() => setHeroIndex((p) => (p + 1) % HERO_COUNT), []);

  // Cart store
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = PRODUCTS.find((p) => p.id === productId);
    if (!existing && qty === 1 && productObj) setToast({ id: String(Date.now()), product: productObj });
    if (qty <= 0) removeItem(productId);
    else if (existing) updateQuantity(productId, qty);
    else if (productObj) addItem(productObj, qty);
  }, [addItem, removeItem, updateQuantity]);

  const cartOpen = useUiStore((state) => state.cartOpen);
  const searchOpen = useUiStore((state) => state.searchOpen);
  useEffect(() => {
    if (cartOpen) setActiveTab("cart");
    else if (searchOpen) setActiveTab("search");
    else setActiveTab("shop");
  }, [cartOpen, searchOpen]);

  // Pad products to 12 for slider
  const getShelfProducts = (filtered: Product[]) => {
    if (filtered.length >= 12) return filtered.slice(0, 12);
    const ids = new Set(filtered.map((p) => p.id));
    const extra = PRODUCTS.filter((p) => !ids.has(p.id));
    return [...filtered, ...extra].slice(0, 12);
  };

  const milanPopular = getShelfProducts(PRODUCTS.filter((p) => Number(p.id) % 2 === 0));
  const hotDeals = getShelfProducts(PRODUCTS.filter((p) => p.originalPrice && p.originalPrice > p.price));
  const wineCollection = getShelfProducts(PRODUCTS.filter((p) => p.category === "Enoteca"));
  const organicEssentials = getShelfProducts(PRODUCTS.filter((p) => p.isOrganic));

  const heroSlide = HERO_SLIDES[heroIndex];

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-8 flex flex-col font-sans text-slate-800">

      {/* Promo bar */}
      <div className="bg-red-600 text-white py-1.5 px-4 text-center text-xs font-bold tracking-wide select-none leading-none">
        🔥 Spedizione gratuita in tutta Italia per ordini superiori a 80€!
      </div>

      {/* Header System */}
      <DesktopNavbar onCategorySelect={(catId) => router.push(`/reparto?dept=${catId}`)} />
      <MobileNavbar onCategorySelect={(catId) => router.push(`/reparto?dept=${catId}`)} />

      {/* Main layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-4 md:py-5 space-y-6">

        {/* SECTION 1: HERO — single compact full-width banner, Vico proportions */}
        <section
          className="relative w-full rounded-md overflow-hidden h-[200px] md:h-[240px] flex items-center select-none"
          style={{ background: heroSlide.bgColor }}
        >
          {/* Background illustration */}
          <div className="absolute inset-0 z-0">
            <Image
              src={heroSlide.imageUrl}
              alt={heroSlide.title}
              fill
              sizes="100vw"
              className="object-cover opacity-20 transition-all duration-700"
              priority
            />
          </div>

          {/* Slider arrows */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-3 z-20 w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all"
            aria-label="Slide precedente"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: heroSlide.accentColor }} />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute right-3 z-20 w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all"
            aria-label="Prossima slide"
          >
            <ChevronRight className="w-4 h-4" style={{ color: heroSlide.accentColor }} />
          </button>

          {/* Slide content */}
          <div className="relative z-10 px-8 md:px-14 max-w-lg">
            <div
              className="inline-block text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-sm mb-3"
              style={{ background: heroSlide.accentColor, color: "#fff" }}
            >
              {heroSlide.badge}
            </div>
            <h2
              className="font-sans text-2xl md:text-3xl font-extrabold leading-tight mb-2"
              style={{ color: heroSlide.textColor }}
            >
              {heroSlide.title}
            </h2>
            <p
              className="text-[12px] leading-relaxed font-semibold mb-4 max-w-sm"
              style={{ color: heroSlide.textColor + "cc" }}
            >
              {heroSlide.subtitle}
            </p>
            <Link href={heroSlide.link}>
              <Button
                className="font-bold text-xs h-9 px-5 text-white rounded-md transition-colors"
                style={{ background: heroSlide.btnBg }}
              >
                {heroSlide.btnText}
              </Button>
            </Link>
          </div>

          {/* Indicator dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${heroIndex === idx ? "w-5 bg-slate-700" : "w-1.5 bg-slate-400/50"}`}
                aria-label={`Slide ${idx}`}
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: TRUSTPILOT STRIP — compact Vico style */}
        <section className="bg-white border border-slate-200 rounded-md py-3 px-4 flex flex-col md:flex-row items-center justify-center gap-2 select-none text-center">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-xs">★ Trustpilot</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <div key={s} className="w-4 h-4 bg-[#00b67a] flex items-center justify-center text-white text-[9px] font-bold rounded-sm">★</div>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-700">Eccellente <strong>4.8 / 5</strong></span>
            <span className="text-slate-400 text-[11px]">— 1.3k recensioni</span>
          </div>
        </section>

        {/* SECTION 3: TAGLINE */}
        <section className="text-center max-w-2xl mx-auto space-y-1 select-none">
          <h2 className="font-sans text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Prodotti italiani online ed emozioni in un unico servizio.
          </h2>
          <p className="text-[12px] text-slate-400 font-semibold">
            L&apos;Italia a casa tua!{" "}
            <Link href="/shipping" className="underline text-[#1a3c2b]">SPEDIZIONE GRATUITA IN TUTTA EUROPA DA €49</Link>
          </p>
        </section>

        {/* SECTION 4: FOUR SERVICE PILLARS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-y border-slate-100 py-4 select-none">
          {[
            { icon: <Leaf className="w-4 h-4 text-[#1a3c2b]" />, title: "Rispettosi dell'Ambiente", sub: "Packaging eco-compatibile" },
            { icon: <Truck className="w-4 h-4 text-[#1a3c2b]" />, title: "Spedizione Gratuita", sub: "Da €49 in tutta Europa" },
            { icon: <Shield className="w-4 h-4 text-[#1a3c2b]" />, title: "Veloce e Sicuro", sub: "Consegna in 2-3 giorni" },
            { icon: <Sparkles className="w-4 h-4 text-[#1a3c2b]" />, title: "Made in Italy", sub: "100% prodotti autentici" },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex items-center gap-2.5 p-2">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">{title}</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 5: PRODUCT SHELF #1 — I Più Venduti */}
        <ProductShelf
          badge="Sconti su tutte le offerte"
          badgeBg="#1a3c2b"
          title="I Più Venduti"
          linkHref="/reparto"
          linkText="Vedi tutte le offerte"
          products={milanPopular}
          cart={cart}
          onQuantityChange={handleQuantityChange}
          onQuickView={(p) => router.push(`/prodotto/${getProductHandle(p)}`)}
        />

        {/* SECTION 6: CATEGORY TILES — 4 illustrated cards (Vico style) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
          {CATEGORY_TILES.map((tile) => (
            <div
              key={tile.id}
              onClick={() => router.push(`/reparto?dept=${tile.id}`)}
              className="relative h-[110px] rounded-md overflow-hidden cursor-pointer group"
              style={{ background: tile.bg }}
            >
              {/* Illustrated background image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={tile.imageUrl}
                  alt={tile.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover opacity-55 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              {/* Label — bottom left, bold on pastel bg */}
              <div className="absolute inset-0 flex flex-col justify-end p-3 z-10">
                <h4 className="font-extrabold text-slate-900 text-[13px] leading-tight drop-shadow-sm">{tile.label}</h4>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 7: PRODUCT SHELF #2 — Offerte Speciali */}
        <ProductShelf
          badge="Volantino Sconti"
          badgeBg="#ef4444"
          title="Offerte Speciali Settimanali"
          linkHref="/reparto"
          linkText="Vedi tutte le offerte"
          products={hotDeals}
          cart={cart}
          onQuantityChange={handleQuantityChange}
          onQuickView={(p) => router.push(`/prodotto/${getProductHandle(p)}`)}
        />

        {/* SECTION 8: PRODUCT SHELF #3 — Enoteca */}
        <ProductShelf
          badge="Cantina Italiana"
          badgeBg="#86198f"
          title="Enoteca & Bollicine"
          linkHref="/reparto?dept=enoteca"
          linkText="Scopri l'Enoteca"
          products={wineCollection}
          cart={cart}
          onQuantityChange={handleQuantityChange}
          onQuickView={(p) => router.push(`/prodotto/${getProductHandle(p)}`)}
        />

        {/* SECTION 9: PRODUCT SHELF #4 — Biologico */}
        <ProductShelf
          badge="Spesa Sana Bio"
          badgeBg="#059669"
          title="Biologico Certificato"
          linkHref="/reparto?organic=true"
          linkText="Vedi Biologico"
          products={organicEssentials}
          cart={cart}
          onQuantityChange={handleQuantityChange}
          onQuickView={(p) => router.push(`/prodotto/${getProductHandle(p)}`)}
        />

        {/* SECTION 10: FOUR MARKETING CARDS (Vico style — image + overlay CTA) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
          {[
            {
              title: "Scopri chi siamo",
              sub: "La tua storia con i produttori per eccellenze locali.",
              cta: "Scopri Alimentari",
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
              href: "/reparto",
            },
            {
              title: "Gift Card",
              sub: "Regala i profumi ed i sapori tipici di casa.",
              cta: "Acquista una Gift Box",
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop",
              href: "#",
            },
            {
              title: "Press & News",
              sub: "Leggici su Gambero Rosso e Vanity Fair.",
              cta: "Leggi gli Articoli",
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?q=80&w=400&auto=format&fit=crop",
              href: "#",
            },
            {
              title: "Hai un Desiderio?",
              sub: "Dicci cosa cerchi, lo troveremo per te.",
              cta: "Suggerisci",
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop",
              href: "#",
            },
          ].map(({ title, sub, cta, ctaBg, img, href }) => (
            <div
              key={title}
              onClick={() => router.push(href)}
              className="relative rounded-md overflow-hidden h-[130px] cursor-pointer group"
            >
              <Image
                src={img}
                alt={title}
                fill
                sizes="25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300 brightness-105"
              />
              {/* Very light overlay so image is clearly visible — Vico style */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/15 transition-colors" />
              <div className="absolute inset-0 flex flex-col justify-between p-3 z-10">
                <div>
                  <h4 className="font-extrabold text-white text-[13px] leading-snug drop-shadow">{title}</h4>
                  <p className="text-[10px] text-white/90 mt-0.5 leading-relaxed line-clamp-2 drop-shadow">{sub}</p>
                </div>
                <button
                  className="self-start text-[10px] font-bold text-white px-2.5 py-1 rounded-sm transition-all shadow-sm"
                  style={{ background: ctaBg }}
                >
                  {cta}
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 11: NEWSLETTER — yellow two-column Vico layout */}
        <section className="rounded-md overflow-hidden grid grid-cols-1 md:grid-cols-2 items-stretch h-auto md:h-[240px]" style={{ background: "#FFE14D" }}>
          {/* Left: Form */}
          <div className="p-6 md:p-8 flex flex-col justify-center space-y-3">
            <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-widest block">
              Unisciti alla nostra community!
            </span>
            <h4 className="font-sans text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Ottieni subito 5€ di sconto sulla spesa
            </h4>
            <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
              Ricevi sconti, novità del mese ed offerte esclusive.
            </p>
            <div className="space-y-2 max-w-sm">
              <input type="text" placeholder="Nome" className="w-full h-9 bg-white border border-slate-300 rounded px-3 text-xs outline-none font-semibold" />
              <input type="email" placeholder="Email" className="w-full h-9 bg-white border border-slate-300 rounded px-3 text-xs outline-none font-semibold" />
              <div className="flex gap-2">
                <input type="tel" placeholder="Telefono" className="flex-1 h-9 bg-white border border-slate-300 rounded px-3 text-xs outline-none font-semibold" />
                <select className="h-9 bg-white border border-slate-300 rounded px-2 text-xs outline-none font-semibold">
                  <option>🇮🇹 IT</option>
                  <option>🇬🇧 EN</option>
                </select>
              </div>
              <button
                onClick={() => alert("Iscritto! Controlla la tua email.")}
                className="w-full h-9 text-white font-bold text-xs rounded transition-all"
                style={{ background: "#1a3c2b" }}
              >
                Iscriviti
              </button>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative hidden md:block h-full w-full">
            <Image
              src="/vico_newsletter_box.png"
              alt="Scatola Spesa Alimentari"
              fill
              sizes="50vw"
              className="object-cover"
              priority
            />
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile nav & overlays */}
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

      <Notification toast={toast} onClose={() => setToast(null)} />

      <SearchOverlay
        products={PRODUCTS}
        onProductClick={(p) => router.push(`/prodotto/${getProductHandle(p)}`)}
        onAddToCart={(id) => handleQuantityChange(id, 1)}
        onSearchSubmit={(q) => router.push(`/reparto?q=${encodeURIComponent(q)}`)}
      />
    </div>
  );
}
