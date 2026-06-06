"use client";

import React, { useState } from "react";
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
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS, Product } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/grocery/product-card";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { CartDrawer } from "@/components/grocery/cart-drawer";
import { SearchOverlay } from "@/components/grocery/search-overlay";
import { Notification } from "@/components/grocery/notification";
import { Footer } from "@/components/grocery/footer";
import { getProductHandle } from "@/lib/shopify";

interface ProductDetailViewProps {
  product: Product;
}

import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useWishlistStore } from "@/store/wishlist";

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const router = useRouter();
  // Zustand Global Cart Store integration
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // PDP Active States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscription">("one-time");
  const [subInterval, setSubInterval] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [activeInfoTab, setActiveInfoTab] = useState<"storia" | "valori" | "consegna">("storia");
  
  // Hover Magnifier Zoom coordinates on desktop (Wowed visual effect!)
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: "none" });
  const [isZooming, setIsZooming] = useState(false);

  // Fullscreen lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Dynamic sticky mobile purchase bar triggers (Peak conversion detail!)
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(false);
  const mainBuyButtonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const currentRef = mainBuyButtonRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky mobile bar only if the main buy button is scrolled out of view
        setShowStickyMobileBar(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, []);

  // Dynamically load lifestyle closeup resources based on product ID to make gallery feel world-class
  const productGalleryImages = [
    product.imageUrl,
    // closeup 2 (agricultural origin)
    "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
    // closeup 3 (elegantly plated lifestyle table)
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=400&auto=format&fit=crop"
  ];

  const handleQuantityChange = (productId: string, qty: number) => {
    const existing = useCartStore.getState().items.find((item) => item.product.id === productId);
    const productObj = PRODUCTS.find((p) => p.id === productId) || (productId === product.id ? product : undefined);

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

  // DOP / Bio cross-sell combinations
  // Find related products (same category)
  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  // Frequently Bought Together: Active product + two other complementary items
  const boughtTogetherItem = PRODUCTS.find((p) => p.id !== product.id && p.category === "Dispensa") || PRODUCTS[1];
  const boughtTogetherItem2 = PRODUCTS.find((p) => p.id !== product.id && p.id !== boughtTogetherItem.id && p.category === "Latticini & Salumi") || PRODUCTS[2];

  const comboPrice = product.price + boughtTogetherItem.price + boughtTogetherItem2.price;
  const discountedComboPrice = comboPrice * 0.92; // 8% combo discount

  const handleAddComboToCart = () => {
    addItem(product, 1);
    addItem(boughtTogetherItem, 1);
    addItem(boughtTogetherItem2, 1);
    useUiStore.getState().openCart();
  };

  // Magnifier lens coordinates on hover (Desktop Zoom effect)
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

  // Centralized Wishlist Store Integration
  const wishlistIds = useWishlistStore((state) => state.ids);
  const toggleWishlistAction = useWishlistStore((state) => state.toggleWishlist);
  const isWishlisted = wishlistIds.includes(product.id);
  const toggleWishlist = () => {
    toggleWishlistAction(product.id);
  };


  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 flex flex-col font-sans select-none">
      
      {/* Navigation Headers */}
      <DesktopNavbar
        onCategorySelect={() => router.push("/reparto")}
      />

      <MobileNavbar
        onCategorySelect={() => router.push("/reparto")}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-12 select-text">
        {/* Breadcrumb Row */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
          <Link href="/reparto" className="hover:text-primary transition-colors">Reparto</Link>
          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
          <span className="text-foreground font-bold truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Double-Column Main Product Content */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pt-2">
          
          {/* Column Left (Gallery Layout): 7 Columns */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Thumbnail grid (Left 2 Units on Desktops) */}
            <div className="hidden md:flex md:col-span-2 flex-col gap-3 select-none">
              {productGalleryImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "aspect-square rounded-xl overflow-hidden border border-border cursor-pointer transition-all bg-white relative",
                    activeImageIndex === idx ? "border-[#1C3B2B] ring-2 ring-[#1C3B2B]/10" : "hover:border-[#1C3B2B]/40"
                  )}
                >
                  <Image
                    src={img}
                    alt="Detail thumbnail"
                    fill
                    sizes="80px"
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                      e.currentTarget.srcset = "";
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Main Image Showcase with Hover Magnifier details (Right 10 Units) */}
            <div className="md:col-span-10 bg-card border border-border/80 rounded-2xl p-4 lg:p-6 shadow-soft flex items-center justify-center relative overflow-hidden select-none">
              
              {product.isOrganic && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="success" className="bg-white/95 backdrop-blur-sm gap-1 py-1 px-3 shadow-sm font-bold text-[10px]">
                    <Leaf className="w-3.5 h-3.5 text-success fill-success/10" />
                    Bio Certificato
                  </Badge>
                </div>
              )}

              {/* Lens Magnifier Trigger boundaries */}
              <div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={handleMouseLeave}
                onClick={() => setLightboxOpen(true)}
                className="w-full relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-white"
              >
                <Image
                  src={productGalleryImages[activeImageIndex]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                    e.currentTarget.srcset = "";
                  }}
                  priority={true}
                />
                
                {/* Visual detail zoom popup glass */}
                {isZooming && (
                  <div
                    style={zoomStyle}
                    className="absolute inset-0 pointer-events-none rounded-xl border border-border bg-no-repeat shadow-elevation"
                  />
                )}
              </div>
            </div>

            {/* Mobile swipe category thumbnail dots */}
            <div className="flex md:hidden justify-center gap-1.5 py-1 w-full select-none">
              {productGalleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all",
                    activeImageIndex === idx ? "bg-[#1C3B2B] w-6" : "bg-border"
                  )}
                  aria-label={`Slide ${idx}`}
                />
              ))}
            </div>

          </div>

          {/* Column Right (Sticky Purchase & Descriptions): 5 Columns */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            {/* Product Title Header card */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-soft space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#C9623B] uppercase tracking-widest block">
                  {product.category}
                </span>
                <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                  {product.name}
                </h1>
                {product.brand && (
                  <span className="text-xs text-muted-foreground font-bold block">
                    Marchio: <strong className="text-primary font-bold">{product.brand}</strong>
                  </span>
                )}
              </div>

              {/* Rating and details */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 select-none">
                <div className="flex items-center gap-1 font-semibold text-muted-foreground">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-bold text-foreground">{product.rating?.toFixed(1) || "4.9"}</span>
                  <span>(38 recensioni positive)</span>
                </div>
                <span className="text-muted-foreground font-bold">SKU: {product.sku || "OL-COR-500"}</span>
              </div>
            </div>

            {/* HIGH-CONVERSION SUBSCRIBE & SAVE PANEL (Sticky Purchase Block) */}
            <div className="bg-card border border-[#EFECE6] rounded-2xl p-5 md:p-6 shadow-premium space-y-6 select-none">
              
              {/* Pricing section */}
              <div className="flex items-baseline justify-between select-none">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground tracking-tight">
                    €{(purchaseType === "subscription" ? product.price * 0.95 : product.price).toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-muted-foreground line-through font-semibold">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground font-semibold">/ {product.unit}</span>
                </div>

                {purchaseType === "subscription" && (
                  <Badge className="bg-success/15 text-success border border-success/20 font-bold text-[9px] px-2 py-0.5">
                    Risparmi 5%
                  </Badge>
                )}
              </div>

              {/* Social proof & countdown conversion microcopy */}
              <div className="text-[11px] font-medium text-muted-foreground bg-[#FAF7F2] border border-[#EFECE6] p-2.5 rounded-lg flex justify-between items-center select-none">
                <span className="text-primary font-bold">🔥 Acquistato da 18 persone oggi</span>
                <span>Consegna entro domani</span>
              </div>

              {/* Purchase Toggles (Shopify Headless integration selling plans simulator) */}
              <div className="space-y-3">
                {/* One time */}
                <div
                  onClick={() => setPurchaseType("one-time")}
                  className={cn(
                    "border rounded-xl p-3 flex gap-3 items-center cursor-pointer hover:bg-muted/5 transition-all",
                    purchaseType === "one-time" ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center relative">
                    {purchaseType === "one-time" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-grow flex justify-between items-center text-xs font-bold text-foreground">
                    <span>Acquisto Singolo Standard</span>
                    <span>€{product.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Subscription (Subscribe & Save) */}
                <div
                  onClick={() => setPurchaseType("subscription")}
                  className={cn(
                    "border rounded-xl p-3 flex flex-col gap-3 cursor-pointer hover:bg-muted/5 transition-all",
                    purchaseType === "subscription" ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center relative">
                      {purchaseType === "subscription" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-grow flex justify-between items-center text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1">
                        ↺ Spesa Ricorrente (Subscribe & Save)
                      </span>
                      <span className="text-[#C9623B]">€{(product.price * 0.95).toFixed(2)}</span>
                    </div>
                  </div>

                  {purchaseType === "subscription" && (
                    <div className="border-t border-border/60 pt-2.5 pl-7 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Frequenza Spesa</span>
                      <select
                        value={subInterval}
                        onChange={(e) => setSubInterval(e.target.value as "weekly" | "biweekly" | "monthly")}
                        className="bg-transparent text-xs font-bold text-foreground border border-border rounded px-2 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                      >
                        <option value="weekly">Ogni Settimana</option>
                        <option value="biweekly">Ogni 2 Settimane</option>
                        <option value="monthly">Ogni Mese</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div ref={mainBuyButtonRef} className="flex gap-3 select-none">
                {quantityInCart === 0 ? (
                  <Button
                    onClick={() => {
                      if (purchaseType === "subscription") {
                        try {
                          const freqs = JSON.parse(localStorage.getItem("alimentari_recurring_freqs") || "{}");
                          freqs[product.id] = subInterval;
                          localStorage.setItem("alimentari_recurring_freqs", JSON.stringify(freqs));
                        } catch (e) {
                          console.error(e);
                        }
                      }
                      handleQuantityChange(product.id, 1);
                    }}
                    variant="primary"
                    className="flex-grow h-12 text-sm font-bold shadow-soft flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-4.5 h-4.5 stroke-[2.5]" />
                    {purchaseType === "subscription" ? "Abbonati Ora" : "Aggiungi alla Spesa"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 flex-grow">
                    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Q.tà:</span>
                    <QuantitySelector
                      value={quantityInCart}
                      onChange={(qty) => handleQuantityChange(product.id, qty)}
                      className="flex-grow justify-between h-12"
                    />
                  </div>
                )}
                
                <Button
                  variant="outline"
                  className="h-12 w-12 p-0 flex items-center justify-center border-border hover:bg-muted/10 active:scale-95 transition-all flex-shrink-0"
                  onClick={toggleWishlist}
                  aria-label="Aggiungi preferito"
                >
                  <Heart
                    className={cn(
                      "w-5 h-5 stroke-[2]",
                      isWishlisted ? "text-accent fill-accent" : "text-[#C9623B]"
                    )}
                  />
                </Button>
              </div>

              {/* Quality Courier indicators */}
              <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3 text-[10px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                  Corriere Refrigerato
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                  Consegna programmabile
                </span>
              </div>

              {/* Trust Indicators & Minimalist Payments Row (Italian grocery realism) */}
              <div className="pt-4 border-t border-border/40 space-y-3 select-none">
                <div className="flex flex-col gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span>
                    <span>Garantito Fresco: Scadenza minima 14 giorni</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">✓</span>
                    <span>Spedizione Termica Gratuita da €50 in box refrigerati</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Pagamenti Protetti SSL</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground/60 select-none">
                    <span className="text-[9px] font-bold border border-border/60 px-1.5 py-0.5 rounded select-none uppercase tracking-wider font-mono bg-white">Visa</span>
                    <span className="text-[9px] font-bold border border-border/60 px-1.5 py-0.5 rounded select-none uppercase tracking-wider font-mono bg-white">MC</span>
                    <span className="text-[9px] font-bold border border-border/60 px-1.5 py-0.5 rounded select-none uppercase tracking-wider font-mono bg-white">Amex</span>
                    <span className="text-[9px] font-bold border border-border/60 px-1.5 py-0.5 rounded select-none uppercase tracking-wider font-mono bg-white">Apple Pay</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual DOP Certification badge card */}
            <div className="border border-primary/20 bg-primary/5 rounded-2xl p-4 flex gap-3.5 items-start">
              <Award className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1C3B2B]">Qualità Gastronomica Garantita</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Ogni prodotto Alimentari è selezionato presso piccoli frantoi, caseifici o pastifici locali certificati DOP/IGP.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: Dynamic tabbed description grid */}
        <section className="border-t border-border/80 pt-8 space-y-6">
          <div className="flex gap-2 border-b border-border select-none">
            {[
              { id: "storia" as const, label: "Storia & Origine" },
              { id: "valori" as const, label: "Valori & Ingredienti" },
              { id: "consegna" as const, label: "Spedizioni & Packaging" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInfoTab(tab.id)}
                className={cn(
                  "px-4 py-2 font-serif text-sm font-bold border-b-2 transition-all",
                  activeInfoTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[120px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInfoTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="text-sm leading-relaxed text-muted-foreground space-y-4"
              >
                {activeInfoTab === "storia" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-3">
                      <h4 className="font-serif font-bold text-[#1C3B2B] text-base">La Tradizione di {product.brand || "Alimentari Artigiani"}</h4>
                      <p>
                        Coltivato in **{product.origin || "Italia"}** seguendo antiche metodologie di rotazione biologica delle colture. Estratto, impastato o stagionato artigianalmente per preservare integre le proprietà organolettiche naturali.
                      </p>
                      {product.description && <p>{product.description}</p>}
                    </div>
                    <div className="bg-muted/5 border border-border p-4 rounded-xl space-y-2.5">
                      <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest pl-0.5">Note di Filiera</h5>
                      <div className="flex gap-3 text-xs leading-normal">
                        <Leaf className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Filiera Corta Garantita</strong> <br />
                          Il prodotto viaggia direttamente dal produttore alle nostre cantine di condizionamento senza passaggi intermedi.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeInfoTab === "valori" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Ingredients list */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-[#1C3B2B] text-base">Ingredienti e Tracciabilità</h4>
                        <p className="italic text-foreground font-semibold">{product.ingredients || "100% Naturale senza aggiunta di conservanti artificiali."}</p>
                      </div>
                      <div className="space-y-1 text-xs">
                        <h5 className="font-bold text-primary uppercase">Allergeni</h5>
                        <p>{product.dietary === "Gluten Free" ? "Prodotto certificato Senza Glutine." : "Contiene derivati del frumento e glutine, potenziali tracce di frutta a guscio."}</p>
                      </div>
                    </div>

                    {/* Nutritional values */}
                    {product.nutrition && product.nutrition.calories !== "N/A" && (
                      <div className="space-y-3">
                        <h4 className="font-serif font-bold text-[#1C3B2B] text-base">Valori Nutrizionali Medi (per 100g)</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-border p-3.5 rounded-xl bg-[#FAF7F2] font-semibold text-xs text-muted-foreground">
                          <div className="flex justify-between border-b border-border/40 pb-1">
                            <span>Energia</span>
                            <span className="text-foreground font-bold">{product.nutrition.calories}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/40 pb-1">
                            <span>Grassi</span>
                            <span className="text-foreground font-bold">{product.nutrition.fat}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/40 pb-1">
                            <span>Carboidrati</span>
                            <span className="text-foreground font-bold">{product.nutrition.carbs}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/40 pb-1">
                            <span>Proteine</span>
                            <span className="text-foreground font-bold">{product.nutrition.protein}</span>
                          </div>
                          <div className="col-span-2 flex justify-between pt-0.5">
                            <span>Sodio</span>
                            <span className="text-foreground font-bold">{product.nutrition.sodium}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeInfoTab === "consegna" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-border p-4 rounded-xl space-y-2 bg-white">
                      <Truck className="w-6 h-6 text-primary stroke-[1.5]" />
                      <h5 className="font-serif font-bold text-[#1c3b2b]">Catena del Freddo</h5>
                      <p className="text-xs">
                        I latticini, i salumi e i freschi viaggiano a temperatura controllata costante (+4°C) in furgoni refrigerati.
                      </p>
                    </div>

                    <div className="border border-border p-4 rounded-xl space-y-2 bg-white">
                      <ShieldCheck className="w-6 h-6 text-primary stroke-[1.5]" />
                      <h5 className="font-serif font-bold text-[#1c3b2b]">Imballaggio Eco-Termico</h5>
                      <p className="text-xs">
                        Scatole termiche isolate 100% compostabili in fibra di cocco con gel refrigerante riutilizzabile.
                      </p>
                    </div>

                    <div className="border border-border p-4 rounded-xl space-y-2 bg-white">
                      <Lock className="w-6 h-6 text-primary stroke-[1.5]" />
                      <h5 className="font-serif font-bold text-[#1c3b2b]">Fatturazione e Resi</h5>
                      <p className="text-xs">
                        Ricevuta di acquisto e tracciabilità del lotto associate. Rimborso garantito in caso di difetti di freschezza.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* SECTION 3: FREQUENTLY BOUGHT TOGETHER COMBO GRID (World-class conversion tool) */}
        <section className="border-t border-border/80 pt-8 space-y-6 select-none bg-secondary/10 border rounded-2xl p-6 shadow-soft">
          <div className="space-y-1">
            <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight">
              Spesso Acquistati Insieme (Combo Ricetta)
            </h3>
            <p className="text-xs text-muted-foreground">
              Completa la ricetta con questi prodotti abbinati e ottieni uno sconto speciale dell&apos;8% sul totale!
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6 justify-between">
            {/* Visual plus list flow */}
            <div className="flex flex-wrap items-center gap-3 md:gap-5 justify-center">
              
              {/* Item 1: Active Product */}
              <div className="border border-border/80 rounded-xl p-3 bg-white flex gap-3 items-center max-w-[210px] shadow-sm">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
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
                  <h5 className="font-serif font-bold text-xs truncate text-foreground">{product.name}</h5>
                  <span className="text-[10px] text-muted-foreground">€{product.price.toFixed(2)}</span>
                </div>
              </div>

              <span className="text-lg font-bold text-muted-foreground">+</span>

              {/* Item 2: Bought Together 1 */}
              <div className="border border-border/80 rounded-xl p-3 bg-white flex gap-3 items-center max-w-[210px] shadow-sm">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image
                    src={boughtTogetherItem.imageUrl}
                    alt={boughtTogetherItem.name}
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
                  <h5 className="font-serif font-bold text-xs truncate text-foreground">{boughtTogetherItem.name}</h5>
                  <span className="text-[10px] text-muted-foreground">€{boughtTogetherItem.price.toFixed(2)}</span>
                </div>
              </div>

              <span className="text-lg font-bold text-muted-foreground">+</span>

              {/* Item 3: Bought Together 2 */}
              <div className="border border-border/80 rounded-xl p-3 bg-white flex gap-3 items-center max-w-[210px] shadow-sm">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image
                    src={boughtTogetherItem2.imageUrl}
                    alt={boughtTogetherItem2.name}
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
                  <h5 className="font-serif font-bold text-xs truncate text-foreground">{boughtTogetherItem2.name}</h5>
                  <span className="text-[10px] text-muted-foreground">€{boughtTogetherItem2.price.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Total price & CTA button */}
            <div className="border-t lg:border-t-0 lg:border-l border-border/80 pt-4 lg:pt-0 lg:pl-6 flex flex-col items-center lg:items-end justify-center gap-3 flex-shrink-0">
              <div className="text-center lg:text-right">
                <span className="text-xs text-muted-foreground font-semibold block">Prezzo del Pacchetto Combo</span>
                <div className="flex items-baseline gap-2 mt-0.5 justify-center lg:justify-end">
                  <span className="text-2xl font-bold text-primary">€{discountedComboPrice.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground line-through">€{comboPrice.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handleAddComboToCart}
                variant="accent"
                className="font-bold text-xs h-10 shadow-soft"
              >
                Aggiungi Combo al Carrello
              </Button>
            </div>
          </div>
        </section>

        {/* SECTION 4: RELATED PRODUCTS CAROUSEL GRID */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-6 select-none">
            <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight">
              Prodotti Consigliati dello Stesso Reparto
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((prod) => {
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
        )}

      </main>

      {/* FOOTER PILLARS */}
      <Footer />

      {/* STICKY BOTTOM SHOPPING BAR ON MOBILE DEVICES (Peak conversion detail!) */}
      <AnimatePresence>
        {showStickyMobileBar && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFECE6]/60 p-3.5 pb-safe flex justify-between items-center shadow-lg select-none"
          >
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground truncate block max-w-[150px]">{product.name}</span>
              <span className="font-bold text-[#1C3B2B] text-base block mt-0.5">
                €{(purchaseType === "subscription" ? product.price * 0.95 : product.price).toFixed(2)}
              </span>
            </div>

            {quantityInCart === 0 ? (
              <Button
                onClick={() => handleQuantityChange(product.id, 1)}
                variant="primary"
                size="sm"
                className="font-bold text-xs h-10 shadow-soft"
              >
                + Aggiungi
              </Button>
            ) : (
              <QuantitySelector
                value={quantityInCart}
                onChange={(qty) => handleQuantityChange(product.id, qty)}
                size="sm"
                className="w-28"
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
            className="fixed inset-0 z-[110] bg-espresso/95 backdrop-blur-sm cursor-zoom-out flex items-center justify-center p-4"
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
                  className="object-contain rounded-xl shadow-2xl"
                  onError={(e) => {
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
