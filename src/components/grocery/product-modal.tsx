"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Leaf, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/components/grocery/product-card";
import { QuantitySelector } from "@/components/grocery/quantity-selector";
import { Badge } from "@/components/ui/badge";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  quantityInCart: number;
  onQuantityChange: (productId: string, qty: number) => void;
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  quantityInCart,
  onQuantityChange,
}: ProductModalProps) {
  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const modalRef = useFocusTrap({ active: isOpen, onEscape: onClose });

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-espresso/50 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="relative bg-card w-full max-w-3xl rounded-2xl overflow-hidden border border-border shadow-elevation flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] z-10"
          >
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-border/40 hover:bg-white text-foreground transition-all"
              aria-label="Chiudi"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Left Column: Image */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-muted/20 relative select-none">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                  e.currentTarget.srcset = "";
                }}
                priority
              />
              {product.isOrganic && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="success" className="gap-1 bg-white/95 backdrop-blur-sm shadow-sm py-1 px-2.5">
                    <Leaf className="w-3.5 h-3.5 text-success fill-success/10" />
                    Biologico
                  </Badge>
                </div>
              )}
            </div>

            {/* Right Column: Description Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto justify-between">
              {/* Desktop Close Trigger */}
              <button
                onClick={onClose}
                className="hidden md:flex absolute right-6 top-6 w-9 h-9 items-center justify-center rounded-full hover:bg-muted/10 text-muted-foreground transition-all active:scale-90"
                aria-label="Chiudi dettagli"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>

              <div className="space-y-4 pr-1 select-text">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                    {product.category}
                  </span>
                  <h3 id="modal-title" className="font-serif text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-tight">
                    {product.name}
                  </h3>
                  <span className="text-sm font-semibold text-muted-foreground block mt-1.5">
                    Confezione: {product.unit}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-2xl text-foreground tracking-tight">
                    €{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-base text-muted-foreground line-through">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Editorial Brand Narrative */}
                <div className="pt-2 border-t border-border/80">
                  <h5 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-1.5">
                    Descrizione Prodotto
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Questa specialità gourmet incarna la vera tradizione gastronomica italiana. Selezionato da piccoli consorzi artigianali locali, garantisce un gusto autentico ed eccellenti valori nutrizionali, 100% biologico e privo di conservanti artificiali.
                  </p>
                </div>

                {/* Quality Icons/Garantees */}
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="flex items-center gap-2 border border-border/60 rounded-lg p-2.5 bg-muted/5">
                    <Leaf className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-xs font-semibold text-foreground">Artigianale DOP</span>
                  </div>
                  <div className="flex items-center gap-2 border border-border/60 rounded-lg p-2.5 bg-muted/5">
                    <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs font-semibold text-foreground">Senza Additivi</span>
                  </div>
                </div>

                {/* Tiny Freshness Assurances (Conversion trust) */}
                <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-semibold pt-2 border-t border-border/40 select-none">
                  <span className="flex items-center gap-1">✓ Scadenza minima 14 giorni garantita</span>
                  <span className="flex items-center gap-1">✓ Consegna termica refrigerata</span>
                </div>
              </div>

              {/* Dynamic Footer Add Area */}
              <div className="pt-6 border-t border-border mt-6 flex gap-4 items-center select-none">
                {quantityInCart === 0 ? (
                  <button
                    onClick={() => onQuantityChange(product.id, 1)}
                    className={cn(
                      "flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 select-none shadow-sm transition-all duration-200",
                      "active:scale-[0.98] active:bg-primary/90 btn-touch-active"
                    )}
                  >
                    <ShoppingBag className="w-4.5 h-4.5 stroke-[2.5]" />
                    Aggiungi alla Spesa
                  </button>
                ) : (
                  <div className="flex-grow flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-muted-foreground">Quantità nel carrello:</span>
                    <QuantitySelector
                      value={quantityInCart}
                      onChange={(qty) => onQuantityChange(product.id, qty)}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
