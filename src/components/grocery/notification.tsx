"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle } from "lucide-react";
import { Product } from "@/components/grocery/product-card";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/store/cart";

interface NotificationProps {
  toast: {
    id: string;
    product: Product;
  } | null;
  onClose: () => void;
}

export function Notification({ toast, onClose }: NotificationProps) {
  const { t, locale } = useTranslation();
  const cartError = useCartStore((state) => state.error);

  useEffect(() => {
    if (cartError && toast) {
      onClose();
    }
  }, [cartError, toast, onClose]);

  useEffect(() => {
    if (cartError) {
      const timer = setTimeout(() => {
        useCartStore.setState({ error: null });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [cartError]);

  useEffect(() => {
    if (toast && !cartError) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast, cartError, onClose]);

  const handleDismissError = () => {
    useCartStore.setState({ error: null });
  };

  return (
    <AnimatePresence>
      {cartError ? (
        <div
          key={`error-${cartError}`}
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-sm pointer-events-none select-none"
        >
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="pointer-events-auto bg-white border border-rose-200 shadow-elevation rounded-xl p-3.5 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center flex-shrink-0 text-rose-600">
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5 text-rose-600">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {locale === "it" ? "Attenzione Carrello" : "Cart Error"}
                </span>
              </div>
              <p className="font-sans text-xs font-semibold text-slate-800 pr-2 mt-0.5 leading-snug">
                {cartError}
              </p>
            </div>

            <button
              onClick={handleDismissError}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-rose-50 active:scale-90 text-slate-500 transition-all"
              aria-label={t("notification.dismissAria")}
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </motion.div>
        </div>
      ) : toast ? (
        <div
          key={`toast-${toast.id}`}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-sm pointer-events-none select-none"
        >
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="pointer-events-auto bg-card border border-border shadow-elevation rounded-xl p-3.5 flex items-center gap-3 bg-white"
          >
            {/* Small Product Thumbnail */}
            <div className="w-11 h-11 bg-muted/20 border border-border rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image
                src={toast.product.imageUrl}
                alt={toast.product.name}
                fill
                sizes="44px"
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                  e.currentTarget.srcset = "";
                }}
              />
            </div>

            {/* Success Label */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5 text-success">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t("notification.addedToCart")}</span>
              </div>
              <h5 className="font-serif text-sm font-semibold text-foreground truncate pr-2 mt-0.5 leading-tight">
                {toast.product.name}
              </h5>
            </div>

            {/* Clear Trigger */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted/10 active:scale-90 text-muted-foreground transition-all"
              aria-label={t("notification.dismissAria")}
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
