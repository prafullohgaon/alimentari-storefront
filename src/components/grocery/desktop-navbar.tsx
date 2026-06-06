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
  const [isMegaOpen, setIsMegaOpen] = useState(false);
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
  const openMenu = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMegaOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setIsMegaOpen(false);
    }, 120);
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

  return (
    <header
      className="hidden md:block sticky top-0 z-40 select-none w-full"
      onMouseLeave={scheduleClose}
    >
      {/* Upper Utility Header (Hides on scroll) */}
      <AnimatePresence>
        {!isScrolled && (
          <motion.div
            initial={{ height: 40, opacity: 1 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#FAF7F2] border-b border-[#EFECE6]/40 text-xs text-muted-foreground font-semibold flex items-center overflow-hidden"
          >
            <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1C3B2B]" /> Milano (CAP 20121)
                </span>
                <span className="flex items-center gap-1 text-[#1C3B2B]">
                  <Truck className="w-3.5 h-3.5" /> Spedizione gratuita da €50
                </span>
              </div>
              <div className="flex items-center gap-6">
                <a href="/reparto" className="hover:text-[#1C3B2B] transition-colors">Chi Siamo</a>
                <a href="/account" className="hover:text-[#1C3B2B] transition-colors flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Assistenza
                </a>
                <a href="tel:+3902123456" className="hover:text-[#1C3B2B] transition-colors flex items-center gap-1 font-bold text-[#181816]">
                  <Phone className="w-3 h-3 text-[#1C3B2B]" /> +39 02 123 456
                </a>

                {/* Language Switcher */}
                <div className="flex gap-1 border border-[#EFECE6] rounded p-0.5 bg-white select-none">
                  <button
                    onClick={() => handleLanguageChange("it")}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all",
                      locale === "it" ? "bg-[#1C3B2B] text-white" : "text-muted-foreground"
                    )}
                  >
                    IT
                  </button>
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all",
                      locale === "en" ? "bg-[#1C3B2B] text-white" : "text-muted-foreground"
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
          "w-full transition-all duration-300",
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#EFECE6]/70 shadow-md py-2"
            : "bg-[#FAF7F2] border-b border-[#EFECE6]/30 py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
          {/* Logo Area */}
          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1C3B2B] flex items-center justify-center text-white font-bold text-base shadow-sm">
              A
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#181816]">
              Alimentari
            </span>
          </div>

          {/* Navigation Links with Mega Menu Hook */}
          <nav className="flex items-center gap-8 text-sm font-bold text-[#181816]">
            <button
              onMouseEnter={openMenu}
              className={cn(
                "hover:text-[#1C3B2B] transition-colors flex items-center gap-1 py-1.5",
                isMegaOpen && "text-[#1C3B2B]"
              )}
            >
              Dipartimenti
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isMegaOpen && "transform rotate-180")} />
            </button>
            <button onClick={() => onCategorySelect("dispensa")} className="hover:text-[#1C3B2B] transition-colors py-1.5">Dispensa</button>
            <button onClick={() => onCategorySelect("latticini & salumi")} className="hover:text-[#1C3B2B] transition-colors py-1.5">Formaggi & Salumi</button>
            <button onClick={() => onCategorySelect("enoteca")} className="hover:text-[#1C3B2B] transition-colors py-1.5">Enoteca</button>
          </nav>

          {/* Quick Search trigger area */}
          <div
            onClick={onSearchClick}
            className="flex-1 max-w-xs bg-muted/10 border border-[#EFECE6]/80 rounded-xl h-11 px-4 flex items-center gap-3 cursor-pointer hover:border-[#1C3B2B]/60 transition-all select-none shadow-sm"
          >
            <Search className="w-4.5 h-4.5 text-muted-foreground stroke-[2.5]" />
            <span className="text-sm text-muted-foreground font-medium">Cerca specialità...</span>
          </div>

          {/* Header Action Elements */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/account")}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted/10 active:scale-95 text-[#181816] transition-all"
              aria-label="Profilo"
            >
              <User className="w-5 h-5 stroke-[2]" />
            </button>

            <button
              onClick={() => router.push("/account?tab=wishlist")}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted/10 active:scale-95 text-[#181816] transition-all"
              aria-label="Preferiti"
            >
              <Heart className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Cart trigger button with spring-safe pulse badge */}
            <button
              onClick={onCartClick}
              className="h-11 px-4 bg-[#1C3B2B] text-white hover:bg-[#1C3B2B]/95 font-semibold text-sm rounded-lg flex items-center gap-2 select-none shadow-sm transition-all active:scale-[0.98] btn-touch-active"
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
                  className="bg-white text-[#1C3B2B] text-xs font-bold px-2 py-0.5 rounded-full leading-none inline-block"
                >
                  {cartCount}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mega Menu Panel — rendered in the sticky header flow, bridged by debounced hover */}
      <AnimatePresence>
        {isMegaOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="w-full z-50 shadow-2xl"
          >
            <MegaMenu
              onCategorySelect={(catId) => {
                onCategorySelect(catId);
                setIsMegaOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
