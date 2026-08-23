"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { checkoutCart } from "@/lib/shopify";
import { cartStorage } from "@/lib/cart-storage";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/store/locale";

export default function CheckoutRedirectPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const initLocale = useLocaleStore((state) => state.initLocale);

  const cartId = useCartStore((state) => state.cartId);
  const checkoutUrlState = useCartStore((state) => state.checkoutUrl);
  const items = useCartStore((state) => state.items);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initLocale();
  }, [initLocale]);

  useEffect(() => {
    document.title = t("checkoutPage.documentTitle");
  }, [locale, t]);

  useEffect(() => {
    async function executeCheckoutRedirect() {
      const { useAuthStore } = await import("@/store/auth");

      let token = useAuthStore.getState().token;
      if (!token && typeof window !== "undefined") {
        try {
          const rawAuth = localStorage.getItem("alimentari_customer_token");
          if (rawAuth) {
            const parsed = JSON.parse(rawAuth);
            token = parsed?.state?.token || null;
            if (token) {
              useAuthStore.getState().login(token);
            }
          }
        } catch (e) {
          console.error("Auth rehydration error:", e);
        }
      }

      if (!token) {
        cartStorage.setPendingCheckoutIntent(true);
        router.push("/accedi?redirect=checkout");
        return;
      }

      let currentItems = items;
      let currentCartId = cartId;

      if ((currentItems.length === 0 || !currentCartId) && typeof window !== "undefined") {
        try {
          const rawCart = localStorage.getItem("alimentari_cart");
          if (rawCart) {
            const parsed = JSON.parse(rawCart);
            currentItems = parsed?.state?.items || [];
            currentCartId = parsed?.state?.cartId || null;
          }
        } catch (e) {
          console.error("Cart rehydration error:", e);
        }
      }

      if (currentItems.length === 0 && !currentCartId) {
        router.push("/carrello");
        return;
      }

      try {
        if (checkoutUrlState) {
          cartStorage.clearPendingCheckoutIntent();
          window.location.href = checkoutUrlState;
          return;
        }

        const url = await checkoutCart(currentCartId, currentItems, locale);
        if (url && url.startsWith("https://")) {
          cartStorage.clearPendingCheckoutIntent();
          window.location.href = url;
        } else {
          setError(t("checkoutPage.errorUnableToGenerateUrl"));
        }
      } catch (err) {
        console.error("Checkout redirection error:", err);
        setError(t("checkoutPage.errorConnectionFailed"));
      }
    }

    executeCheckoutRedirect();
  }, [cartId, checkoutUrlState, items, router, t, locale]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-[#1C3B2B]">
      <div className="max-w-md w-full bg-white border border-[#EFECE6] rounded-2xl p-8 text-center shadow-lg space-y-6">
        <div className="w-16 h-16 bg-[#1C3B2B]/10 text-[#1C3B2B] rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8 stroke-[1.75]" />
        </div>

        {error ? (
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-red-700">
              {t("checkoutPage.errorTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push("/carrello")}
              className="w-full h-11 bg-[#1C3B2B] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#1C3B2B]/90 transition-all cursor-pointer"
            >
              {t("checkoutPage.backToCart")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 text-[#1C3B2B] animate-spin mx-auto" />
            <h3 className="font-serif text-2xl font-bold tracking-tight">
              {t("checkoutPage.redirectingTitle")}
            </h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              {t("checkoutPage.redirectingDescription")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
