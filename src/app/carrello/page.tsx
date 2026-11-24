"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  CalendarDays,
  Percent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { CartDrawer, CartItem } from "@/components/grocery/cart-drawer";
import { Notification } from "@/components/grocery/notification";

const FREE_SHIPPING_THRESHOLD = 50;

import {
  useCartStore,
  getCartItemKey,
  getSavedItemKey,
  findCartItemByIdentifier,
  saveCartItemForLater,
  restoreSavedCartItem,
  removeSavedCartItem,
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
} from "@/store/cart";
import { useTranslation } from "@/hooks/use-translation";
import { useSession } from "next-auth/react";
import { cartStorage } from "@/lib/cart-storage";

export default function CartPage() {
  const router = useRouter();
  const { locale, setLocale, dict: t } = useTranslation();
  const { data: session, status } = useSession();
  
  // Zustand Global Cart Store integration
  const cart = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const discountCode = useCartStore((state) => state.discountCode);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const subtotal = useCartStore(selectCartSubtotal);
  const discountAmount = useCartStore(selectCartDiscount);
  const finalTotal = useCartStore(selectCartTotal);

  const [saveForLater, setSaveForLater] = useState<CartItem[]>([]);
  const [saveLaterError, setSaveLaterError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; product: Product } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Simulated subscription options for items in cart
  const [recurringFrequencies, setRecurringFrequencies] = useState<Record<string, "one-time" | "weekly" | "monthly">>({});

  // Loading Skeleton State (for high-end wow-factor feel)
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Simulate loading transition
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    const savedLater = localStorage.getItem("alimentari_save_later");

    if (savedLater) {
      try {
        setSaveForLater(JSON.parse(savedLater));
      } catch (e) {
        console.error("Save later parse error", e);
      }
    }

    return () => clearTimeout(timer);
  }, []);

  const saveLaterState = (newLater: CartItem[]) => {
    setSaveForLater(newLater);
    localStorage.setItem("alimentari_save_later", JSON.stringify(newLater));
  };

  const handleQuantityChange = (identifier: string, qty: number) => {
    const existing = findCartItemByIdentifier(useCartStore.getState().items, identifier);
    const productObj =
      existing?.product || findCartItemByIdentifier(saveForLater, identifier)?.product;

    if (!existing && qty === 1 && productObj) {
      setToast({ id: String(Date.now()), product: productObj });
    }

    if (qty <= 0) {
      removeItem(identifier);
    } else if (existing) {
      updateQuantity(identifier, qty);
    } else if (productObj) {
      addItem(productObj, qty);
    }
  };

  const handleRemoveItem = (identifier: string) => {
    removeItem(identifier);
  };

  // Save for later flows
  const moveToSaveForLater = (identifier: string) => {
    setSaveLaterError(null);
    const { itemToMove, updatedSavedItems } = saveCartItemForLater(
      cart,
      saveForLater,
      identifier
    );
    if (!itemToMove) return;

    // Filter out of cart using exact variant/line identifier
    removeItem(getCartItemKey(itemToMove));

    // Persist in save later
    saveLaterState(updatedSavedItems);
  };

  const moveToActiveCart = (identifier: string) => {
    setSaveLaterError(null);
    const result = restoreSavedCartItem(saveForLater, identifier, locale);
    if (!result.canRestore || !result.itemToRestore) {
      setSaveLaterError(
        result.error ||
          (locale === "it"
            ? "Impossibile ripristinare la variante selezionata."
            : "Unable to restore the selected variant.")
      );
      return;
    }

    saveLaterState(result.updatedSavedItems);
    addItem(result.itemToRestore.product, result.restoreQuantity);
  };

  const removeSaveLaterItem = (identifier: string) => {
    setSaveLaterError(null);
    const updatedLater = removeSavedCartItem(saveForLater, identifier);
    saveLaterState(updatedLater);
  };


  // Coupon trigger
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError(
        locale === "it"
          ? "Inserisci un codice promozionale valido."
          : "Please enter a valid promotional code."
      );
      return;
    }

    const res = await useCartStore.getState().applyDiscountCode(code);
    if (res.success) {
      setCouponCode("");
      setCouponSuccess(
        locale === "it"
          ? `Codice "${code}" applicato al carrello!`
          : `Promo code "${code}" applied to cart!`
      );
    } else {
      setCouponError(
        res.error ||
          (locale === "it"
            ? "Codice promozionale non valido, scaduto o non applicabile."
            : "Invalid, expired, or inapplicable promotional code.")
      );
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponError("");
    setCouponSuccess("");
    const res = await useCartStore.getState().removeDiscountCode();
    if (res.success) {
      setCouponSuccess(
        locale === "it"
          ? "Codice promozionale rimosso."
          : "Promotional code removed."
      );
    } else if (res.error) {
      setCouponError(res.error);
    }
  };

  // Subscription frequency mapper
  const handleSubFrequencyChange = (productId: string, freq: "one-time" | "weekly" | "monthly") => {
    setRecurringFrequencies((prev) => ({
      ...prev,
      [productId]: freq
    }));
    // Save these frequencies so checkout can render them
    localStorage.setItem("alimentari_recurring_freqs", JSON.stringify({
      ...recurringFrequencies,
      [productId]: freq
    }));
  };

  const handleCheckout = async () => {
    if (status === "loading") return;

    const isAuthenticated = status === "authenticated" && Boolean(session?.user);
    if (!isAuthenticated) {
      cartStorage.setPendingCheckoutIntent(true);
      setIsRedirecting(false);
      router.push("/accedi?redirect=checkout");
      return;
    }

    setIsRedirecting(true);
    const cartId = useCartStore.getState().cartId;
    const checkoutUrlState = useCartStore.getState().checkoutUrl;

    try {
      const { trackCheckoutStart } = await import("@/lib/analytics");
      trackCheckoutStart(cart, finalTotal);

      let targetUrl = checkoutUrlState;

      if (!targetUrl || !targetUrl.startsWith("https://")) {
        const { checkoutCart } = await import("@/lib/shopify");
        targetUrl = await checkoutCart(cartId, cart, locale);
      }

      if (targetUrl && targetUrl.startsWith("https://")) {
        cartStorage.clearPendingCheckoutIntent();
        window.location.assign(targetUrl);
      } else {
        alert(locale === "it"
          ? "Si è verificato un errore durante il reindirizzamento al checkout di Shopify."
          : "An error occurred during Shopify checkout redirection.");
        setIsRedirecting(false);
      }
    } catch {
      setIsRedirecting(false);
    }
  };

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const isFreeShipping = subtotal > 0 && remainingForFreeShipping === 0;
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 flex flex-col font-sans">
      <DesktopNavbar
        onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")}
      />

      <MobileNavbar
        onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Upper title details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 pb-6 mb-8 gap-4 select-none">
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground">
              {t.cart.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === "it"
                ? `Gestisci i tuoi articoli selezionati ed attiva formule abbonamento Subscribe & Save`
                : `Manage your items and configure Subscribe & Save recurring orders`}
            </p>
          </div>

          <div className="flex gap-1.5 border border-border rounded-lg p-0.5 bg-muted/10 font-bold text-xs select-none">
            <button
              onClick={() => setLocale("it")}
              className={cn("px-2.5 py-1.5 rounded", locale === "it" ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
            >
              IT
            </button>
            <button
              onClick={() => setLocale("en")}
              className={cn("px-2.5 py-1.5 rounded", locale === "en" ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
            >
              EN
            </button>
          </div>
        </div>

        {isPageLoading ? (
          /* Skeleton Loader UI */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 select-none">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-border/60 rounded-xl p-4 bg-card flex gap-4 animate-pulse">
                  <div className="w-20 h-20 bg-muted/40 rounded-lg" />
                  <div className="flex-grow space-y-2">
                    <div className="h-4 bg-muted/40 rounded w-2/3" />
                    <div className="h-3 bg-muted/40 rounded w-1/4" />
                    <div className="h-8 bg-muted/40 rounded w-1/3 mt-2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border border-border/60 rounded-2xl p-6 bg-card h-80 animate-pulse" />
          </div>
        ) : cart.length === 0 ? (
          /* Empty Active Cart State */
          <div className="text-center py-20 select-none bg-card border border-border rounded-2xl shadow-soft max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center text-primary mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className="font-serif text-xl font-bold mb-1.5">{t.cart.empty}</h4>
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto mb-6">
              {locale === "it"
                ? "Sfoglia i nostri dipartimenti per aggiungere eccellenze bio alla tua tavola."
                : "Explore our departments to fill your table with biological Italian specialties."}
            </p>
            <Button
              onClick={() => router.push("/reparto")}
              variant="primary"
              className="font-bold text-sm shadow-soft"
            >
              {locale === "it" ? "Inizia la Spesa" : "Shop Now"}
            </Button>
          </div>
        ) : (
          /* Full Dense Shopping Cart Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Hand: Cart Items Grid */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping threshold indicator */}
              <div className="border border-border/80 rounded-2xl p-5 bg-card shadow-soft select-none">
                <div className="flex justify-between text-xs font-semibold text-foreground mb-2">
                  {isFreeShipping ? (
                    <span className="text-success flex items-center gap-1 font-bold">
                      🎉 Spedizione Gratuita Raggiunta!
                    </span>
                  ) : (
                    <span>
                      Ti mancano <strong className="text-primary font-bold">€{remainingForFreeShipping.toFixed(2)}</strong> per la spedizione gratuita
                    </span>
                  )}
                  <span>€{subtotal.toFixed(2)} / €{FREE_SHIPPING_THRESHOLD.toFixed(2)}</span>
                </div>
                <div className="w-full h-2.5 bg-border/60 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      isFreeShipping ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Cart List */}
              <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-soft divide-y divide-border/60">
                {cart.map((item) => {
                  const itemKey = getCartItemKey(item);
                  const itemFreq = recurringFrequencies[itemKey] || "one-time";
                  const isRecurring = itemFreq !== "one-time";
                  const maxStock =
                    typeof item.product.stock === "number" &&
                    Number.isFinite(item.product.stock) &&
                    item.product.stock > 0
                      ? item.product.stock
                      : null;
                  const isAtMaxStock = maxStock !== null && item.quantity >= maxStock;

                  return (
                    <div
                      key={itemKey}
                      className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/5 transition-all group"
                    >
                      {/* Product details Column */}
                      <div className="flex gap-4 items-start">
                        <div className="w-20 h-20 relative flex-shrink-0 rounded-xl overflow-hidden border border-border/70">
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                              e.currentTarget.srcset = "";
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="font-serif font-bold text-base text-foreground leading-snug tracking-tight">
                              {item.product.name}
                            </span>
                            {item.product.isOrganic && (
                              <Badge className="bg-success/15 text-success border border-success/20 text-[9px] font-bold py-0 h-4">
                                Bio
                              </Badge>
                            )}
                          </div>

                          <span className="text-xs text-muted-foreground block">
                            {item.product.unit ? `${item.product.unit} • ` : ""}€{item.product.price.toFixed(2)}
                          </span>

                          {/* Shopify Subscription App simulation hooks */}
                          <div className="pt-2 flex items-center gap-2 select-none">
                            <CalendarDays className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                            <select
                              value={itemFreq}
                              onChange={(e) => handleSubFrequencyChange(itemKey, e.target.value as "one-time" | "weekly" | "monthly")}
                              className="bg-transparent text-[11px] font-bold text-foreground border border-border/80 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            >
                              <option value="one-time">{locale === "it" ? "Acquisto Singolo" : "One-Time Purchase"}</option>
                              <option value="weekly">{locale === "it" ? "Abbonati: Ogni Settimana (-5%)" : "Subscribe: Every Week (-5%)"}</option>
                              <option value="monthly">{locale === "it" ? "Abbonati: Ogni Mese (-5%)" : "Subscribe: Every Month (-5%)"}</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Quantity editors and pricing column */}
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                        {/* Selector */}
                        <div className="flex items-center gap-2 select-none">
                          <button
                            onClick={() => handleQuantityChange(itemKey, item.quantity - 1)}
                            className="w-8 h-8 rounded border border-border/80 bg-card hover:bg-muted/10 font-bold flex items-center justify-center active:scale-90 transition-all text-xs"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(itemKey, item.quantity + 1)}
                            disabled={isAtMaxStock}
                            className="w-8 h-8 rounded border border-border/80 bg-card hover:bg-muted/10 font-bold flex items-center justify-center active:scale-90 transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        {/* pricing totals */}
                        <div className="text-right whitespace-nowrap min-w-[70px]">
                          <span className="font-bold text-sm block">
                            €{(item.product.price * item.quantity).toFixed(2)}
                          </span>
                          {isRecurring && (
                            <span className="text-[10px] text-success font-bold block">
                              {locale === "it" ? "Ricorrente" : "Recurring"}
                            </span>
                          )}
                        </div>

                        {/* Save later or delete */}
                        <div className="flex gap-1 items-center select-none">
                          <button
                            onClick={() => moveToSaveForLater(itemKey)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/10 active:scale-90 text-muted-foreground hover:text-primary transition-all"
                            title={t.cart.saveForLater}
                          >
                            <Bookmark className="w-4.5 h-4.5 stroke-[2]" />
                          </button>

                          <button
                            onClick={() => handleRemoveItem(itemKey)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-error/5 active:scale-90 text-muted-foreground hover:text-error transition-all"
                          >
                            <Trash2 className="w-4.5 h-4.5 stroke-[2]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SAVE FOR LATER LIST */}
              {saveForLater.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-border/60">
                  <h3 className="font-serif text-xl font-bold flex items-center gap-2 select-none">
                    <Bookmark className="w-5 h-5 text-primary" />
                    {locale === "it" ? "Salvati per Dopo" : "Saved for Later"}
                    <span className="bg-muted px-2 py-0.5 text-xs rounded-full font-bold">
                      {saveForLater.length}
                    </span>
                  </h3>

                  {saveLaterError && (
                    <div
                      role="alert"
                      className="p-3 rounded-xl bg-error/10 border border-error/25 text-xs font-semibold text-error"
                    >
                      {saveLaterError}
                    </div>
                  )}

                  <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-soft divide-y divide-border/60">
                    {saveForLater.map((item) => {
                      const savedKey = getSavedItemKey(item);
                      const isSavedVariantUnavailable =
                        item.product.available === false ||
                        (typeof item.product.stock === "number" && item.product.stock <= 0);

                      return (
                        <div
                          key={savedKey}
                          className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex gap-3 items-center">
                            <div className="w-12 h-12 relative flex-shrink-0 rounded-lg overflow-hidden border">
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                                  e.currentTarget.srcset = "";
                                }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-serif font-bold text-sm text-foreground">
                                  {item.product.name}
                                </h4>
                                {isSavedVariantUnavailable && (
                                  <Badge className="bg-error/10 text-error border border-error/20 text-[10px] font-bold py-0 h-4">
                                    {locale === "it" ? "Esaurito" : "Sold Out"}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {item.product.unit ? `${item.product.unit} • ` : ""}€{item.product.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-center select-none">
                            <button
                              onClick={() => removeSaveLaterItem(savedKey)}
                              className="text-xs font-bold text-error hover:underline uppercase tracking-wide"
                            >
                              {locale === "it" ? "Rimuovi" : "Remove"}
                            </button>
                            <Button
                              onClick={() => moveToActiveCart(savedKey)}
                              variant="outline"
                              size="sm"
                              className="font-bold text-xs h-8 border-primary text-primary hover:bg-primary/5"
                            >
                              {locale === "it" ? "Ripristina" : "Restore"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Hand: Sticky Summary Billing panel */}
            <aside className="space-y-6">
              <div className="border border-border/80 rounded-2xl p-6 bg-card shadow-premium sticky top-28 space-y-6 select-none">
                <h3 className="font-serif text-xl font-bold tracking-tight pb-3 border-b border-border/50">
                  {t.cart.summary}
                </h3>

                {/* Pricing Table details */}
                <div className="space-y-3.5 text-sm font-semibold text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{locale === "it" ? "Imponibile" : "Subtotal"}</span>
                    <span className="text-foreground">€{subtotal.toFixed(2)}</span>
                  </div>

                  {discountCode && discountAmount > 0 && (
                    <div className="flex justify-between items-center text-success font-bold">
                      <span className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" />
                        <span>
                          {locale === "it"
                            ? `Sconto (${discountCode})`
                            : `Discount (${discountCode})`}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          disabled={isSyncing}
                          className="ml-1 text-[11px] text-muted-foreground hover:text-error underline font-semibold disabled:opacity-50"
                        >
                          {locale === "it" ? "Rimuovi" : "Remove"}
                        </button>
                      </span>
                      <span>- €{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>{t.checkout.shipping}</span>
                    <span className="text-foreground">
                      {isFreeShipping ? (
                        <span className="text-success font-bold">{t.cart.free}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
                          {locale === "it" ? "Calcolata al checkout" : "Calculated at checkout"}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-foreground pt-4 border-t border-border">
                    <span>{t.checkout.total}</span>
                    <span className="text-2xl tracking-tight text-primary">
                      €{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Coupon Code section */}
                <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                    {t.cart.couponCode}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.cart.couponPlaceholder}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-10 uppercase font-bold text-xs"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-10 text-xs font-bold border-primary text-primary hover:bg-primary/5"
                    >
                      {t.cart.applyCoupon}
                    </Button>
                  </div>

                  {couponError && <p className="text-xs text-error font-medium pl-0.5">{couponError}</p>}
                  {couponSuccess && <p className="text-xs text-success font-semibold pl-0.5">{couponSuccess}</p>}
                </form>

                {/* Checkout Trigger */}
                <Button
                  onClick={handleCheckout}
                  disabled={isRedirecting}
                  variant="primary"
                  className="w-full h-13 text-base font-bold shadow-soft flex items-center justify-center gap-2"
                >
                  {isRedirecting ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2" />
                      {locale === "it" ? "Reindirizzamento..." : "Redirecting..."}
                    </>
                  ) : (
                    <>
                      {t.cart.checkout}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                {/* Trust indications */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-center gap-2 text-xs text-muted-foreground font-semibold">
                  <ShieldCheck className="w-4.5 h-4.5 text-success" />
                  <span>Checkout Crittografato SSL • 081 Food & Beverage</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <CartDrawer />

      <Notification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
