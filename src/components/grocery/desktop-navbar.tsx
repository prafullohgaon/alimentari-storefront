// src/components/grocery/desktop-navbar.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, ShoppingBag, User, HelpCircle, Phone, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MegaMenu } from "@/components/grocery/mega-menu";
import { useCartStore, selectCartCount } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { useTranslation } from "@/hooks/use-translation";
import { NavCategory, NavColumn, NavLinkItem } from "@/lib/navigation";
import { getUnifiedStorefrontNavigation } from "@/lib/cms";
import Link from "next/link";
import { SidebarNode } from "@/types/sidebar";
import { HomepageContactSettings } from "@/lib/cms";

import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth";

interface DesktopNavbarProps {
  onCategorySelect: (catId: string) => void;
  locale?: "it" | "en";
  onLocaleChange?: (lang: "it" | "en") => void;
  contactSettings?: HomepageContactSettings | null;
}

function DesktopNavbarComponent({
  onCategorySelect,
  onLocaleChange,
  contactSettings,
}: DesktopNavbarProps) {
  const router = useRouter();
  const { status } = useSession();
  const { locale, setLocale, t } = useTranslation();

  const handleProfileClick = () => {
    const isAuth = status === "authenticated" || Boolean(typeof window !== "undefined" && useAuthStore.getState().token);
    router.push(isAuth ? "/account" : "/accedi");
  };
  const cartCount = useCartStore(selectCartCount);
  const onCartClick = useUiStore((state) => state.openCart);
  const onSearchClick = useUiStore((state) => state.openSearch);

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [pulseCount, setPulseCount] = useState(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [navDepartments, setNavDepartments] = useState<SidebarNode[]>([]);

  useEffect(() => {
    let active = true;
    async function loadMenu() {
      try {
        const tree = await getUnifiedStorefrontNavigation();
        if (active && tree && tree.length > 0) {
          setNavDepartments(tree);
        }
      } catch (err) {
        console.error("Failed to load storefront navigation in desktop-navbar:", err);
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

  // Determine active category data dynamically from Shopify Navigation tree (departments)
  const activeCategory = React.useMemo<NavCategory | null>(() => {
    if (!activeCategoryId) return null;
    const dept = departments.find((d) => d.handle === activeCategoryId);
    if (!dept || !dept.children || dept.children.length === 0) return null;

    const columns: NavColumn[] = dept.children.map((child) => {
      const subLinks = (child.children || []).map((subChild) => ({
        name: subChild.name,
        handle: subChild.handle,
      }));

      const links: NavLinkItem[] =
        subLinks.length > 0
          ? subLinks
          : [{ name: child.name, handle: child.handle }];

      return {
        heading: child.name,
        links,
      };
    });

    return {
      id: dept.id,
      name: dept.name,
      handle: dept.handle,
      promoImageUrl: "/vico_newsletter_box.png",
      columns,
    };
  }, [activeCategoryId, departments]);

  return (
    <header className="hidden md:block sticky top-0 relative z-40 select-none w-full bg-white">
      <div
        className={cn(
          "w-full transition-transform duration-300 ease-in-out relative",
          isScrolled ? "-translate-y-10" : "translate-y-0"
        )}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {/* Upper Utility Header (Always present in DOM to prevent layout shift, animates using opacity) */}
        <div
          className={cn(
            "max-w-7xl mx-auto px-6 h-10 flex items-center justify-between text-xs transition-opacity duration-300",
            isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          {/* CMS-Driven Contact / Help Header Strip */}
          {contactSettings && contactSettings.title ? (
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-800">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-extrabold">{contactSettings.title}</span>
                {contactSettings.subtitle && (
                  <span className="text-slate-500 font-normal hidden lg:inline">
                    — {contactSettings.subtitle}
                  </span>
                )}
              </span>
              <Link
                href={contactSettings.buttonUrl || "/contact"}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-colors shadow-xs"
              >
                <span>{contactSettings.buttonText}</span>
                <span>→</span>
              </Link>
              {contactSettings.phone && (
                <a
                  href={`tel:${contactSettings.phone}`}
                  className="hidden xl:flex items-center gap-1 text-slate-500 hover:text-emerald-700 text-[11px] font-medium transition-colors ml-2"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {contactSettings.phone}
                </a>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-5 text-slate-500 font-medium">
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => handleLanguageChange("it")}
                className={cn(
                  "px-1.5 py-0.5 rounded transition-colors",
                  locale === "it" ? "bg-emerald-100 text-emerald-800" : "hover:text-slate-800"
                )}
              >
                IT
              </button>
              <span>/</span>
              <button
                onClick={() => handleLanguageChange("en")}
                className={cn(
                  "px-1.5 py-0.5 rounded transition-colors",
                  locale === "en" ? "bg-emerald-100 text-emerald-800" : "hover:text-slate-800"
                )}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="w-full bg-white border-y border-slate-100 py-3">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-8">
            {/* Brand Logo */}
            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md group-hover:bg-emerald-800 transition-colors">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-black tracking-tight text-slate-900 leading-none">
                  Alimentari
                </span>
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase leading-tight">
                  Gourmet Market
                </span>
              </div>
            </div>

            {/* Central Search Bar */}
            <div className="flex-1 max-w-2xl relative">
              <div
                onClick={onSearchClick}
                className="w-full bg-slate-100/80 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-400 flex items-center cursor-pointer transition-all shadow-xs"
              >
                <Search className="w-4 h-4 text-slate-400 absolute left-4" />
                <span>{t("desktopNavbar.searchPlaceholder")}</span>
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-full text-slate-700 transition-colors"
                title={t("desktopNavbar.account")}
              >
                <User className="w-5 h-5" />
              </button>

              <button
                onClick={() => router.push("/account?tab=wishlist")}
                className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-full text-slate-700 transition-colors relative"
                title={t("desktopNavbar.wishlist")}
              >
                <Heart className="w-5 h-5" />
              </button>

              {/* Cart Button */}
              <button
                onClick={onCartClick}
                className="flex items-center gap-2.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm hover:shadow"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t("desktopNavbar.cart")}</span>

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
        <div className="w-full bg-[#1a3c2b] py-0 text-sm font-semibold text-white select-none h-10 flex items-center">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center w-full">
            <nav className="flex items-center gap-1">
              <button
                onMouseEnter={() => setActiveCategoryId(null)}
                onClick={() => router.push("/reparto")}
                className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all"
              >
                {t("nav.shopAll")}
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onMouseEnter={() => { cancelClose(); setActiveCategoryId(dept.handle); }}
                  onClick={() => { router.push(`/reparto?dept=${dept.handle}`); onCategorySelect(dept.handle); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded transition-all",
                    activeCategoryId === dept.handle && "bg-white/10 text-white"
                  )}
                >
                  {dept.name}
                </button>
              ))}
            </nav>
            <div className="text-[12px] text-white/70 font-medium flex items-center gap-1.5 pr-1">
              <Truck className="w-3.5 h-3.5 text-white/60" /> {t("desktopNavbar.freeShipping")}
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
      </div>
    </header>
  );
}

export const DesktopNavbar = React.memo(DesktopNavbarComponent);
