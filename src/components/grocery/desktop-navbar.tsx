// src/components/grocery/desktop-navbar.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ShoppingBag, User, MapPin, Truck, HelpCircle, Phone, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MegaMenu } from "@/components/grocery/mega-menu";
import { useCartStore, selectCartCount } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useTranslation } from "@/hooks/use-translation";
import { NAV_MENU } from "@/lib/navigation";

interface DesktopNavbarProps {
  onCategorySelect: (catId: string) => void;
  locale?: "it" | "en";
  onLocaleChange?: (lang: "it" | "en") => void;
}

export function DesktopNavbar({
  onCategorySelect,
  onLocaleChange,
}: DesktopNavbarProps) {
  const router = useRouter();
  const { locale, setLocale } = useTranslation();
  const cartCount = useCartStore(selectCartCount);
  const onCartClick = useUiStore((state) => state.openCart);
  const onSearchClick = useUiStore((state) => state.openSearch);

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [pulseCount, setPulseCount] = useState(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Monitor Scroll for Sticky solid transformations
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pulse cart badge on quantity updates
  useEffect(() => {
    if (cartCount > 0) {
      setPulseCount((prev) => prev + 1);
    }
  }, [cartCount]);

  // Debounced open/close to bridge mouse movement gap between trigger and panel
  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setActiveCategoryId(null);
    }, 170);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleLanguageChange = (lang: "it" | "en") => {
    if (onLocaleChange) {
      onLocaleChange(lang);
    } else {
      setLocale(lang);
    }
  };

  // Determine active category data
  const activeCategory = activeCategoryId ? NAV_MENU[activeCategoryId] : null;

  return (
    <header className="hidden md:block sticky top-0 relative z-40 select-none w-full">
      {/* Upper Utility Header (Hides on scroll) */}
      <AnimatePresence>
        {!isScrolled && (
          <motion.div
            initial={{ height: 40, opacity: 1 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold flex items-center overflow-hidden"
          >
            <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-600" /> Milano (CAP 20121)
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <Truck className="w-3.5 h-3.5" /> Spedizione gratuita da €80
                </span>
              </div>
              <div className="flex items-center gap-6">
                <a href="/reparto" className="hover:text-green-600 transition-colors">Chi Siamo</a>
                <a href="/account" className="hover:text-green-600 transition-colors flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Assistenza
                </a>
                <a href="tel:+3902123456" className="hover:text-green-600 transition-colors flex items-center gap-1 font-bold text-slate-800">
                  <Phone className="w-3.5 h-3.5 text-green-600" /> +39 02 123 456
                </a>
                {/* Language Switcher */}
                <div className="flex gap-1 border border-slate-200 rounded p-0.5 bg-white select-none">
                  <button
                    onClick={() => handleLanguageChange("it")}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all",
                      locale === "it" ? "bg-green-600 text-white" : "text-slate-400"
                    )}
                  >
                    IT
                  </button>
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all",
                      locale === "en" ? "bg-green-600 text-white" : "text-slate-400"
                    )}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Desktop Navbar Row */}
      <div
        className={cn(
          "w-full transition-all duration-300 bg-white border-b",
          isScrolled ? "border-slate-200 shadow-sm py-2" : "border-slate-100 py-3.5"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
          {/* Logo Area */}
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              A
            </div>
            <span className="font-sans text-xl font-bold tracking-tight text-slate-900">
              Alimentari
            </span>
          </div>

          {/* Quick Search trigger area - centered and expanded like Vico */}
          <div
            onClick={onSearchClick}
            className="flex-1 max-w-xl bg-slate-50 border border-slate-200 rounded-md h-11 px-4 flex items-center justify-between cursor-pointer hover:border-green-600/60 transition-all select-none shadow-sm"
          >
            <span className="text-sm text-slate-400 font-medium">Cerca specialità...</span>
            <Search className="w-4.5 h-4.5 text-green-600 stroke-[2.5]" />
          </div>

          {/* Header Action Elements */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push("/account")}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-100 active:scale-95 text-slate-700 transition-all"
              aria-label="Profilo"
            >
              <User className="w-5.5 h-5.5 stroke-[2]" />
            </button>
            <button
              onClick={() => router.push("/account?tab=wishlist")}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-100 active:scale-95 text-slate-700 transition-all"
              aria-label="Preferiti"
            >
              <Heart className="w-5.5 h-5.5 stroke-[2]" />
            </button>
            {/* Cart trigger button with spring-safe pulse badge */}
            <button
              onClick={onCartClick}
              className="h-11 px-4 bg-green-600 text-white hover:bg-green-700 font-semibold text-sm rounded-md flex items-center gap-2 select-none shadow-sm transition-all active:scale-[0.98] btn-touch-active"
              aria-label="Carrello"
            >
              <ShoppingBag className="w-4.5 h-4.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Spesa</span>

              <AnimatePresence mode="popLayout">
                <motion.span
                  key={pulseCount}
                  initial={{ scale: pulseCount > 0 ? 1.35 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="bg-white text-green-600 text-xs font-bold px-2 py-0.5 rounded-full leading-none inline-block"
                >
                  {cartCount}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Row — dark green Vico style */}
      <div className="w-full bg-[#1a3c2b] py-0 text-sm font-semibold text-white select-none">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <nav className="flex items-center gap-1" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            {/* Shop All placeholder kept for future */}
            <button
              onMouseEnter={() => setActiveCategoryId(null)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                false && "bg-white/10 text-white"
              )}
            >
              🛒 Shop All
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", false && "transform rotate-180")} />
            </button>
            {/* Top‑level categories */}
            <button
              onMouseEnter={() => { cancelClose(); setActiveCategoryId("dispensa"); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                activeCategoryId === "dispensa" && "bg-white/10 text-white"
              )}
            >
              🍝 Dispensa
            </button>
            <button
              onMouseEnter={() => { cancelClose(); setActiveCategoryId("latticini-salumi"); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                activeCategoryId === "latticini-salumi" && "bg-white/10 text-white"
              )}
            >
              🧀 Formaggi & Salumi
            </button>
            <button
              onMouseEnter={() => { cancelClose(); setActiveCategoryId("panetteria"); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                activeCategoryId === "panetteria" && "bg-white/10 text-white"
              )}
            >
              🍞 Panetteria
            </button>
            <button
              onMouseEnter={() => { cancelClose(); setActiveCategoryId("enoteca"); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                activeCategoryId === "enoteca" && "bg-white/10 text-white"
              )}
            >
              🍷 Enoteca
            </button>
            <button
              onMouseEnter={() => { cancelClose(); setActiveCategoryId("frutta-verdura"); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                activeCategoryId === "frutta-verdura" && "bg-white/10 text-white"
              )}
            >
              🥦 Frutta & Verdura
            </button>
            <button
              onMouseEnter={() => { cancelClose(); setActiveCategoryId("casa-persona"); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                activeCategoryId === "casa-persona" && "bg-white/10 text-white"
              )}
            >
              🏠 Casa & Persona
            </button>
          </nav>
          <div className="text-[12px] text-white/70 font-medium flex items-center gap-1.5 pr-1">
            <Truck className="w-3.5 h-3.5 text-white/60" /> Spedizione gratis da 80€
          </div>
        </div>
      </div>

      {/* Mega Menu Panel – rendered only when a category with content is active */}
      <AnimatePresence>
        {activeCategory && activeCategory.columns.length > 0 && (
          <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute top-full left-0 w-full z-50 shadow-lg"
        >
            <MegaMenu
              category={activeCategory}
              onCategorySelect={(catId) => {
                onCategorySelect(catId);
                setActiveCategoryId(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
