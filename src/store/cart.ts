import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/lib/data";
import { CartItem } from "@/components/grocery/cart-drawer";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        trackAddToCart(product, quantity);
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },
      removeItem: (productId) =>
        set((state) => {
          const item = state.items.find((i) => i.product.id === productId);
          if (item) {
            trackRemoveFromCart(item.product, item.quantity);
          }
          return {
            items: state.items.filter((item) => item.product.id !== productId),
          };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const item = state.items.find((i) => i.product.id === productId);
          if (item) {
            const diff = quantity - item.quantity;
            if (diff > 0) {
              trackAddToCart(item.product, diff);
            } else if (diff < 0) {
              trackRemoveFromCart(item.product, Math.abs(diff));
            }
          }
          return {
            items: state.items.map((item) =>
              item.product.id === productId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "alimentari_cart",
      skipHydration: true,
    }
  )
);

// Derived state helpers to avoid duplicate selector math across components
export const selectCartItems = (state: CartState) => state.items;
export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
