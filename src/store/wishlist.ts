import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  // Map of customer keys (email or customer ID, or "guest") -> product IDs array
  idsByCustomer: Record<string, string[]>;
  // Active customer key currently logged in ("guest" if unauthenticated)
  currentCustomerKey: string;
  // Derived active product IDs array for currentCustomerKey
  ids: string[];

  // Actions
  setCustomerKey: (key: string | null | undefined) => void;
  toggleWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      idsByCustomer: {},
      currentCustomerKey: "guest",
      ids: [],

      setCustomerKey: (key) => {
        const activeKey = key && key.trim() ? key.trim().toLowerCase() : "guest";
        set((state) => {
          const customerWishlist = state.idsByCustomer[activeKey] || [];
          return {
            currentCustomerKey: activeKey,
            ids: customerWishlist,
          };
        });
      },

      toggleWishlist: (productId) => {
        set((state) => {
          const activeKey = state.currentCustomerKey || "guest";
          const currentIds = state.idsByCustomer[activeKey] || [];
          const isWishlisted = currentIds.includes(productId);
          const newIds = isWishlisted
            ? currentIds.filter((id) => id !== productId)
            : [...currentIds, productId];

          return {
            ids: newIds,
            idsByCustomer: {
              ...state.idsByCustomer,
              [activeKey]: newIds,
            },
          };
        });
      },

      clearWishlist: () => {
        set((state) => {
          const activeKey = state.currentCustomerKey || "guest";
          return {
            ids: [],
            idsByCustomer: {
              ...state.idsByCustomer,
              [activeKey]: [],
            },
          };
        });
      },
    }),
    {
      name: "alimentari_wishlist_v2",
      skipHydration: true,
    }
  )
);

// Selector to check if a product is wishlisted for the active customer
export const selectIsWishlisted = (productId: string) => (state: WishlistState) =>
  state.ids.includes(productId);
