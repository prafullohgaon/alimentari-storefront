"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { Product } from "@/components/grocery/product-card";

interface NotificationProps {
  toast: {
    id: string;
    product: Product;
  } | null;
  onClose: () => void;
}

export function Notification({ toast, onClose }: NotificationProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-sm pointer-events-none select-none">
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
                <span className="text-[11px] font-bold uppercase tracking-wider">Aggiunto al Carrello!</span>
              </div>
              <h5 className="font-serif text-sm font-semibold text-foreground truncate pr-2 mt-0.5 leading-tight">
                {toast.product.name}
              </h5>
            </div>

            {/* Clear Trigger */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted/10 active:scale-90 text-muted-foreground transition-all"
              aria-label="Nascondi"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
