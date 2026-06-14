"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/data";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export interface CartItem {
  product: Product;
  quantity: number;
}

import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";

const FREE_SHIPPING_THRESHOLD = 50;

export function CartDrawer() {
  const isOpen = useUiStore((state) => state.cartOpen);
  const onClose = useUiStore((state) => state.closeCart);
  
  const items = useCartStore((state) => state.items);
  const onQuantityChange = useCartStore((state) => state.updateQuantity);
  const onRemoveItem = useCartStore((state) => state.removeItem);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const isFreeShipping = remainingForFreeShipping === 0;
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const drawerRef = useFocusTrap({ active: isOpen, onEscape: onClose });


  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 select-none">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary stroke-[2.5]" />
                <h3 id="cart-title" className="font-sans text-lg font-extrabold text-slate-900 tracking-tight">Carrello</h3>
                <span className="bg-secondary text-primary text-xs font-bold px-2 py-0.5 rounded-full border border-primary">
                  {items.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary active:scale-90 text-primary transition-all"
                aria-label="Chiudi carrello"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Shipping Goal Indicator */}
            {items.length > 0 && (
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 select-none">
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                  {isFreeShipping ? (
                    <span className="text-primary flex items-center gap-1">
                      🎉 Spedizione Gratuita Raggiunta!
                    </span>
                  ) : (
                    <span>
                      Ti mancano <strong className="text-primary font-bold">€{remainingForFreeShipping.toFixed(2)}</strong> per la spedizione gratuita
                    </span>
                  )}
                  <span>€{subtotal.toFixed(2)} / €{FREE_SHIPPING_THRESHOLD.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out bg-primary"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 select-none animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-green-600 mb-4">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h4 className="font-sans text-base font-extrabold text-slate-900 mb-1">Il tuo carrello è vuoto</h4>
                  <p className="text-xs text-slate-500 max-w-[240px] mb-6 font-semibold">
                    Aggiungi le nostre fresche specialità italiane per riempire la tua tavola.
                  </p>
                  <button
                    onClick={onClose}
                    className="h-10 px-6 border border-border hover:bg-secondary font-bold text-xs text-primary rounded-md shadow-sm transition-colors"
                  >
                    Continua lo shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-4 py-4 first:pt-0 last:pb-0 group"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-20 h-20 bg-secondary rounded-md overflow-hidden border border-border flex-shrink-0 relative">
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

                      {/* Detail Column */}
                      <div className="flex-grow flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-sans font-bold text-sm text-foreground leading-snug tracking-tight">
                              {item.product.name}
                            </h4>
                            <span className="text-[11px] text-muted font-semibold block mt-0.5">
                              {item.product.unit}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-foreground whitespace-nowrap">
                            €{(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity controls and delete row */}
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <QuantitySelector
                            value={item.quantity}
                            onChange={(qty) => onQuantityChange(item.product.id, qty)}
                            max={item.product.stock || 20}
                            size="sm"
                          />
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-55/10 transition-all active:scale-95"
                            aria-label="Rimuovi prodotto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary Container */}
            {items.length > 0 && (
              <div className="border-t border-border px-6 py-6 bg-card shadow-lg select-none">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs text-muted font-semibold">
                    <span>Imponibile</span>
                    <span>€{(subtotal * 0.9).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted font-semibold">
                    <span>IVA (10% Grocery)</span>
                    <span>€{(subtotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                    <span>Totale Spesa</span>
                    <span className="text-lg font-extrabold tracking-tight">€{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <CheckoutButton items={items} />

                <div className="mt-3.5 space-y-2 text-center select-none">
                  <p className="text-[10px] text-muted leading-relaxed font-semibold">
                    ❄️ <strong>Catena del Freddo Garantita</strong>: i tuoi prodotti freschi viaggiano in box termici refrigerati per mantenere inalterata la qualità.
                  </p>
                  <p className="text-[11px] text-muted/80 tracking-wide font-semibold">
                    IVA inclusa. Spedizione calcolata al checkout. SSL Secure Connection.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CheckoutButton({ items }: { items: CartItem[] }) {
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const handleCheckout = async () => {
    setIsRedirecting(true);
    try {
      const { checkoutCart } = await import("@/lib/shopify");
      const checkoutUrl = await checkoutCart(items);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout redirection failed:", error);
      alert("Si è verificato un errore durante il reindirizzamento al checkout.");
    } finally {
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
          Reindirizzamento in corso...
        </>
      ) : (
        <>
          Procedi al pagamento
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </>
      )}
    </button>
  );
}
