"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Sparkles, Truck, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/lib/data";
import { getProductHandle } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/grocery/product-card";
import { MobileBottomNav } from "@/components/grocery/mobile-bottom-nav";
import { CartDrawer } from "@/components/grocery/cart-drawer";
import { ProductModal } from "@/components/grocery/product-modal";
import { Notification } from "@/components/grocery/notification";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { SearchOverlay } from "@/components/grocery/search-overlay";
import { Footer } from "@/components/grocery/footer";
import { useTranslation } from "@/hooks/use-translation";

import { useCartStore, selectProductCartQuantity } from "@/store/cart";
import { useUiStore } from "@/store/ui";

function ShelfProductCard({
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

// Vico-style product shelf with horizontal slider + badge label
function ProductShelfComponent({
  badge,
  badgeBg,
  title,
  linkHref,
  linkText,
  products,
  onQuantityChange,
  onQuickView,
}: {
  badge: string;
  badgeBg: string;
  title: string;
  linkHref: string;
  linkText: string;
  products: Product[];
  onQuantityChange: (id: string, qty: number) => void;
  onQuickView: (p: Product) => void;
}) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const visibleCount = 6;
  const canLeft = offset > 0;
  const canRight = offset + visibleCount < products.length;

  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-2 max-w-full overflow-hidden">
      {/* Shelf header: small badge left, "See all" right */}
      <div className="flex items-center justify-between gap-2 w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-sm text-white uppercase tracking-wider shrink-0"
            style={{ background: badgeBg }}
          >
            {badge}
          </span>
          <h3 className="font-extrabold text-slate-900 text-[15px] truncate min-w-0">{title}</h3>
        </div>
        <Link href={linkHref} className="text-[12px] font-bold text-[#1a3c2b] hover:underline shrink-0 whitespace-nowrap">
          {linkText}
        </Link>
      </div>

      {/* Slider wrapper */}
      <div className="relative w-full max-w-full overflow-hidden">
        {canLeft && (
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full shadow items-center justify-center hover:bg-slate-50 transition-all"
            aria-label={t("home.productShelves.prevAria")}
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
        )}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 overflow-hidden w-full max-w-full">
          {products.slice(offset, offset + visibleCount).map((prod) => (
            <ShelfProductCard
              key={prod.id}
              product={prod}
              onQuantityChange={onQuantityChange}
              onQuickView={onQuickView}
            />
          ))}
        </div>
        {canRight && (
          <button
            onClick={() => setOffset((o) => Math.min(products.length - visibleCount, o + 1))}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full shadow items-center justify-center hover:bg-slate-50 transition-all"
            aria-label={t("home.productShelves.nextAria")}
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        )}
      </div>
    </section>
  );
}

const ProductShelf = React.memo(ProductShelfComponent);

const CATEGORY_TILES = [
  {
    id: "cura-del-corpo",
    name: "Cura del Corpo",
    bg: "#FFDEE9",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1607868894064-2b6e7ed1b324?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "snack-salati",
    name: "Snack Salati",
    bg: "#FFF0B3",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "alimentari",
    name: "Senza Glutine",
    bg: "#FFDEDE",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "bibite",
    name: "Bevande & Vini",
    bg: "#FFF0B3",
    textColor: "#1a1a1a",
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop",
  },
];

import { HomepageHeroSlide, HomepageAnnouncement, HomepageContactSettings, TrustpilotSettings, HomepageTagline } from "@/lib/cms";

interface HomeClientProps {
  initialProducts: Product[];
  heroSlides?: HomepageHeroSlide[];
  announcement?: HomepageAnnouncement | null;
  contactSettings?: HomepageContactSettings | null;
  trustpilotSettings?: TrustpilotSettings | null;
  tagline?: HomepageTagline | null;
}

