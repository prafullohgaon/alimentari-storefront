"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/data";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export interface CartItem {
  product: Product;
  quantity: number;
}

import {
  useCartStore,
  getCartItemKey,
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
} from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { cartStorage } from "@/lib/cart-storage";
import { useTranslation } from "@/hooks/use-translation";
import { useSession } from "next-auth/react";

const FREE_SHIPPING_THRESHOLD = 50;

function CartDrawerContent({ onClose }: { onClose: () => void }) {
  const { t, locale } = useTranslation();
  const items = useCartStore((state) => state.items);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const discountCode = useCartStore((state) => state.discountCode);
  const subtotal = useCartStore(selectCartSubtotal);
  const discountAmount = useCartStore(selectCartDiscount);
  const total = useCartStore(selectCartTotal);
  const onQuantityChange = useCartStore((state) => state.updateQuantity);
  const onRemoveItem = useCartStore((state) => state.removeItem);

  const [removingProductId, setRemovingProductId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSyncing) {
      setRemovingProductId(null);
    }
  }, [isSyncing]);

  const handleRemove = (productId: string) => {
    if (removingProductId === productId) return;
    setRemovingProductId(productId);
    onRemoveItem(productId);
  };

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const isFreeShipping = subtotal > 0 && remainingForFreeShipping === 0;
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const drawerRef = useFocusTrap({ active: true, onEscape: onClose });

  const isLoadingState = items.length === 0 && isSyncing;

  return (
    <>
      {/* Backdrop Blur Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-espresso/45 backdrop-blur-sm cursor-pointer"
      />

      {/* Sliding Cart Container */}
      <motion.div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white border-l border-border shadow-elevation flex flex-col"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border select-none">
          <div className="flex items-center gap-2">
            {isLoadingState ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <ShoppingBag className="w-5 h-5 text-primary stroke-[2.5]" />
            )}
            <h2 id="cart-title" className="font-serif text-lg font-bold text-foreground">
              {isLoadingState
                ? t("cartDrawer.adding")
                : t("cartDrawer.headerTitle", { count: items.reduce((acc, i) => acc + i.quantity, 0) })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted/15 btn-touch-active transition-all"
            aria-label={t("cartDrawer.closeAria")}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-secondary/60 px-4 py-3 border-b border-border select-none">
          <p className="text-xs font-semibold text-foreground mb-1.5 flex justify-between">
            <span>
              {isLoadingState ? (
                <span className="text-muted font-medium">{t("cartDrawer.calcFreeShipping")}</span>
              ) : isFreeShipping ? (
                <span className="text-primary font-bold">{t("cartDrawer.freeShippingUnlocked")}</span>
              ) : (
                <span>{t("cartDrawer.freeShippingGoal", { amount: `€${remainingForFreeShipping.toFixed(2)}` })}</span>
              )}
            </span>
            <span className="text-muted font-bold">{isLoadingState ? "..." : `${Math.round(progressPercent)}%`}</span>
          </p>
          <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: isLoadingState ? "35%" : `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingState ? (
            /* Dedicated Loading Skeleton when items.length === 0 && isSyncing */
            <div className="space-y-4 animate-pulse select-none py-2">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary/80 py-2.5 bg-primary/5 rounded-lg border border-primary/10">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{t("cartDrawer.adding")}</span>
              </div>
              {[1, 2].map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 bg-secondary/40 rounded-lg border border-border/40"
                >
                  <div className="w-16 h-16 rounded-md bg-muted/25 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted/30 rounded w-3/4" />
                    <div className="h-3 bg-muted/20 rounded w-1/2" />
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-6 w-16 bg-muted/25 rounded-full" />
                      <div className="h-4 w-12 bg-muted/30 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-muted select-none py-12">
              <ShoppingBag className="w-12 h-12 stroke-[1.5] text-muted/60" />
              <p className="font-sans text-sm font-semibold text-foreground">{t("cartDrawer.emptyCart")}</p>
              <p className="text-xs text-muted max-w-[220px]">{t("cartDrawer.emptySubtitle")}</p>
            </div>
          ) : (
            items.map((item) => {
              const itemKey = getCartItemKey(item);
              const isRemoving = removingProductId === itemKey && isSyncing;
              const maxStock =
                typeof item.product.stock === "number" &&
                Number.isFinite(item.product.stock) &&
                item.product.stock > 0
                  ? item.product.stock
                  : undefined;

              return (
                <div
                  key={itemKey}
                  className={cn(
                    "flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/40 select-none group transition-all duration-200",
                    isRemoving && "opacity-50 pointer-events-none bg-red-50/20 border-red-200/50"
                  )}
                >
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-secondary border border-border flex-shrink-0">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-foreground truncate">{item.product.name}</h3>
                      {isRemoving && (
                        <span className="text-[10px] font-semibold text-red-600 animate-pulse flex-shrink-0">
                          {t("cartDrawer.removing")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted font-medium mt-0.5">€{item.product.price.toFixed(2)} / {item.product.unit || "pz"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantitySelector
                        value={item.quantity}
                        max={maxStock}
                        onChange={(qty) => onQuantityChange(itemKey, qty)}
                        size="sm"
                      />
                      <span className="text-xs font-extrabold text-foreground">
                        €{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(itemKey)}
                    disabled={isRemoving}
                    className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-red-50 text-muted hover:text-red-600 transition-colors btn-touch-active flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label={t("cartDrawer.removeItemAria")}
                  >
                    {isRemoving ? (
                      <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Checkout CTA */}
        {isLoadingState ? (
          <div className="p-4 border-t border-border bg-card space-y-3 select-none animate-pulse">
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-muted/25 rounded w-20" />
                <div className="h-3 bg-muted/25 rounded w-12" />
              </div>
              <div className="flex justify-between pt-1 border-t border-border/60">
                <div className="h-4 bg-muted/30 rounded w-24" />
                <div className="h-4 bg-muted/30 rounded w-16" />
              </div>
            </div>
            <button
              disabled
              className="w-full h-12 bg-primary/60 text-white font-bold text-sm rounded-md flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{t("cartDrawer.syncing")}</span>
            </button>
          </div>
        ) : items.length > 0 ? (
          <div className="p-4 border-t border-border bg-card space-y-3 select-none">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted font-medium">
                <span>{t("cartDrawer.subtotal")}</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              {discountCode && discountAmount > 0 && (
                <div className="flex justify-between text-xs text-success font-bold">
                  <span>{locale === "it" ? `Sconto (${discountCode})` : `Discount (${discountCode})`}</span>
                  <span>- €{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted font-medium">
                <span>{t("cartDrawer.shipping")}</span>
                <span>{isFreeShipping ? <strong className="text-primary font-bold">{t("cartDrawer.free")}</strong> : t("cartDrawer.calculatedAtCheckout")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border/60">
                <span>{t("cartDrawer.estimatedTotal")}</span>
                <span className="text-base font-extrabold text-primary">€{total.toFixed(2)}</span>
              </div>
            </div>

            <CheckoutButton items={items} />

            <div className="text-center space-y-1 pt-1">
              <p className="text-[11px] text-muted/90 tracking-wide font-medium leading-relaxed">
                {t("cartDrawer.coldChain")}
              </p>
              <p className="text-[11px] text-muted/80 tracking-wide font-semibold">
                {t("cartDrawer.vatInfo")}
              </p>
            </div>
          </div>
        ) : null}
      </motion.div>
    </>
  );
}

export function CartDrawer() {
  const isOpen = useUiStore((state) => state.cartOpen);
  const onClose = useUiStore((state) => state.closeCart);

  return (
    <AnimatePresence>
      {isOpen && <CartDrawerContent onClose={onClose} />}
    </AnimatePresence>
  );
}

function CheckoutButton({ items }: { items: CartItem[] }) {
  const { t, locale } = useTranslation();
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const handleCheckout = async () => {
    if (status === "loading") return;

    setIsRedirecting(true);
    const cartId = useCartStore.getState().cartId;
    const checkoutUrlState = useCartStore.getState().checkoutUrl;
    const isAuthenticated = status === "authenticated" && Boolean(session?.user);

    // 1. Guest Authentication Gate
    if (!isAuthenticated) {
      cartStorage.setPendingCheckoutIntent(true);
      useUiStore.getState().closeCart();
      setIsRedirecting(false);
      window.location.assign("/accedi?redirect=checkout");
      return;
    }

    // 2. Authenticated User Checkout Execution
    try {
      let targetUrl = checkoutUrlState;

      if (!targetUrl || !targetUrl.startsWith("https://")) {
        const { checkoutCart } = await import("@/lib/shopify");
        targetUrl = await checkoutCart(cartId, items, locale);
      }

      if (targetUrl && targetUrl.startsWith("https://")) {
        cartStorage.clearPendingCheckoutIntent();
        window.location.assign(targetUrl);
      } else {
        alert(t("cartDrawer.redirectError"));
        setIsRedirecting(false);
      }
    } catch {
      setIsRedirecting(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isRedirecting}
      className={cn(
          "w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-md flex items-center justify-center gap-2 select-none shadow-sm transition-all duration-200",
          "active:scale-[0.99] active:bg-primary/80 btn-touch-active disabled:opacity-50 disabled:cursor-not-allowed"
        )}
    >
      {isRedirecting ? (
        <>
          <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          {t("cartDrawer.redirecting")}
        </>
      ) : (
        <>
          {t("cartDrawer.checkout")}
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </>
      )}
    </button>
  );
}
