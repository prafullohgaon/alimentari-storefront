import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CustomerProfile } from "@/lib/shopify";

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
      logout: () => set({ token: null, profile: null, isLoading: false }),
      setProfile: (profile) => set({ profile, isLoading: false }),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "alimentari_customer_token",
      skipHydration: true,
      partialize: (state) => ({ token: state.token }), // only persist token
    }
  )
);
