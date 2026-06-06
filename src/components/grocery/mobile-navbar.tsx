"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Phone,
  Heart,
  HelpCircle,
  Sparkles,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useCartStore, selectCartCount } from "@/store/cart";
import { useUiStore } from "@/store/ui";

import { useLocaleStore } from "@/store/locale";

interface MobileNavbarProps {
  onCategorySelect: (catId: string) => void;
  locale?: "it" | "en";
  onLocaleChange?: (lang: "it" | "en") => void;
}

const ACCORDION_DEPARTMENTS = [
  {
    id: "dispensa",
    name: "La Dispensa",
    items: ["Olio Extra Vergine", "Aceto Balsamico di Modena", "Pasta di Gragnano", "Sughi & Conserve"],
  },
  {
    id: "latticini",
    name: "Latticini & Salumi",
    items: ["Parmigiano Reggiano DOP", "Mozzarella di Bufala", "Prosciutto di Parma DOP", "Pecorino Romano"],
  },
  {
    id: "panetteria",
    name: "Panetteria Fresca",
    items: ["Pane Tradizionale", "Focaccia Barese", "Grissini", "Pasticceria Artigianale"],
  },
  {
    id: "enoteca",
    name: "Enoteca Selezionata",
    items: ["Vini Rossi DOCG", "Bollicine Italiane", "Vini Bianchi", "Liquori Toscani"],
  },
];

