import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CustomerProfile } from "@/lib/shopify";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";

interface AuthState {
  token: string | null;
  profile: CustomerProfile | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  setProfile: (profile: CustomerProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      isLoading: false,
      login: (token) => set({ token, isLoading: false }),
      logout: () => {
        useCartStore.getState().switchToGuestMode();
        useWishlistStore.getState().setCustomerKey("guest");
        set({ token: null, profile: null, isLoading: false });
      },
      setProfile: (profile) => {
        const customerKey = profile?.id || profile?.email || "guest";
        useWishlistStore.getState().setCustomerKey(customerKey);
        set({ profile, isLoading: false });
      },
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "alimentari_customer_token",
      skipHydration: true,
      partialize: (state) => ({ token: state.token }), // only persist token
    }
  )
);
