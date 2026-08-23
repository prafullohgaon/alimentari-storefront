import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/lib/data";
import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics";
import {
  cartCreate,
  cartLinesAdd,
  cartLinesUpdate,
  cartLinesRemove,
  cartBuyerIdentityUpdate,
  cartDiscountCodesUpdate,
  getCart,
  formatMerchandiseId,
  ShopifyCart
} from "@/lib/shopify";
import { useUiStore } from "@/store/ui";
import { cartStorage } from "@/lib/cart-storage";

export interface CartItem {
  lineId?: string;
  product: Product;
  quantity: number;
}

interface CartState {
  cartId: string | null;
  checkoutUrl: string | null;
  items: CartItem[];
  isSyncing: boolean;
  error: string | null;
  discountCode: string | null;
  appliedDiscount: number;
  mode: "guest" | "customer";
  activeUserId: string | null;

  // Store actions
  initCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  applyDiscountCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  associateBuyerIdentity: (customerAccessToken: string, email?: string) => Promise<void>;
  mergeGuestCart: (customerAccessToken: string, email?: string, userId?: string) => Promise<void>;
  switchToCustomerMode: (userId: string, customerAccessToken?: string) => Promise<void>;
  switchToGuestMode: () => void;
  clearCart: () => void;
}

// Debounce timer map for line quantity updates
const debounceTimers: Record<string, NodeJS.Timeout> = {};

// In-memory synchronization lock for mergeGuestCart
let mergeInProgress = false;

export const convertShopifyLinesToCartItems = (lines: unknown): CartItem[] => {
  const rawList = Array.isArray(lines)
    ? lines
    : lines && typeof lines === "object" && lines !== null && "nodes" in lines && Array.isArray((lines as Record<string, unknown>).nodes)
    ? ((lines as Record<string, unknown>).nodes as unknown[])
    : [];
  return rawList.map((lineItem: unknown) => {
    const line = lineItem as Record<string, unknown>;
    const merch = line?.merchandise as unknown as {
      id: string;
      title?: string;
      price?: { amount?: string };
      product?: { id?: string; title?: string; featuredImage?: { url?: string } };
    };
    const rawQty = typeof line?.quantity === "number" ? line.quantity : parseInt(String(line?.quantity || "1"), 10);
    const qty = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
    return {
      lineId: typeof line?.id === "string" ? line.id : undefined,
      product: {
        id: merch?.product?.id || merch?.id || (typeof line?.id === "string" ? line.id : ""),
        name: merch?.product?.title || merch?.title || "Prodotto",
        price: parseFloat(merch?.price?.amount || "0"),
        originalPrice: undefined,
        unit: "",
        imageUrl: merch?.product?.featuredImage?.url || "",
        category: "Alimentari",
        description: "",
        tags: [],
        inStock: true,
      },
      quantity: qty,
    };
  });
};