export function HomeClient({ initialProducts, heroSlides, announcement, contactSettings, trustpilotSettings, tagline }: HomeClientProps) {
  const router = useRouter();
  const [products] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<"shop" | "search" | "cart" | "account">("shop");
  const { t } = useTranslation();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prodWithUnit = products.find((p) => Boolean(p && p.unit)) || products[0] || null;
      (window as unknown as Record<string, unknown>).__OPEN_PRODUCT_MODAL__ = (p?: Product) => setQuickViewProduct(p || prodWithUnit);
      (window as unknown as Record<string, unknown>).__SHOW_TOAST__ = (tObj?: { id: string; product: Product }) => setToast(tObj || (prodWithUnit ? { id: "1", product: prodWithUnit } : null));
    }
  }, [products]);

  // Fallback Hero Slides
  const DEFAULT_HERO_SLIDES = [
    {
      badge: t("home.hero.slides.pets.badge"),
      title: t("home.heroPetsTitle"),
      subtitle: t("home.hero.slides.pets.subtitle"),
      bgColor: "#FFD1DC",
      accentColor: "#1a3c2b",
      textColor: "#1a1a1a",
      btnText: t("home.heroPetsButton"),
      btnBg: "#1a3c2b",
      link: "/reparto?dept=dispensa",
      imageUrl: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?q=80&w=900&auto=format&fit=crop",
      imageAlt: t("home.hero.slides.pets.imageAlt"),
    },
    {
      badge: t("home.hero.slides.shipping.badge"),
      title: t("home.hero.slides.shipping.title"),
      subtitle: t("home.hero.slides.shipping.subtitle"),
      bgColor: "#C8F7C5",
      accentColor: "#1a3c2b",
      textColor: "#1a1a1a",
      btnText: t("home.hero.slides.shipping.btnText"),
      btnBg: "#1a3c2b",
      link: "/reparto",
      imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=900&auto=format&fit=crop",
      imageAlt: t("home.hero.slides.shipping.imageAlt"),
    },
    {
      badge: t("home.hero.slides.savings.badge"),
      title: t("home.savingsTitle"),
      subtitle: t("home.hero.slides.savings.subtitle"),
      bgColor: "#FFF9C4",
      accentColor: "#f97316",
      textColor: "#1a1a1a",
      btnText: t("home.savingsButton"),
      btnBg: "#f97316",
      link: "/reparto",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=900&auto=format&fit=crop",
      imageAlt: t("home.hero.slides.savings.imageAlt"),
    },
  ];

  // Map Shopify CMS Hero Slides if available, or fall back to DEFAULT_HERO_SLIDES
  const activeHeroSlides =
    heroSlides && heroSlides.length > 0
      ? heroSlides.map((cmsSlide, idx) => {
          const fallbackColors = [
            { bgColor: "#FFD1DC", accentColor: "#1a3c2b", btnBg: "#1a3c2b" },
            { bgColor: "#C8F7C5", accentColor: "#1a3c2b", btnBg: "#1a3c2b" },
            { bgColor: "#FFF9C4", accentColor: "#f97316", btnBg: "#f97316" },
          ];
          const colors = fallbackColors[idx % fallbackColors.length];

          return {
            badge: cmsSlide.badgeText || t("home.hero.slides.shipping.badge"),
            title: cmsSlide.title,
            subtitle: cmsSlide.subtitle || "",
            bgColor: colors.bgColor,
            accentColor: colors.accentColor,
            textColor: "#1a1a1a",
            btnText: cmsSlide.buttonText,
            btnBg: colors.btnBg,
            link: cmsSlide.buttonLink,
            imageUrl: cmsSlide.desktopImageUrl,
            mobileImageUrl: cmsSlide.mobileImageUrl || cmsSlide.desktopImageUrl,
            imageAlt: cmsSlide.title,
          };
        })
      : DEFAULT_HERO_SLIDES.map((s) => ({ ...s, mobileImageUrl: s.imageUrl }));

  const HERO_COUNT = activeHeroSlides.length;
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [HERO_COUNT]);

  useEffect(() => {
    if (HERO_COUNT <= 1) return;
    const timer = setInterval(() => setHeroIndex((prev) => (prev + 1) % HERO_COUNT), 6000);
    return () => clearInterval(timer);
  }, [HERO_COUNT]);

  const handlePrevSlide = useCallback(() => {
    if (HERO_COUNT <= 1) return;
    setHeroIndex((p) => (p - 1 + HERO_COUNT) % HERO_COUNT);
  }, [HERO_COUNT]);

  const handleNextSlide = useCallback(() => {
    if (HERO_COUNT <= 1) return;
    setHeroIndex((p) => (p + 1) % HERO_COUNT);
  }, [HERO_COUNT]);

  // Cart store actions
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const handleQuantityChange = useCallback((productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = products.find((p) => p.id === productId);
    if (!existing && qty === 1 && productObj) setToast({ id: String(Date.now()), product: productObj });
    if (qty <= 0) removeItem(productId);
    else if (existing) updateQuantity(productId, qty);
    else if (productObj) addItem(productObj, qty);
  }, [products, addItem, removeItem, updateQuantity]);

  const handleQuickView = useCallback((p: Product) => {
    router.push(`/prodotto/${getProductHandle(p)}`);
  }, [router]);

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
    const extra = products.filter((p) => !ids.has(p.id));
    return [...filtered, ...extra].slice(0, 12);
  };

  const milanPopular = getShelfProducts(products.filter((p) => Number(p.id) % 2 === 0));
  const hotDeals = getShelfProducts(products.filter((p) => p.originalPrice && p.originalPrice > p.price));
  const wineCollection = getShelfProducts(products.filter((p) => p.category === "Enoteca"));
  const organicEssentials = getShelfProducts(products.filter((p) => p.isOrganic));

  const safeIndex = heroIndex < activeHeroSlides.length ? heroIndex : 0;
  const heroSlide = activeHeroSlides[safeIndex] || activeHeroSlides[0];

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-8 flex flex-col font-sans text-slate-800">

      {/* Promo bar — Shopify CMS Managed */}
      {announcement && announcement.message && (
        <div className="bg-red-600 text-white py-1.5 px-4 text-center text-xs font-bold tracking-wide select-none leading-none w-full max-w-full overflow-hidden flex items-center justify-center gap-1.5">
          {announcement.icon && <span>{announcement.icon}</span>}
          <span>{announcement.message}</span>
          {announcement.linkText && (
            <Link
              href={announcement.linkUrl || "#"}
              className="underline hover:text-red-100 transition-colors ml-1"
            >
              {announcement.linkText}
            </Link>
          )}
        </div>
      )}

      {/* Header System */}
      <DesktopNavbar onCategorySelect={(catId) => router.push(`/reparto?dept=${catId}`)} contactSettings={contactSettings} />
      <MobileNavbar onCategorySelect={(catId) => router.push(`/reparto?dept=${catId}`)} />

      {/* Main layout */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-4 md:py-5 space-y-6">

        {/* SECTION 1: HERO — responsive full-composition banner */}
        <section
          className="relative w-full rounded-md overflow-hidden flex items-center select-none bg-slate-900 h-[260px] sm:h-auto sm:aspect-[1.874/1] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[440px] max-h-[500px]"
        >
          {/* Background imagery: Desktop & Mobile responsiveness */}
          <div className="absolute inset-0 z-0">
            {/* Desktop Background Image */}
            <Image
              src={heroSlide.imageUrl}
              alt={heroSlide.imageAlt || heroSlide.title}
              fill
              sizes="100vw"
              className={`object-cover object-center sm:object-right-center opacity-100 transition-all duration-700 ${
                heroSlide.mobileImageUrl && heroSlide.mobileImageUrl !== heroSlide.imageUrl
                  ? "hidden sm:block"
                  : "block"
              }`}
              priority
            />
            {/* Mobile Background Image (rendered when distinct mobile_image is provided) */}
            {heroSlide.mobileImageUrl && heroSlide.mobileImageUrl !== heroSlide.imageUrl && (
              <Image
                src={heroSlide.mobileImageUrl}
                alt={heroSlide.imageAlt || heroSlide.title}
                fill
                sizes="100vw"
                className="object-cover object-right opacity-100 transition-all duration-700 block sm:hidden"
                priority
              />
            )}
          </div>

          {/* Localized gradient overlay for text contrast (Mobile top-to-bottom / Desktop left-to-right) */}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/75 via-black/45 to-transparent sm:from-black/60 sm:via-black/30 sm:to-transparent z-[5] pointer-events-none" />




          {/* Slider arrows (Only rendered if more than 1 slide) */}
          {HERO_COUNT > 1 && (
            <>
              <button
                onClick={handlePrevSlide}
                className="absolute left-3 z-20 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-all"
                aria-label={t("home.hero.prevSlideAria")}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleNextSlide}
                className="absolute right-3 z-20 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-all"
                aria-label={t("home.hero.nextSlideAria")}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </>
          )}

          {/* Slide content */}
          <div className="relative z-10 px-8 md:px-14 max-w-lg">
            <div
              className="inline-block text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-sm mb-3 shadow-sm"
              style={{ background: heroSlide.accentColor, color: "#fff" }}
            >
              {heroSlide.badge}
            </div>
            <h2
              className="font-sans text-2xl md:text-3xl font-extrabold leading-tight mb-2 text-white drop-shadow-md"
            >
              {heroSlide.title}
            </h2>
            <p
              className="text-[12px] leading-relaxed font-semibold mb-4 max-w-sm text-white/90 drop-shadow"
            >
              {heroSlide.subtitle}
            </p>
            <Link href={heroSlide.link}>
              <Button
                className="font-bold text-xs h-9 px-5 text-white rounded-md transition-colors shadow-md"
                style={{ background: heroSlide.btnBg }}
              >
                {heroSlide.btnText}
              </Button>
            </Link>
          </div>


          {/* Indicator dots (Only rendered if more than 1 slide) */}
          {HERO_COUNT > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {activeHeroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${safeIndex === idx ? "w-5 bg-slate-700" : "w-1.5 bg-slate-400/50"}`}
                  aria-label={t("home.hero.indicatorAria", { index: String(idx) })}
                />
              ))}
            </div>
          )}
        </section>



        {/* SECTION 2: TRUSTPILOT STRIP — compact horizontal review strip */}
        <section className="bg-white border border-slate-200 rounded-md py-3 px-4 flex flex-col md:flex-row items-center justify-center gap-2 select-none text-center max-w-full overflow-hidden hover:border-slate-300 transition-colors" aria-label={t("home.trustpilot.sectionAria")}>
          {(() => {
            const title = trustpilotSettings?.title || t("home.trustpilot.label");
            const rating = trustpilotSettings?.rating || t("home.trustpilot.score");
            const ratingText = trustpilotSettings?.ratingText || t("home.trustpilot.ratingText");
            const reviewsCount = trustpilotSettings?.reviewCount || t("home.trustpilot.reviewsCount");
            const profileUrl = trustpilotSettings?.profileUrl;

            const content = (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-full group">
                <span className="font-extrabold text-slate-900 text-xs shrink-0 group-hover:text-emerald-800 transition-colors">
                  {title}
                </span>
                <div className="flex gap-0.5 shrink-0" aria-label={t("home.trustpilot.starsAria")}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className="w-4 h-4 bg-[#00b67a] flex items-center justify-center text-white text-[9px] font-bold rounded-sm shadow-xs"
                    >
                      ★
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                  {ratingText} <strong>{rating}</strong>
                </span>
                <span className="text-slate-400 text-[11px] whitespace-nowrap">
                  • {reviewsCount}
                </span>
              </div>
            );

            if (profileUrl) {
              return (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${title} ${rating} ${ratingText} ${reviewsCount}`}
                  className="max-w-full focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded"
                >
                  {content}
                </a>
              );
            }

            return content;
          })()}
        </section>

        {/* SECTION 3: HOMEPAGE TAGLINE / BRAND STATEMENT */}
        {(() => {
          const displayTitle = tagline?.title || t("home.tagline.title");
          const displaySubtitle = tagline?.subtitle || t("home.tagline.subtitle");
          const linkText = tagline?.linkText || t("home.tagline.linkText");
          const linkUrl = tagline?.linkUrl || t("home.tagline.linkUrl");

          const hasLink = Boolean(linkText && linkUrl);

          if (!displayTitle) return null;

          return (
            <section className="text-center max-w-2xl mx-auto space-y-1.5 py-1 select-none max-w-full overflow-hidden">
              <h2 className="font-sans text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {displayTitle}
              </h2>
              {displaySubtitle && (
                <p className="text-xs md:text-sm text-slate-600 font-medium">
                  {displaySubtitle}
                </p>
              )}
              {hasLink && (
                <div className="pt-0.5">
                  <Link
                    href={linkUrl!}
                    className="inline-flex items-center text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 rounded"
                    aria-label={t("home.tagline.promoLinkAria")}
                  >
                    {linkText}
                  </Link>
                </div>
              )}
            </section>
          );
        })()}

        {/* SECTION 4: FOUR SERVICE PILLARS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-y border-slate-100 py-4 select-none max-w-full overflow-hidden" aria-label={t("home.servicePillars.sectionAria")}>
          {[
            { icon: <Leaf className="w-4 h-4 text-[#1a3c2b]" />, title: t("home.environmentTitle"), sub: t("home.servicePillars.environmentSub") },
            { icon: <Truck className="w-4 h-4 text-[#1a3c2b]" />, title: t("home.freeShippingTitle"), sub: t("home.servicePillars.freeShippingSub") },
            { icon: <Shield className="w-4 h-4 text-[#1a3c2b]" />, title: t("home.servicePillars.speedyTitle"), sub: t("home.servicePillars.speedySub") },
            { icon: <Sparkles className="w-4 h-4 text-[#1a3c2b]" />, title: t("home.servicePillars.authenticTitle"), sub: t("home.servicePillars.authenticSub") },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex items-center gap-2.5 p-2 min-w-0 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight truncate min-w-0">{title}</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate min-w-0">{sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* SECTION 5: PRODUCT SHELF #1 — I Più Venduti */}
        <ProductShelf
          badge={t("home.productShelves.bestSellers.badge")}
          badgeBg="#1a3c2b"
          title={t("home.productShelves.bestSellers.title")}
          linkHref="/reparto"
          linkText={t("home.productShelves.bestSellers.linkText")}
          products={milanPopular}
          onQuantityChange={handleQuantityChange}
          onQuickView={handleQuickView}
        />

        {/* SECTION 6: CATEGORY TILES — 4 illustrated cards (Vico style) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none" aria-label={t("home.categoryTiles.sectionAria")}>
          {CATEGORY_TILES.map((tile) => {
            const resolvedLabel = tile.name;
            return (
              <div
                key={tile.id}
                onClick={() => router.push(`/reparto?dept=${tile.id}`)}
                className="relative h-[110px] rounded-md overflow-hidden cursor-pointer group"
                style={{ background: tile.bg }}
                aria-label={t("home.categoryTiles.tileAria", { name: resolvedLabel })}
              >
                {/* Illustrated background image */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={tile.imageUrl}
                    alt={t("home.categoryTiles.imageAlt", { name: resolvedLabel })}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover opacity-55 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {/* Label — bottom left, bold on pastel bg */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 z-10">
                  <h4 className="font-extrabold text-slate-900 text-[13px] leading-tight drop-shadow-sm">{resolvedLabel}</h4>
                </div>
              </div>
            );
          })}
        </section>

        {/* SECTION 7: PRODUCT SHELF #2 — Offerte Speciali */}
        <ProductShelf
          badge={t("home.productShelves.specialOffers.badge")}
          badgeBg="#ef4444"
          title={t("home.productShelves.specialOffers.title")}
          linkHref="/reparto"
          linkText={t("home.productShelves.specialOffers.linkText")}
          products={hotDeals}
          onQuantityChange={handleQuantityChange}
          onQuickView={handleQuickView}
        />

        {/* SECTION 8: PRODUCT SHELF #3 — Enoteca */}
        <ProductShelf
          badge={t("home.productShelves.wineCellar.badge")}
          badgeBg="#86198f"
          title={t("home.productShelves.wineCellar.title")}
          linkHref="/reparto?dept=enoteca"
          linkText={t("home.productShelves.wineCellar.linkText")}
          products={wineCollection}
          onQuantityChange={handleQuantityChange}
          onQuickView={handleQuickView}
        />

        {/* SECTION 9: PRODUCT SHELF #4 — Biologico */}
        <ProductShelf
          badge={t("home.productShelves.organic.badge")}
          badgeBg="#059669"
          title={t("home.productShelves.organic.title")}
          linkHref="/reparto?organic=true"
          linkText={t("home.productShelves.organic.linkText")}
          products={organicEssentials}
          onQuantityChange={handleQuantityChange}
          onQuickView={handleQuickView}
        />

        {/* SECTION 10: FOUR MARKETING CARDS (Vico style — image + overlay CTA) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none max-w-full overflow-hidden" aria-label={t("home.promotional.sectionAria")}>
          {[
            {
              title: t("home.promotional.about.title"),
              sub: t("home.promotional.about.sub"),
              cta: t("home.promotional.about.cta"),
              ariaLabel: t("home.promotional.about.ariaLabel"),
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
              href: "/reparto",
            },
            {
              title: t("home.promotional.giftCard.title"),
              sub: t("home.promotional.giftCard.sub"),
              cta: t("home.promotional.giftCard.cta"),
              ariaLabel: t("home.promotional.giftCard.ariaLabel"),
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop",
              href: "#",
            },
            {
              title: t("home.promotional.press.title"),
              sub: t("home.promotional.press.sub"),
              cta: t("home.promotional.press.cta"),
              ariaLabel: t("home.promotional.press.ariaLabel"),
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?q=80&w=400&auto=format&fit=crop",
              href: "#",
            },
            {
              title: t("home.promotional.desire.title"),
              sub: t("home.promotional.desire.sub"),
              cta: t("home.promotional.desire.cta"),
              ariaLabel: t("home.promotional.desire.ariaLabel"),
              ctaBg: "#1a3c2b",
              img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400&auto=format&fit=crop",
              href: "#",
            },
          ].map(({ title, sub, cta, ariaLabel, ctaBg, img, href }) => (
            <div
              key={href + title}
              onClick={() => router.push(href)}
              className="relative rounded-md overflow-hidden h-[130px] cursor-pointer group min-w-0 max-w-full"
              aria-label={ariaLabel}
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
              <div className="absolute inset-0 flex flex-col justify-between p-3 z-10 min-w-0 max-w-full overflow-hidden">
                <div className="min-w-0">
                  <h4 className="font-extrabold text-white text-[13px] leading-snug drop-shadow truncate">{title}</h4>
                  <p className="text-[10px] text-white/90 mt-0.5 leading-relaxed line-clamp-2 drop-shadow">{sub}</p>
                </div>
                <button
                  className="self-start text-[10px] font-bold text-white px-2.5 py-1 rounded-sm transition-all shadow-sm max-w-full truncate"
                  style={{ background: ctaBg }}
                >
                  {cta}
                </button>

              </div>
            </div>
          ))}
        </section>

        {/* SECTION 11: NEWSLETTER — yellow two-column Vico layout */}
        <section
          className="rounded-md overflow-hidden grid grid-cols-1 md:grid-cols-2 items-stretch h-auto md:h-[240px]"
          style={{ background: "#FFE14D" }}
          aria-label={t("home.newsletter.sectionAria")}
        >
          {/* Left: Form */}
          <div className="p-6 md:p-8 flex flex-col justify-center space-y-3">
            <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-widest block">
              {t("home.newsletter.eyebrow")}
            </span>
            <h4 className="font-sans text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {t("home.newsletter.title")}
            </h4>
            <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
              {t("home.newsletter.subtitle")}
            </p>
            <div className="space-y-2 max-w-sm">
              <input type="text" placeholder={t("home.newsletter.namePlaceholder")} className="w-full h-9 bg-white border border-slate-300 rounded px-3 text-xs outline-none font-semibold" aria-label={t("home.newsletter.namePlaceholder")} />
              <input type="email" placeholder={t("home.newsletter.emailPlaceholder")} className="w-full h-9 bg-white border border-slate-300 rounded px-3 text-xs outline-none font-semibold" aria-label={t("home.newsletter.emailPlaceholder")} />
              <div className="flex gap-2">
                <input type="tel" placeholder={t("home.newsletter.phonePlaceholder")} className="flex-1 h-9 bg-white border border-slate-300 rounded px-3 text-xs outline-none font-semibold" aria-label={t("home.newsletter.phonePlaceholder")} />
                <select className="h-9 bg-white border border-slate-300 rounded px-2 text-xs outline-none font-semibold">
                  <option>🇮🇹 IT</option>
                  <option>🇬🇧 EN</option>
                </select>
              </div>
              <button
                onClick={() => alert(t("home.newsletter.successMsg"))}
                className="w-full h-9 text-white font-bold text-xs rounded transition-all"
                style={{ background: "#1a3c2b" }}
              >
                {t("home.newsletter.submitBtn")}
              </button>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative hidden md:block h-full w-full">
            <Image
              src="/vico_newsletter_box.png"
              alt={t("home.newsletter.imageAlt")}
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
        quantityInCart={useCartStore.getState().items.find((item) => item.product.id === quickViewProduct?.id)?.quantity || 0}
        onQuantityChange={handleQuantityChange}
      />

      <Notification toast={toast} onClose={() => setToast(null)} />

      <SearchOverlay
        products={products}
        onProductClick={(p) => router.push(`/prodotto/${getProductHandle(p)}`)}
        onAddToCart={(id) => handleQuantityChange(id, 1)}
        onSearchSubmit={(q) => router.push(`/reparto?q=${encodeURIComponent(q)}`)}
      />
    </div>
  );
}
