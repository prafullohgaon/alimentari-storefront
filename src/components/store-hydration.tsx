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
    // Manually trigger rehydration for persisted stores
    useWishlistStore.persist.rehydrate();
    useAuthStore.persist.rehydrate();
    useLocaleStore.getState().initLocale();

    // Sync active customer key to wishlist store
    const profile = useAuthStore.getState().profile;
    const customerKey = profile?.id || profile?.email || "guest";
    useWishlistStore.getState().setCustomerKey(customerKey);

    // Trigger Shopify active cart validation
    useCartStore.getState().initCart();

    // Sync multi-tab storage updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "alimentari_guest_cart") {
        useCartStore.getState().initCart();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