export const useCartStore = create<CartState>()(
  persist(
    (originalSet, get) => {
      const set = (
        partial: CartState | Partial<CartState> | ((state: CartState) => CartState | Partial<CartState>),
        replace?: boolean
      ) => {
        const oldCartId = get().cartId;
        const oldItemsLength = get().items ? get().items.length : 0;
        originalSet(
          partial as Parameters<typeof originalSet>[0],
          replace as Parameters<typeof originalSet>[1]
        );
        const newCartId = get().cartId;
        const newItemsLength = get().items ? get().items.length : 0;
        if (process.env.NODE_ENV === "development") {
          if (oldCartId !== newCartId) {
            const err = new Error();
            const callerLine = err.stack?.split("\n")[2]?.trim() || "unknown";
            console.log("========================");
            console.log("CART STATE CHANGED");
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log(`Old cartId: ${oldCartId}`);
            console.log(`New cartId: ${newCartId}`);
            console.log(`Caller: ${callerLine}`);
            console.log("Stack trace:");
            console.log(err.stack);
            console.log("========================");
          }
          if (oldItemsLength !== newItemsLength) {
            const err = new Error();
            console.log("==================================================");
            console.log("🔥 [FORENSIC ALERT] ITEMS LENGTH CHANGED 🔥");
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log(`OLD LENGTH: ${oldItemsLength} -> NEW LENGTH: ${newItemsLength}`);
            console.log(`Network Status (navigator.onLine): ${typeof window !== "undefined" ? window.navigator.onLine : "N/A"}`);
            console.log("Full Stack trace:\n" + err.stack);
            console.log("==================================================");
          }
        }
      };

      const logActionEnter = (actionName: string) => {
        if (process.env.NODE_ENV === "development") {
          const timestamp = new Date().toISOString();
          const { cartId, mode, activeUserId } = get();
          console.log(`[STORE DIAGNOSTIC] [${timestamp}] ENTER ${actionName}`, {
            currentCartId: cartId,
            currentMode: mode,
            currentUserId: activeUserId,
          });
        }
      };

      const logActionExit = (actionName: string) => {
        if (process.env.NODE_ENV === "development") {
          const timestamp = new Date().toISOString();
          const { cartId, mode, activeUserId } = get();
          console.log(`[STORE DIAGNOSTIC] [${timestamp}] EXIT ${actionName}`, {
            finalCartId: cartId,
            finalMode: mode,
            finalUserId: activeUserId,
          });
        }
      };

      const hydrateCartFromShopify = (
        remoteCart: ShopifyCart | null,
        isExpiredOrMissing: boolean = false,
        caller: string = "unknown"
      ) => {
        const prevItemsLength = get()?.items?.length ?? 0;
        const onlineState = typeof window !== "undefined" ? window.navigator.onLine : true;
        const stackTrace = new Error().stack || "";

        console.log("==================================================");
        console.log(`[FORENSIC CART LOG] hydrateCartFromShopify`);
        console.log(`  Caller / Reason: ${caller}`);
        console.log(`  remoteCart ID: ${remoteCart ? remoteCart.id : "NULL"}`);
        console.log(`  isExpiredOrMissing: ${isExpiredOrMissing}`);
        console.log(`  Previous items.length: ${prevItemsLength}`);
        console.log(`  Network state (navigator.onLine): ${onlineState}`);
        console.log(`  Stack trace:\n${stackTrace}`);

        if (!remoteCart) {
          if (isExpiredOrMissing) {
            console.log(`  --> [DECISION] CLEARING STATE: items.length ${prevItemsLength} -> 0`);
            set({ cartId: null, checkoutUrl: null, items: [], isSyncing: false, error: null });
            const { mode, activeUserId } = get();
            if (mode === "customer" && activeUserId) {
              cartStorage.clearCustomerCartId(activeUserId);
            } else {
              cartStorage.clearGuestCartId();
            }
          } else {
            console.log(`  --> [DECISION] TRANSIENT FAILURE: Retaining items.length (${prevItemsLength})`);
            set({ isSyncing: false });
          }
          console.log("==================================================");
          return;
        }

        const items = convertShopifyLinesToCartItems(remoteCart.lines);
        console.log(`  --> [DECISION] HYDRATING SUCCESS: New items.length = ${items.length}`);
        set({
          cartId: remoteCart.id,
          checkoutUrl: remoteCart.checkoutUrl,
          items,
          isSyncing: false,
          error: null,
        });

        const { mode, activeUserId } = get();
        if (mode === "customer" && activeUserId) {
          cartStorage.saveCustomerCartId(activeUserId, remoteCart.id);
        } else {
          cartStorage.saveGuestCartId(remoteCart.id);
        }
        console.log("==================================================");
      };

      return {
        cartId: null,
        checkoutUrl: null,
        items: [],
        isSyncing: false,
        error: null,
        discountCode: null,
        appliedDiscount: 0,
        mode: "guest",
        activeUserId: null,

        initCart: async () => {
          logActionEnter("initCart");
          if (typeof window === "undefined") {
            logActionExit("initCart");
            return;
          }
          const currentMode = get().mode;
          const activeUserId = get().activeUserId;

          const targetCartId =
            currentMode === "customer" && activeUserId
              ? cartStorage.getCustomerCartId(activeUserId)
              : cartStorage.getGuestCartId();

          console.log(`[FORENSIC CART LOG] initCart executing. targetCartId: ${targetCartId}, navigator.onLine: ${typeof window !== "undefined" ? window.navigator.onLine : "N/A"}`);

          if (targetCartId) {
            try {
              set({ isSyncing: true });
              const remoteCart = await getCart(targetCartId);
              if (remoteCart) {
                hydrateCartFromShopify(remoteCart, false, "initCart - success");
              } else {
                hydrateCartFromShopify(null, true, "initCart - remoteCart returned null (expired/missing)");
              }
            } catch (err) {
              console.error("Failed to init Shopify cart:", err);
              hydrateCartFromShopify(null, false, "initCart - caught exception (transient network failure)");
            }
          } else {
            set({ isSyncing: false });
          }
          logActionExit("initCart");
        },

        addItem: async (product, quantity = 1) => {
          logActionEnter("addItem");
          trackAddToCart(product, quantity);

          set({ isSyncing: true, error: null });
          useUiStore.getState().openCart();

          const productId = product.id;
          if (debounceTimers[productId]) {
            clearTimeout(debounceTimers[productId]);
          }

          debounceTimers[productId] = setTimeout(async () => {
            const currentMode = get().mode;
            const activeUserId = get().activeUserId;

            try {
              const { cartId } = get();
              const merchandiseId = formatMerchandiseId(product);

              let updatedCart: ShopifyCart | null = null;
              const previousCartId = cartId;

              // Check if item was added while debounce was waiting
              const existingItem = get().items.find((item) => item.product.id === productId);

              if (cartId && existingItem?.lineId) {
                updatedCart = await cartLinesUpdate(cartId, [{ id: existingItem.lineId, quantity }]);
              } else if (cartId) {
                updatedCart = await cartLinesAdd(cartId, [{ merchandiseId, quantity }]);
              } else {
                updatedCart = await cartCreate([{ merchandiseId, quantity }]);
              }

              if (updatedCart) {
                hydrateCartFromShopify(updatedCart, false, "addItem - success");
                const newCartId = updatedCart.id;

                if (currentMode === "customer" && activeUserId && newCartId && previousCartId !== newCartId) {
                  try {
                    const { saveCustomerActiveCartIdAction } = await import("@/app/actions/cart-metafield");
                    await saveCustomerActiveCartIdAction(activeUserId, newCartId);
                  } catch (metaErr) {
                    console.error("Failed to persist new customer active cart ID metafield:", metaErr);
                  }
                }
              } else {
                hydrateCartFromShopify(null, false, "addItem - updatedCart returned null");
              }
            } catch (err) {
              console.error("Cart API Sync failed:", err);
              set({ isSyncing: false, error: "Impossibile sincronizzare con Shopify" });
            }
          }, 350);

          logActionExit("addItem");
        },

        removeItem: async (productId) => {
          const itemToRemove = get().items.find((item) => item.product.id === productId);
          if (itemToRemove) {
            trackRemoveFromCart(itemToRemove.product, itemToRemove.quantity);
          }

          const { cartId } = get();
          if (cartId && itemToRemove?.lineId) {
            try {
              set({ isSyncing: true });
              const updatedCart = await cartLinesRemove(cartId, [itemToRemove.lineId]);
              if (updatedCart) {
                hydrateCartFromShopify(updatedCart, false, "removeItem - success");
              } else {
                hydrateCartFromShopify(null, false, "removeItem - updatedCart returned null");
              }
            } catch (err) {
              console.error("Remove line item failed:", err);
              set({ isSyncing: false });
            }
          } else {
            set({ isSyncing: false });
          }
        },

        updateQuantity: async (productId, quantity) => {
          if (quantity <= 0) {
            if (debounceTimers[productId]) {
              clearTimeout(debounceTimers[productId]);
            }
            get().removeItem(productId);
            return;
          }

          if (debounceTimers[productId]) {
            clearTimeout(debounceTimers[productId]);
          }

          debounceTimers[productId] = setTimeout(async () => {
            const { cartId } = get();
            const itemToUpdate = get().items.find((item) => item.product.id === productId);

            if (cartId && itemToUpdate?.lineId) {
              try {
                set({ isSyncing: true });
                const updatedCart = await cartLinesUpdate(cartId, [
                  { id: itemToUpdate.lineId!, quantity },
                ]);
                if (updatedCart) {
                  hydrateCartFromShopify(updatedCart, false, "updateQuantity - success");
                } else {
                  hydrateCartFromShopify(null, false, "updateQuantity - updatedCart returned null");
                }
              } catch (err) {
                console.error("Update line item quantity failed:", err);
                set({ isSyncing: false });
              }
            } else {
              set({ isSyncing: false });
            }
          }, 350);
        },

        applyDiscountCode: async (code: string) => {
          const cleanCode = code.trim().toUpperCase();
          set({ isSyncing: true });

          let discountValue = 0;
          if (cleanCode === "ITALIA10") discountValue = 0.10;
          if (cleanCode === "ALIMENTARI") discountValue = 0.15;

          if (discountValue > 0) {
            set({
              discountCode: cleanCode,
              appliedDiscount: discountValue,
            });
          }

          const { cartId } = get();
          if (cartId) {
            try {
              const updatedCart = await cartDiscountCodesUpdate(cartId, [cleanCode]);
              if (updatedCart) {
                set({
                  checkoutUrl: updatedCart.checkoutUrl,
                  isSyncing: false,
                });
                return { success: true };
              }
            } catch (err) {
              console.error("Discount code application failed:", err);
            }
          }

          set({ isSyncing: false });
          if (cleanCode === "ITALIA10" || cleanCode === "ALIMENTARI") {
            return { success: true };
          }
          return { success: false, error: "Codice promozionale non valido" };
        },

        associateBuyerIdentity: async (customerAccessToken, email) => {
          logActionEnter("associateBuyerIdentity");
          const { cartId } = get();
          if (!cartId || !customerAccessToken) {
            logActionExit("associateBuyerIdentity");
            return;
          }

          try {
            set({ isSyncing: true });
            const updatedCart = await cartBuyerIdentityUpdate(cartId, {
              customerAccessToken,
              ...(email ? { email } : {}),
              countryCode: "IT",
            });
            if (updatedCart) {
              const previousCartId = cartId;
              hydrateCartFromShopify(updatedCart);
              const newCartId = updatedCart.id;

              if (newCartId && previousCartId !== newCartId) {
                const { mode, activeUserId } = get();
                if (mode === "customer" && activeUserId) {
                  try {
                    const { saveCustomerActiveCartIdAction } = await import("@/app/actions/cart-metafield");
                    await saveCustomerActiveCartIdAction(activeUserId, newCartId);
                  } catch (metaErr) {
                    console.error("[associateBuyerIdentity] Failed to update metafield after cart ID change:", metaErr);
                  }
                }
              }

              // Auto-sync customer delivery preferences to cart note & attributes
              if (email && newCartId) {
                try {
                  const { useDeliveryPreferencesStore } = await import("@/store/delivery-preferences");
                  const prefs = useDeliveryPreferencesStore.getState().getCustomerPreferences(email);
                  if (prefs && (prefs.preferredWindow || prefs.gateInstructions)) {
                    const { syncCartDeliveryPreferences } = await import("@/lib/shopify");
                    const cartWithPrefs = await syncCartDeliveryPreferences(newCartId, {
                      preferredWindow: prefs.preferredWindow,
                      gateInstructions: prefs.gateInstructions,
                    });
                    if (cartWithPrefs) {
                      hydrateCartFromShopify(cartWithPrefs);
                    }
                  }
                } catch (prefErr) {
                  console.error("[associateBuyerIdentity] Error syncing delivery preferences:", prefErr);
                }
              }
            } else {
              hydrateCartFromShopify(null, false);
            }
          } catch (err) {
            console.error("[associateBuyerIdentity] Graceful error handler:", err);
            set({ isSyncing: false });
          }
          logActionExit("associateBuyerIdentity");
        },

        mergeGuestCart: async (customerAccessToken: string, email?: string, userId?: string) => {
          logActionEnter("mergeGuestCart");
          if (typeof window === "undefined") {
            logActionExit("mergeGuestCart");
            return;
          }

          if (mergeInProgress) {
            if (process.env.NODE_ENV === "development") {
              console.log("[mergeGuestCart] Concurrent merge blocked by synchronization lock");
            }
            logActionExit("mergeGuestCart");
            return;
          }

          mergeInProgress = true;

          try {
            const current = get();
            const effectiveUserId = userId || current.activeUserId;
            if (!effectiveUserId) {
              return;
            }

            const savedGuestCartId = cartStorage.getGuestCartId();
            const savedCustomerCartId = cartStorage.getCustomerCartId(effectiveUserId);

            set({ isSyncing: true });

            let guestRemoteCart: ShopifyCart | null = null;
            let customerRemoteCart: ShopifyCart | null = null;

            if (savedGuestCartId) {
              try {
                guestRemoteCart = await getCart(savedGuestCartId);
              } catch (err) {
                console.error("[mergeGuestCart] Error fetching guest cart:", err);
              }
            }

            if (savedCustomerCartId) {
              try {
                customerRemoteCart = await getCart(savedCustomerCartId);
              } catch (err) {
                console.error("[mergeGuestCart] Error fetching customer cart:", err);
              }
            }

            const guestLines = guestRemoteCart?.lines || [];
            const customerLines = customerRemoteCart?.lines || [];

            if (guestLines.length === 0) {
              if (customerRemoteCart) {
                set({ mode: "customer", activeUserId: effectiveUserId });
                hydrateCartFromShopify(customerRemoteCart);
              } else {
                await get().switchToCustomerMode(effectiveUserId, customerAccessToken);
              }
              if (customerAccessToken && get().cartId) {
                await get().associateBuyerIdentity(customerAccessToken, email);
              }

              if (cartStorage.getPendingCheckoutIntent()) {
                let checkoutUrl = get().checkoutUrl;
                if (!checkoutUrl || !checkoutUrl.startsWith("https://")) {
                  try {
                    const { checkoutCart } = await import("@/lib/shopify");
                    checkoutUrl = await checkoutCart(get().cartId, get().items);
                  } catch (checkoutErr) {
                    console.error("[mergeGuestCart] Post-merge checkout generation error:", checkoutErr);
                  }
                }

                if (checkoutUrl && checkoutUrl.startsWith("https://")) {
                  cartStorage.clearPendingCheckoutIntent();
                  if (process.env.NODE_ENV === "development") {
                    console.log("[mergeGuestCart] EXECUTING POST-MERGE CHECKOUT REDIRECT (empty guest cart) TO:", checkoutUrl);
                  }
                  window.location.assign(checkoutUrl);
                  return;
                }
              }
              return;
            }

            // Build customer variant map: variantId -> { lineId, quantity }
            const customerVariantMap = new Map<string, { lineId: string; quantity: number }>();
            for (const line of customerLines) {
              const variantId = line.merchandise?.id;
              if (variantId) {
                customerVariantMap.set(variantId, { lineId: line.id, quantity: line.quantity });
              }
            }

            // Differentiate existing variants vs brand-new variants
            const linesToUpdate: Array<{ id: string; quantity: number }> = [];
            const linesToAdd: Array<{ merchandiseId: string; quantity: number }> = [];

            for (const gLine of guestLines) {
              const variantId = gLine.merchandise?.id;
              if (!variantId) continue;

              const existingInCustomer = customerVariantMap.get(variantId);
              if (existingInCustomer) {
                // Variant exists in customer cart -> calculate new summed quantity and update line
                const newQuantity = existingInCustomer.quantity + gLine.quantity;
                linesToUpdate.push({ id: existingInCustomer.lineId, quantity: newQuantity });
                // Update local map so subsequent occurrences of same variant accumulate
                customerVariantMap.set(variantId, { lineId: existingInCustomer.lineId, quantity: newQuantity });
              } else {
                // Brand-new variant -> queue for cartLinesAdd
                const existingInAdd = linesToAdd.find((l) => l.merchandiseId === variantId);
                if (existingInAdd) {
                  existingInAdd.quantity += gLine.quantity;
                } else {
                  linesToAdd.push({ merchandiseId: variantId, quantity: gLine.quantity });
                }
              }
            }

            let targetCart: ShopifyCart | null = null;

            if (customerRemoteCart) {
              let currentCart = customerRemoteCart;
              if (linesToUpdate.length > 0) {
                const updateRes = await cartLinesUpdate(currentCart.id, linesToUpdate);
                if (updateRes) currentCart = updateRes;
              }
              if (linesToAdd.length > 0) {
                const addRes = await cartLinesAdd(currentCart.id, linesToAdd);
                if (addRes) currentCart = addRes;
              }
              if (customerAccessToken) {
                const buyerRes = await cartBuyerIdentityUpdate(currentCart.id, {
                  customerAccessToken,
                  email,
                  countryCode: "IT",
                });
                if (buyerRes) currentCart = buyerRes;
              }
              targetCart = currentCart;
            } else if (savedGuestCartId) {
              // Guest cart becomes customer cart via buyer identity association
              targetCart = await cartBuyerIdentityUpdate(savedGuestCartId, {
                customerAccessToken,
                email,
                countryCode: "IT",
              });
            } else if (linesToAdd.length > 0) {
              targetCart = await cartCreate(linesToAdd, {
                customerAccessToken,
                email,
                countryCode: "IT",
              });
            }

            if (targetCart) {
              set({ mode: "customer", activeUserId: effectiveUserId });
              hydrateCartFromShopify(targetCart);
              cartStorage.clearGuestCartId();

              try {
                const { saveCustomerActiveCartIdAction } = await import("@/app/actions/cart-metafield");
                await saveCustomerActiveCartIdAction(effectiveUserId, targetCart.id);
              } catch (metaErr) {
                console.error("[mergeGuestCart] Failed to persist metafield after merge:", metaErr);
              }

              if (cartStorage.getPendingCheckoutIntent()) {
                let checkoutUrl = get().checkoutUrl;
                if (!checkoutUrl || !checkoutUrl.startsWith("https://")) {
                  try {
                    const { checkoutCart } = await import("@/lib/shopify");
                    checkoutUrl = await checkoutCart(get().cartId, get().items);
                  } catch (checkoutErr) {
                    console.error("[mergeGuestCart] Post-merge checkout generation error:", checkoutErr);
                  }
                }

                if (checkoutUrl && checkoutUrl.startsWith("https://")) {
                  cartStorage.clearPendingCheckoutIntent();
                  if (process.env.NODE_ENV === "development") {
                    console.log("[mergeGuestCart] EXECUTING POST-MERGE CHECKOUT REDIRECT TO:", checkoutUrl);
                  }
                  window.location.assign(checkoutUrl);
                  return;
                }
              }
            } else {
              hydrateCartFromShopify(null, false);
            }
          } catch (err) {
            console.error("[mergeGuestCart] Error during cart merge:", err);
            set({ isSyncing: false });
          } finally {
            mergeInProgress = false;
            logActionExit("mergeGuestCart");
          }
        },

        switchToCustomerMode: async (userId: string, customerAccessToken?: string) => {
          logActionEnter("switchToCustomerMode");
          if (typeof window === "undefined") {
            logActionExit("switchToCustomerMode");
            return;
          }

          set({ mode: "customer", activeUserId: userId, isSyncing: true });

          let transientErrorOccurred = false;
          const savedCustomerCartId = cartStorage.getCustomerCartId(userId);

          // Priority 1 — Local Customer Cart ID
          if (savedCustomerCartId) {
            try {
              const remoteCart = await getCart(savedCustomerCartId);
              if (remoteCart) {
                hydrateCartFromShopify(remoteCart);
                logActionExit("switchToCustomerMode");
                return;
              }
            } catch (err) {
              console.error("[Priority1] Error validating local cartId:", err);
              transientErrorOccurred = true;
            }
          }

          // Priority 2 — Customer Metafield Cart ID
          if (customerAccessToken) {
            try {
              const { getCustomerCartMetafield } = await import("@/lib/shopify");
              const metafieldCartId = await getCustomerCartMetafield(customerAccessToken);

              if (metafieldCartId) {
                const remoteCart = await getCart(metafieldCartId);
                if (remoteCart) {
                  hydrateCartFromShopify(remoteCart);
                  logActionExit("switchToCustomerMode");
                  return;
                }
              }
            } catch (err) {
              console.error("[Priority2] Error recovering cross-browser cart:", err);
              transientErrorOccurred = true;
            }
          }

          // Stop syncing without creating a cart if a transient error occurred
          if (transientErrorOccurred) {
            if (process.env.NODE_ENV === "development") {
              console.log("[switchToCustomerMode] Transient error occurred; skipping new cart creation.");
            }
            set({ isSyncing: false });
            logActionExit("switchToCustomerMode");
            return;
          }

          // Allocate new cart ONLY if both recovery strategies cleanly failed without transient error
          try {
            const newCart = await cartCreate([], {
              ...(customerAccessToken ? { customerAccessToken } : {}),
              countryCode: "IT",
            });

            if (newCart) {
              hydrateCartFromShopify(newCart);
              cartStorage.saveCustomerCartId(userId, newCart.id);
              try {
                const { saveCustomerActiveCartIdAction } = await import("@/app/actions/cart-metafield");
                await saveCustomerActiveCartIdAction(userId, newCart.id);
              } catch (metaErr) {
                console.error("[switchToCustomerMode] Failed to persist new customer active cart ID metafield:", metaErr);
              }
            } else {
              hydrateCartFromShopify(null, false);
            }
          } catch (createErr) {
            console.error("[switchToCustomerMode] Error creating fresh customer cart:", createErr);
            set({ isSyncing: false });
          }

          logActionExit("switchToCustomerMode");
        },

        switchToGuestMode: async () => {
          logActionEnter("switchToGuestMode");
          if (typeof window === "undefined") {
            logActionExit("switchToGuestMode");
            return;
          }

          const savedGuestCartId = cartStorage.getGuestCartId();
          set({ mode: "guest", activeUserId: null, isSyncing: true });

          if (savedGuestCartId) {
            try {
              const remoteCart = await getCart(savedGuestCartId);
              if (remoteCart) {
                hydrateCartFromShopify(remoteCart);
                logActionExit("switchToGuestMode");
                return;
              } else {
                hydrateCartFromShopify(null, true);
                logActionExit("switchToGuestMode");
                return;
              }
            } catch (err) {
              console.error("[switchToGuestMode] Error fetching guest cart due to transient network error:", err);
              set({ isSyncing: false });
              logActionExit("switchToGuestMode");
              return;
            }
          }

          set({ cartId: null, checkoutUrl: null, items: [], isSyncing: false });
          logActionExit("switchToGuestMode");
        },

        clearCart: () => {
          logActionEnter("clearCart");
          const currentMode = get().mode;
          const activeUserId = get().activeUserId;

          // Clear any pending debounced mutation timers
          Object.keys(debounceTimers).forEach((key) => {
            if (debounceTimers[key]) {
              clearTimeout(debounceTimers[key]);
              delete debounceTimers[key];
            }
          });

          set({
            cartId: null,
            checkoutUrl: null,
            items: [],
            isSyncing: false,
            error: null,
            discountCode: null,
            appliedDiscount: 0,
          });

          if (currentMode === "customer" && activeUserId) {
            cartStorage.clearCustomerCartId(activeUserId);
          } else {
            cartStorage.clearGuestCartId();
          }
          logActionExit("clearCart");
        },
      };
    },
    {
      name: "alimentari_cart",
      skipHydration: true,
      partialize: () => ({}), // Cart data is owned exclusively by cartStorage provider
    }
  )
);

// Derived state helpers to avoid duplicate selector calculations
export const selectCartItems = (state: CartState) => state.items;
export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
export const selectCartDiscount = (state: CartState) =>
  selectCartSubtotal(state) * state.appliedDiscount;
export const selectCartTotal = (state: CartState) =>
  selectCartSubtotal(state) - selectCartDiscount(state);
export const selectProductCartQuantity = (productId: string) => (state: CartState) =>
  state.items.find((item) => item.product.id === productId)?.quantity || 0;
