import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggleWishlist: (productId: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggleWishlist: (productId) =>
        set((state) => {
          const isWishlisted = state.ids.includes(productId);
          return {
            ids: isWishlisted
              ? state.ids.filter((id) => id !== productId)
              : [...state.ids, productId],
          };
        }),
    }),
    {
      name: "alimentari_wishlist",
      skipHydration: true,
    }
  )
);

// Selector to check if a product is wishlisted
export const selectIsWishlisted = (productId: string) => (state: WishlistState) =>
  state.ids.includes(productId);
