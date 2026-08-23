"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ShoppingBag,
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
import { useTranslation } from "@/hooks/use-translation";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

interface MobileNavbarProps {
  onCategorySelect: (catId: string) => void;
  locale?: "it" | "en";
  onLocaleChange?: (lang: "it" | "en") => void;
}

import { getUnifiedStorefrontNavigation } from "@/lib/cms";
import { SidebarNode } from "@/types/sidebar";

export function MobileNavbar({
  onCategorySelect,
  onLocaleChange,
}: MobileNavbarProps) {
  const router = useRouter();
  const { status } = useSession();
  const cartCount = useCartStore(selectCartCount);
  const { t, locale, setLocale } = useTranslation();
  const onCartClick = useUiStore((state) => state.openCart);
  
  const isDrawerOpen = useUiStore((state) => state.mobileMenuOpen);
  const openMobileMenu = useUiStore((state) => state.openMobileMenu);
  const closeMobileMenu = useUiStore((state) => state.closeMobileMenu);

  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [navDepartments, setNavDepartments] = React.useState<SidebarNode[]>([]);

  React.useEffect(() => {
    let active = true;
    async function loadMenu() {
      try {
        const tree = await getUnifiedStorefrontNavigation();
        if (active && tree && tree.length > 0) {
          setNavDepartments(tree);
        }
      } catch (err) {
        console.error("Failed to load storefront menu in mobile-navbar:", err);
      }
    }
    loadMenu();
    return () => {
      active = false;
    };
  }, [locale]);

  const departments = React.useMemo<SidebarNode[]>(() => {
    return navDepartments;
  }, [navDepartments]);

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
      setLocale(lang);
    }
  };

  return (
    <>
      {/* Top Mobile Sticky Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 py-3.5 px-4 flex items-center justify-between shadow-sm select-none">
        
        {/* Hamburger Trigger */}
        <button
          onClick={toggleDrawer}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-100 active:scale-90 text-slate-800 transition-all btn-touch-active"
          aria-label={t("mobileNavbar.openMenu")}
        >
          <Menu className="w-6 h-6 stroke-[2]" />
        </button>
 
        {/* Editorial Logo */}
        <div
          onClick={() => handleCategoryClick("tutti")}
          className="flex items-center gap-1.5 cursor-pointer"
          aria-label={t("mobileNavbar.logoAlt")}
        >
          <div className="w-7.5 h-7.5 rounded bg-green-600 flex items-center justify-center text-white font-bold text-sm shadow-sm px-2 py-0.5">
            A
          </div>
          <span className="font-sans text-xl font-bold tracking-tight text-slate-900">
            Alimentari
          </span>
        </div>
 
        {/* Quick Cart Trigger */}
        <button
          onClick={onCartClick}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-100 active:scale-95 text-slate-800 relative transition-all btn-touch-active"
          aria-label={t("mobileNavbar.viewCart")}
        >
          <ShoppingBag className="w-5.5 h-5.5 stroke-[2]" />
          {cartCount > 0 && (
            <span className="absolute top-1.5 right-1 bg-green-600 text-white text-[10px] font-bold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm animate-scaleIn">
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
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            />
 
            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 z-50 h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col justify-between"
            >
              {/* Header Container */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white select-none">
                <div className="flex items-center gap-1.5" aria-label={t("mobileNavbar.logoAlt")}>
                  <div className="w-6 h-6 rounded bg-green-600 flex items-center justify-center text-white font-bold text-xs">
                    A
                  </div>
                  <span className="font-sans text-lg font-bold text-slate-900">Alimentari</span>
                </div>
                
                {/* Language selection in mobile drawer header */}
                <div className="flex gap-1 border border-slate-200 rounded p-0.5 bg-slate-50 select-none text-[10px] font-extrabold mr-2">
                  <button
                    onClick={() => handleLanguageToggle("it")}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all",
                      locale === "it" ? "bg-green-600 text-white shadow-sm" : "text-slate-400"
                    )}
                    aria-label={t("nav.selectLangIt")}
                  >
                    IT
                  </button>
                  <button
                    onClick={() => handleLanguageToggle("en")}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all",
                      locale === "en" ? "bg-green-600 text-white shadow-sm" : "text-slate-400"
                    )}
                    aria-label={t("nav.selectLangEn")}
                  >
                    EN
                  </button>
                </div>
 
                <button
                  onClick={toggleDrawer}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 text-slate-700 transition-all"
                  aria-label={t("mobileNavbar.closeMenu")}
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>
 
              {/* Accordion Departments list */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-slate-50/50">
                {/* Profile quick links in drawer */}
                <div className="grid grid-cols-2 gap-2 select-none">
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      const isAuth = status === "authenticated" || Boolean(typeof window !== "undefined" && useAuthStore.getState().token);
                      router.push(isAuth ? "/account" : "/accedi");
                    }}
                    className="border border-slate-200 bg-white rounded-lg p-3 flex flex-col gap-1 items-center text-center hover:border-green-600 transition-all shadow-sm cursor-pointer"
                  >
                    <User className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-bold text-slate-800">{t("mobileNavbar.myProfile")}</span>
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      const isAuth = status === "authenticated" || Boolean(typeof window !== "undefined" && useAuthStore.getState().token);
                      router.push(isAuth ? "/account?tab=wishlist" : "/accedi");
                    }}
                    className="border border-slate-200 bg-white rounded-lg p-3 flex flex-col gap-1 items-center text-center hover:border-green-600 transition-all shadow-sm cursor-pointer"
                  >
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-bold text-slate-800">{t("mobileNavbar.myFavorites")}</span>
                  </button>
                </div>

                {/* Departments Header */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 select-none">{t("mobileNavbar.shoppingDepartments")}</h4>

                  <div className="flex flex-col border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                    {/* View all button */}
                    <button
                      onClick={() => handleCategoryClick("tutti")}
                      className="w-full text-left h-12 px-4 text-sm font-bold hover:bg-slate-50 border-b border-slate-100 text-green-600 flex items-center gap-2 select-none"
                    >
                      <Sparkles className="w-4 h-4 text-green-600 animate-pulse" />
                      {t("mobileNavbar.allProducts")}
                    </button>

                    {/* Department accordion items */}
                    {departments.map((dept) => {
                      const isExpanded = expandedDept === dept.id;
                      const hasChildren = dept.children && dept.children.length > 0;
                      return (
                        <div key={dept.id} className="border-b border-slate-100 last:border-b-0">
                          <button
                            onClick={() => {
                              if (hasChildren) {
                                toggleAccordion(dept.id);
                              } else {
                                handleCategoryClick(dept.handle);
                              }
                            }}
                            className="w-full h-12 px-4 flex items-center justify-between text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            <span>{dept.name}</span>
                            {hasChildren && (
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-slate-400 transition-transform duration-200",
                                  isExpanded && "transform rotate-180"
                                )}
                              />
                            )}
                          </button>

                          <AnimatePresence initial={false}>
                            {hasChildren && isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                              >
                                <div className="py-2 px-6 flex flex-col gap-2.5">
                                  {dept.children.map((subItem) => (
                                    <button
                                      key={subItem.id}
                                      onClick={() => handleCategoryClick(subItem.handle)}
                                      className="text-xs text-slate-500 hover:text-green-600 font-semibold py-1 text-left block"
                                    >
                                      {subItem.name}
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
              <div className="p-4 border-t border-slate-200 bg-white space-y-4 select-none">
                <div className="flex justify-around items-center text-xs font-semibold text-slate-400">
                  <a href="/account?tab=wishlist" onClick={() => closeMobileMenu()} className="hover:text-green-600 transition-colors flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> {t("mobileNavbar.favoriteShopping")}
                  </a>
                  <span className="text-slate-200">|</span>
                  <a href="https://wa.me/393513476740" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-green-600" /> {t("mobileNavbar.supportH24")}
                  </a>
                </div>

                <a
                  href="tel:+393513476740"
                  className="h-11 bg-green-600 text-white hover:bg-green-700 font-semibold text-sm rounded-md flex items-center justify-center gap-2 shadow-sm transition-all"
                  aria-label={t("mobileNavbar.callCustomerService")}
                >
                  <Phone className="w-4 h-4 text-white" />
                  {t("mobileNavbar.callCustomerService")}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
