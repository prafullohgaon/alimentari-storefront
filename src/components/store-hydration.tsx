"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { useLocaleStore } from "@/store/locale";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export function StoreHydration() {
  const pathname = usePathname();
  const cartOpen = useUiStore((state) => state.cartOpen);
  const searchOpen = useUiStore((state) => state.searchOpen);
  const mobileMenuOpen = useUiStore((state) => state.mobileMenuOpen);

  useEffect(() => {
    // Manually trigger rehydration for all persisted stores
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    useLocaleStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (cartOpen || searchOpen || mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, searchOpen, mobileMenuOpen]);

  return null;
}