export function MobileNavbar({
  onCategorySelect,
  locale = "it",
  onLocaleChange
}: MobileNavbarProps) {
  const cartCount = useCartStore(selectCartCount);
  const onCartClick = useUiStore((state) => state.openCart);
  
  const isDrawerOpen = useUiStore((state) => state.mobileMenuOpen);
  const openMobileMenu = useUiStore((state) => state.openMobileMenu);
  const closeMobileMenu = useUiStore((state) => state.closeMobileMenu);

  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  const handleCategoryClick = (id: string) => {
    onCategorySelect(id);
    closeMobileMenu();
  };

  const toggleAccordion = (id: string) => {
    setExpandedDept(expandedDept === id ? null : id);
  };

  const handleLanguageToggle = (lang: "it" | "en") => {
    if (onLocaleChange) {
      onLocaleChange(lang);
    } else {
      useLocaleStore.getState().setLocale(lang);
    }
  };


  return (
    <>
      {/* Top Mobile Sticky Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFECE6]/60 py-3.5 px-4 flex items-center justify-between shadow-sm select-none">
        
        {/* Hamburger Trigger */}
        <button
          onClick={toggleDrawer}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted/10 active:scale-90 text-foreground transition-all btn-touch-active"
          aria-label="Apri menu"
        >
          <Menu className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Editorial Logo */}
        <div
          onClick={() => handleCategoryClick("tutti")}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <div className="w-7.5 h-7.5 rounded bg-[#1C3B2B] flex items-center justify-center text-white font-bold text-sm shadow-sm px-2 py-0.5">
            A
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-[#181816]">
            Alimentari
          </span>
        </div>

        {/* Quick Cart Trigger */}
        <button
          onClick={onCartClick}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted/10 active:scale-95 text-[#181816] relative transition-all btn-touch-active"
          aria-label="Vedi Carrello"
        >
          <ShoppingBag className="w-5.5 h-5.5 stroke-[2]" />
          {cartCount > 0 && (
            <span className="absolute top-1.5 right-1 bg-[#C9623B] text-white text-[10px] font-bold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm animate-scaleIn">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-in Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleDrawer}
              className="fixed inset-0 z-50 bg-espresso/50 backdrop-blur-sm cursor-pointer"
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 z-50 h-full w-[85vw] max-w-sm bg-[#FAF7F2] shadow-2xl flex flex-col justify-between"
            >
              {/* Header Container */}
              <div className="p-4 border-b border-[#EFECE6] flex items-center justify-between bg-white select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-[#1C3B2B] flex items-center justify-center text-white font-bold text-xs">
                    A
                  </div>
                  <span className="font-serif text-lg font-bold">Alimentari</span>
                </div>
                
                {/* Language selection in mobile drawer header */}
                <div className="flex gap-1 border border-[#EFECE6] rounded p-0.5 bg-[#FAF7F2] select-none text-[10px] font-extrabold mr-2">
                  <button
                    onClick={() => handleLanguageToggle("it")}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all",
                      locale === "it" ? "bg-[#1C3B2B] text-white shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    IT
                  </button>
                  <button
                    onClick={() => handleLanguageToggle("en")}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all",
                      locale === "en" ? "bg-[#1C3B2B] text-white shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    EN
                  </button>
                </div>

                <button
                  onClick={toggleDrawer}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/10 active:scale-90 text-[#181816] transition-all"
                  aria-label="Chiudi menu"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              {/* Accordion Departments list */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                
                {/* Delivery ZIP CAP details */}
                <div className="flex gap-2.5 border border-[#EFECE6]/80 rounded-xl p-3 bg-white select-none shadow-sm">
                  <MapPin className="w-5 h-5 text-[#1C3B2B] flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">CAP di consegna</span>
                    <span className="text-xs font-bold text-foreground">Milano (CAP 20121)</span>
                  </div>
                </div>

                {/* Profile quick links in drawer */}
                <div className="grid grid-cols-2 gap-2 select-none">
                  <a
                    href="/account"
                    onClick={() => closeMobileMenu()}
                    className="border border-[#EFECE6] bg-white rounded-xl p-3 flex flex-col gap-1 items-center text-center hover:border-primary transition-all shadow-sm"
                  >
                    <User className="w-5 h-5 text-[#1C3B2B]" />
                    <span className="text-xs font-bold text-foreground">Il Mio Profilo</span>
                  </a>
                  <a
                    href="/account"
                    onClick={() => closeMobileMenu()}
                    className="border border-[#EFECE6] bg-white rounded-xl p-3 flex flex-col gap-1 items-center text-center hover:border-primary transition-all shadow-sm"
                  >
                    <Heart className="w-5 h-5 text-[#C9623B]" />
                    <span className="text-xs font-bold text-foreground">I Miei Preferiti</span>
                  </a>
                </div>

                {/* Departments Header */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 select-none">
                    Dipartimenti Spesa
                  </h4>

                  <div className="flex flex-col border border-[#EFECE6]/60 rounded-xl bg-white overflow-hidden shadow-sm">
                    {/* View all button */}
                    <button
                      onClick={() => handleCategoryClick("tutti")}
                      className="w-full text-left h-12 px-4 text-sm font-bold hover:bg-muted/5 border-b border-[#EFECE6]/30 text-[#1C3B2B] flex items-center gap-2 select-none"
                    >
                      <Sparkles className="w-4 h-4 text-[#1C3B2B] animate-pulse" />
                      Tutti i Prodotti Spesa
                    </button>

                    {/* Department accordion items */}
                    {ACCORDION_DEPARTMENTS.map((dept) => {
                      const isExpanded = expandedDept === dept.id;
                      return (
                        <div key={dept.id} className="border-b border-[#EFECE6]/30 last:border-b-0">
                          <button
                            onClick={() => toggleAccordion(dept.id)}
                            className="w-full h-12 px-4 flex items-center justify-between text-sm font-semibold text-foreground hover:bg-muted/5"
                          >
                            <span>{dept.name}</span>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                isExpanded && "transform rotate-180"
                              )}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden bg-muted/5 border-t border-[#EFECE6]/30"
                              >
                                <div className="py-2 px-6 flex flex-col gap-2.5">
                                  {dept.items.map((subItem) => (
                                    <button
                                      key={subItem}
                                      onClick={() => handleCategoryClick(dept.id)}
                                      className="text-xs text-muted-foreground hover:text-[#1c3b2b] font-semibold py-1 text-left block"
                                    >
                                      {subItem}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Utility Panel */}
              <div className="p-4 border-t border-[#EFECE6] bg-white space-y-4 select-none">
                <div className="flex justify-around items-center text-xs font-semibold text-muted-foreground">
                  <a href="/account" onClick={() => closeMobileMenu()} className="hover:text-[#1c3b2b] transition-colors flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#C9623B]" /> Spesa Preferita
                  </a>
                  <span className="text-[#EFECE6]">|</span>
                  <a href="https://wa.me/3902123456" className="hover:text-[#1c3b2b] transition-colors flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-[#1C3B2B]" /> Supporto H24
                  </a>
                </div>

                <a
                  href="tel:+3902123456"
                  className="h-11 bg-[#1C3B2B] text-white hover:bg-[#1C3B2B]/95 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Phone className="w-4 h-4 text-white" />
                  Chiama Servizio Clienti
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
