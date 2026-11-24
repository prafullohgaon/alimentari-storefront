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
  ShopifyCart,
  ShopifyOrderLineItem,
} from "@/lib/shopify";
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
  shopifySubtotal: number | null;
  shopifyTotal: number | null;
  shopifyTax: number | null;
  mode: "guest" | "customer";
  activeUserId: string | null;

  // Store actions
  initCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  applyDiscountCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeDiscountCode: () => Promise<{ success: boolean; error?: string }>;
  associateBuyerIdentity: (customerAccessToken: string, email?: string) => Promise<void>;
  mergeGuestCart: (customerAccessToken: string, email?: string, userId?: string) => Promise<void>;
  switchToCustomerMode: (userId: string, customerAccessToken?: string) => Promise<void>;
  switchToGuestMode: () => void;
  clearCart: () => void;
}

export interface ExtractedCartPricing {
  shopifySubtotal: number;
  shopifyTotal: number;
  shopifyTax: number | null;
  discountCode: string | null;
  appliedDiscount: number;
}

export const extractCartPricingFromShopify = (remoteCart: ShopifyCart | null): ExtractedCartPricing => {
  if (!remoteCart) {
    return {
      shopifySubtotal: 0,
      shopifyTotal: 0,
      shopifyTax: null,
      discountCode: null,
      appliedDiscount: 0,
    };
  }

  const lines = Array.isArray(remoteCart.lines) ? remoteCart.lines : [];
  const linesSubtotal = lines.reduce((sum, line) => {
    const unitPrice = Number.parseFloat(line?.merchandise?.price?.amount || "0");
    const qty = typeof line?.quantity === "number" && line.quantity > 0 ? line.quantity : 0;
    return sum + (Number.isFinite(unitPrice) ? unitPrice * qty : 0);
  }, 0);

  const rawSubtotal = Number.parseFloat(remoteCart.cost?.subtotalAmount?.amount ?? "");
  const rawTotal = Number.parseFloat(remoteCart.cost?.totalAmount?.amount ?? "");
  const rawTax =
    remoteCart.cost?.totalTaxAmount?.amount !== undefined &&
    remoteCart.cost?.totalTaxAmount?.amount !== null
      ? Number.parseFloat(remoteCart.cost.totalTaxAmount.amount)
      : null;

  const hasValidSubtotal = Number.isFinite(rawSubtotal) && rawSubtotal >= 0;
  const hasValidTotal = Number.isFinite(rawTotal) && rawTotal >= 0;
  const shopifyTax =
    rawTax !== null && Number.isFinite(rawTax) && rawTax >= 0 ? Number(rawTax.toFixed(2)) : null;

  const baseSubtotal = Number(
    (hasValidSubtotal ? Math.max(rawSubtotal, linesSubtotal) : linesSubtotal).toFixed(2)
  );

  const cartAllocations = Array.isArray(remoteCart.discountAllocations)
    ? remoteCart.discountAllocations
    : [];
  const cartAllocSum = cartAllocations.reduce((sum, alloc) => {
    const val = Number.parseFloat(alloc?.discountedAmount?.amount || "0");
    return sum + (Number.isFinite(val) && val > 0 ? val : 0);
  }, 0);

  const lineAllocSum = lines.reduce((sum, line) => {
    const allocs = Array.isArray(line?.discountAllocations) ? line.discountAllocations : [];
    return (
      sum +
      allocs.reduce((lSum, alloc) => {
        const val = Number.parseFloat(alloc?.discountedAmount?.amount || "0");
        return lSum + (Number.isFinite(val) && val > 0 ? val : 0);
      }, 0)
    );
  }, 0);

  const totalAllocationsDiscount = Number((cartAllocSum + lineAllocSum).toFixed(2));

  const discountCodes = Array.isArray(remoteCart.discountCodes) ? remoteCart.discountCodes : [];
  const applicableEntry = discountCodes.find(
    (d) => d && typeof d.code === "string" && d.code.trim().length > 0 && d.applicable === true
  );

  const costDifferenceDiscount =
    hasValidTotal && baseSubtotal > rawTotal
      ? Number((baseSubtotal - rawTotal).toFixed(2))
      : 0;

  const computedDiscountAmount =
    totalAllocationsDiscount > 0 ? totalAllocationsDiscount : costDifferenceDiscount;

  if (applicableEntry && computedDiscountAmount > 0) {
    const confirmedDiscount = Number(Math.min(baseSubtotal, computedDiscountAmount).toFixed(2));
    const confirmedTotal =
      hasValidTotal && rawTotal <= baseSubtotal - confirmedDiscount + 0.01
        ? Number(rawTotal.toFixed(2))
        : Number(Math.max(0, baseSubtotal - confirmedDiscount).toFixed(2));

    return {
      shopifySubtotal: baseSubtotal,
      shopifyTotal: confirmedTotal,
      shopifyTax,
      discountCode: applicableEntry.code.trim().toUpperCase(),
      appliedDiscount: confirmedDiscount,
    };
  }

  return {
    shopifySubtotal: baseSubtotal,
    shopifyTotal: baseSubtotal,
    shopifyTax,
    discountCode: null,
    appliedDiscount: 0,
  };
};

// Debounce timer map for line quantity updates
const debounceTimers: Record<string, NodeJS.Timeout> = {};
const debounceResolvers: Record<string, Array<() => void>> = {};

// Batch queue and serializer for addItem & cart mutations
interface PendingAddEntry {
  product: Product;
  addedQuantity: number;
  opVer: number;
  resolvers: Array<() => void>;
}
const pendingAddBatch = new Map<string, PendingAddEntry>();
let addBatchTimer: NodeJS.Timeout | null = null;
let mutationChain: Promise<void> = Promise.resolve();
let cartSessionEpoch = 0;

// Authoritative server-confirmed items and per-item operation version tracking for optimistic updates
let confirmedServerItems: CartItem[] = [];
const itemOpVersion = new Map<string, number>();
const syncedItemOpVersion = new Map<string, number>();

// In-memory synchronization lock for mergeGuestCart
let mergeInProgress = false;

const enqueueCartMutation = <T>(task: () => Promise<T>): Promise<T> => {
  const next = mutationChain.then(task, task);
  mutationChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
};

export const getCanonicalMerchKey = (product: Product): string => {
  const formatted = formatMerchandiseId(product);
  return formatted || product.variantId || product.id;
};

const hasUnsyncedItemOperations = (): boolean => {
  if (pendingAddBatch.size > 0 || Object.keys(debounceTimers).length > 0) {
    return true;
  }
  for (const [key, ver] of itemOpVersion.entries()) {
    if (ver > (syncedItemOpVersion.get(key) || 0)) {
      return true;
    }
  }
  return false;
};

export const getCartItemKey = (item: CartItem): string =>
  item.product.variantId || item.lineId || item.product.id;

export const findCartItemByIdentifier = (
  items: CartItem[],
  identifier: string
): CartItem | undefined => {
  if (!identifier || !Array.isArray(items)) return undefined;
  const byVariantId = items.find((item) => item.product.variantId === identifier);
  if (byVariantId) return byVariantId;

  const byLineId = items.find((item) => item.lineId === identifier);
  if (byLineId) return byLineId;

  const isVariantOrLineGid =
    identifier.startsWith("gid://shopify/ProductVariant/") ||
    identifier.startsWith("gid://shopify/CartLine/");
  if (isVariantOrLineGid) {
    return undefined;
  }

  return items.find((item) => item.product.id === identifier);
};

const buildReconciledItems = (
  serverItems: CartItem[],
  currentOptimisticItems: CartItem[]
): CartItem[] => {
  const result: CartItem[] = [];
  const handledMerchKeys = new Set<string>();

  for (const serverItem of serverItems) {
    const merchKey = getCanonicalMerchKey(serverItem.product);
    handledMerchKeys.add(merchKey);

    const currentVer = itemOpVersion.get(merchKey) || 0;
    const syncedVer = syncedItemOpVersion.get(merchKey) || 0;

    if (currentVer > syncedVer) {
      const optItem =
        findCartItemByIdentifier(currentOptimisticItems, merchKey) ||
        findCartItemByIdentifier(currentOptimisticItems, serverItem.product.id);

      if (!optItem) {
        // A newer local removeItem operation is still pending on this item
        continue;
      }

      const maxStock =
        typeof serverItem.product.stock === "number" &&
        Number.isFinite(serverItem.product.stock)
          ? Math.max(0, serverItem.product.stock)
          : typeof optItem.product.stock === "number" &&
            Number.isFinite(optItem.product.stock)
          ? Math.max(0, optItem.product.stock)
          : null;

      const reconciledQty =
        maxStock !== null && maxStock > 0
          ? Math.min(optItem.quantity, maxStock)
          : optItem.quantity;

      if (reconciledQty > 0) {
        result.push({
          lineId: serverItem.lineId || optItem.lineId,
          product: {
            ...serverItem.product,
            category: optItem.product.category || serverItem.product.category,
            brand: optItem.product.brand || serverItem.product.brand,
          },
          quantity: reconciledQty,
        });
      }
    } else {
      result.push(serverItem);
    }
  }

  for (const optItem of currentOptimisticItems) {
    const merchKey = getCanonicalMerchKey(optItem.product);
    if (handledMerchKeys.has(merchKey)) continue;

    const currentVer = itemOpVersion.get(merchKey) || 0;
    const syncedVer = syncedItemOpVersion.get(merchKey) || 0;

    if (currentVer > syncedVer && optItem.quantity > 0) {
      handledMerchKeys.add(merchKey);
      result.push(optItem);
    }
  }

  return result;
};

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
      sku?: string | null;
      availableForSale?: boolean;
      quantityAvailable?: number | null;
      price?: { amount?: string };
      compareAtPrice?: { amount?: string } | null;
      selectedOptions?: Array<{ name?: string; value?: string }>;
      image?: { url?: string; altText?: string | null } | null;
      product?: {
        id?: string;
        title?: string;
        handle?: string;
        featuredImage?: { url?: string };
      };
    };
    const rawQty = typeof line?.quantity === "number" ? line.quantity : parseInt(String(line?.quantity || "1"), 10);
    const qty = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
    const rawVariantTitle = typeof merch?.title === "string" ? merch.title.trim() : "";
    const isDefaultVariantTitle =
      !rawVariantTitle ||
      rawVariantTitle.toLowerCase().includes("default title") ||
      rawVariantTitle.toLowerCase() === "default";

    const selectedOptions = Array.isArray(merch?.selectedOptions)
      ? merch.selectedOptions
          .filter(
            (opt): opt is { name: string; value: string } =>
              Boolean(opt && typeof opt.name === "string" && typeof opt.value === "string")
          )
          .map((opt) => ({ name: opt.name.trim(), value: opt.value.trim() }))
      : [];

    const optionsSummary = selectedOptions
      .map((opt) => opt.value)
      .filter(
        (val) =>
          val &&
          !val.toLowerCase().includes("default title") &&
          val.toLowerCase() !== "default"
      )
      .join(" / ");

    const cleanVariantUnit = !isDefaultVariantTitle ? rawVariantTitle : optionsSummary;

    const unitPrice = parseFloat(merch?.price?.amount || "0");
    const safePrice = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;

    const rawCompareAt = merch?.compareAtPrice?.amount
      ? parseFloat(merch.compareAtPrice.amount)
      : NaN;
    const originalPrice =
      Number.isFinite(rawCompareAt) && rawCompareAt > safePrice ? rawCompareAt : undefined;

    const stock: number | null =
      typeof merch?.quantityAvailable === "number" && Number.isFinite(merch.quantityAvailable)
        ? Math.max(0, merch.quantityAvailable)
        : null;

    const available: boolean =
      typeof merch?.availableForSale === "boolean"
        ? merch.availableForSale && (stock === null || stock > 0)
        : stock !== null
        ? stock > 0
        : true;

    const imageUrl =
      merch?.image?.url || merch?.product?.featuredImage?.url || "";

    const sku =
      typeof merch?.sku === "string" && merch.sku.trim().length > 0
        ? merch.sku.trim()
        : undefined;

    const handle =
      typeof merch?.product?.handle === "string" && merch.product.handle.trim().length > 0
        ? merch.product.handle.trim()
        : undefined;

    return {
      lineId: typeof line?.id === "string" ? line.id : undefined,
      product: {
        id: merch?.product?.id || merch?.id || (typeof line?.id === "string" ? line.id : ""),
        variantId: merch?.id || undefined,
        handle,
        sku,
        name: merch?.product?.title || merch?.title || "Prodotto",
        price: safePrice,
        originalPrice,
        unit: cleanVariantUnit,
        imageUrl,
        category: "Alimentari",
        description: "",
        tags: [],
        available,
        stock,
        variants: merch?.id
          ? [
              {
                id: merch.id,
                title: rawVariantTitle || "Default Title",
                sku: sku || "",
                price: safePrice,
                originalPrice,
                stock,
                available,
                selectedOptions,
                image: imageUrl ? { url: imageUrl } : undefined,
              },
            ]
          : undefined,
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

      const markKeysSettled = (
        keys: Iterable<string>,
        settledOpVersions?: Map<string, number>
      ) => {
        for (const key of keys) {
          const currentVer = itemOpVersion.get(key) || 0;
          const targetVer = settledOpVersions?.get(key);
          if (targetVer !== undefined) {
            const prevSynced = syncedItemOpVersion.get(key) || 0;
            if (targetVer > prevSynced) {
              syncedItemOpVersion.set(key, Math.min(currentVer, targetVer));
            }
          } else {
            syncedItemOpVersion.set(key, currentVer);
          }
        }
      };

      const rollbackKeysToConfirmed = (
        keys: Iterable<string>,
        settledOpVersions?: Map<string, number>,
        errorMessage?: string | null
      ) => {
        markKeysSettled(keys, settledOpVersions);
        const reconciled = buildReconciledItems(confirmedServerItems, get().items);
        set({
          items: reconciled,
          isSyncing: hasUnsyncedItemOperations(),
          ...(errorMessage !== undefined ? { error: errorMessage } : {}),
        });
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
            confirmedServerItems = [];
            itemOpVersion.clear();
            syncedItemOpVersion.clear();
            set({
              cartId: null,
              checkoutUrl: null,
              items: [],
              discountCode: null,
              appliedDiscount: 0,
              shopifySubtotal: null,
              shopifyTotal: null,
              shopifyTax: null,
              isSyncing: false,
              error: null,
            });
            const { mode, activeUserId } = get();
            if (mode === "customer" && activeUserId) {
              cartStorage.clearCustomerCartId(activeUserId);
            } else {
              cartStorage.clearGuestCartId();
            }
          } else {
            console.log(`  --> [DECISION] TRANSIENT FAILURE: Retaining items.length (${prevItemsLength})`);
            set({ isSyncing: hasUnsyncedItemOperations() });
          }
          console.log("==================================================");
          return;
        }

        const serverItems = convertShopifyLinesToCartItems(remoteCart.lines);
        confirmedServerItems = serverItems;
        const items = buildReconciledItems(serverItems, get().items);
        const pricing = extractCartPricingFromShopify(remoteCart);
        const stillSyncing = hasUnsyncedItemOperations();
        console.log(`  --> [DECISION] HYDRATING SUCCESS: New items.length = ${items.length}`);
        set({
          cartId: remoteCart.id,
          checkoutUrl: remoteCart.checkoutUrl,
          items,
          discountCode: pricing.discountCode,
          appliedDiscount: pricing.appliedDiscount,
          shopifySubtotal: pricing.shopifySubtotal,
          shopifyTotal: pricing.shopifyTotal,
          shopifyTax: pricing.shopifyTax,
          isSyncing: stillSyncing,
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
        shopifySubtotal: null,
        shopifyTotal: null,
        shopifyTax: null,
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
            set({ isSyncing: hasUnsyncedItemOperations() });
          }
          logActionExit("initCart");
        },

        addItem: async (product, quantity = 1) => {
          logActionEnter("addItem");
          const cleanQuantity =
            typeof quantity === "number" && Number.isFinite(quantity)
              ? Math.floor(quantity)
              : 1;
          if (
            cleanQuantity <= 0 ||
            product.available === false ||
            (product.available === undefined && typeof product.stock === "number" && product.stock <= 0) ||
            (typeof product.stock === "number" && product.stock <= 0)
          ) {
            logActionExit("addItem");
            return;
          }

          const merchandiseId = formatMerchandiseId(product);
          const merchKey = merchandiseId || product.variantId || product.id;

          const currentItems = get().items;
          const existingOptItem =
            findCartItemByIdentifier(currentItems, merchKey) ||
            (product.variantId
              ? findCartItemByIdentifier(currentItems, product.variantId)
              : findCartItemByIdentifier(currentItems, product.id));

          const knownStock =
            typeof product.stock === "number" && Number.isFinite(product.stock)
              ? Math.max(0, product.stock)
              : typeof existingOptItem?.product.stock === "number" &&
                Number.isFinite(existingOptItem.product.stock)
              ? Math.max(0, existingOptItem.product.stock)
              : null;

          const currentOptQty = existingOptItem ? existingOptItem.quantity : 0;
          const desiredOptQty =
            knownStock !== null
              ? Math.min(currentOptQty + cleanQuantity, knownStock)
              : currentOptQty + cleanQuantity;

          if (desiredOptQty <= currentOptQty) {
            logActionExit("addItem");
            return;
          }

          const actualAddedDelta = desiredOptQty - currentOptQty;
          trackAddToCart(product, actualAddedDelta);

          const nextOpVer = (itemOpVersion.get(merchKey) || 0) + 1;
          itemOpVersion.set(merchKey, nextOpVer);

          const normalizedProduct: Product = {
            ...product,
            variantId:
              merchandiseId && merchandiseId.startsWith("gid://shopify/ProductVariant/")
                ? merchandiseId
                : product.variantId,
          };

          const optimisticItems = existingOptItem
            ? currentItems.map((item) =>
                item === existingOptItem
                  ? {
                      ...item,
                      product: {
                        ...item.product,
                        ...normalizedProduct,
                        variantId: normalizedProduct.variantId || item.product.variantId,
                      },
                      quantity: desiredOptQty,
                    }
                  : item
              )
            : [
                ...currentItems,
                {
                  lineId: undefined,
                  product: normalizedProduct,
                  quantity: desiredOptQty,
                },
              ];

          set({ items: optimisticItems, isSyncing: true, error: null });

          const existingPending = pendingAddBatch.get(merchKey);

          const completionPromise = new Promise<void>((resolve) => {
            if (existingPending) {
              existingPending.addedQuantity += actualAddedDelta;
              existingPending.product = normalizedProduct;
              existingPending.opVer = nextOpVer;
              existingPending.resolvers.push(resolve);
            } else {
              pendingAddBatch.set(merchKey, {
                product: normalizedProduct,
                addedQuantity: actualAddedDelta,
                opVer: nextOpVer,
                resolvers: [resolve],
              });
            }
          });

          if (addBatchTimer) {
            clearTimeout(addBatchTimer);
          }

          const scheduledEpoch = cartSessionEpoch;

          addBatchTimer = setTimeout(() => {
            addBatchTimer = null;
            const batchEntries = Array.from(pendingAddBatch.entries());
            pendingAddBatch.clear();

            if (batchEntries.length === 0) {
              return;
            }

            void enqueueCartMutation(async () => {
              const allResolvers = batchEntries.flatMap(([, entry]) => entry.resolvers);
              const batchOpVersions = new Map<string, number>();
              try {
                if (scheduledEpoch !== cartSessionEpoch) {
                  return;
                }

                const currentMode = get().mode;
                const activeUserId = get().activeUserId;
                const currentCartId = get().cartId;
                const latestOptimisticItems = get().items;
                const previousCartId = currentCartId;

                const linesToUpdate: Array<{ id: string; quantity: number }> = [];
                const linesToAdd: Array<{
                  merchandiseId: string;
                  quantity: number;
                  product: Product;
                }> = [];

                for (const [mKey, entry] of batchEntries) {
                  const snapVer = itemOpVersion.get(mKey) || entry.opVer;
                  batchOpVersions.set(mKey, snapVer);

                  const desiredItem =
                    findCartItemByIdentifier(latestOptimisticItems, mKey) ||
                    (entry.product.variantId
                      ? undefined
                      : findCartItemByIdentifier(latestOptimisticItems, entry.product.id));

                  if (!desiredItem || desiredItem.quantity <= 0) {
                    markKeysSettled([mKey], batchOpVersions);
                    continue;
                  }

                  const confirmedItem =
                    findCartItemByIdentifier(confirmedServerItems, mKey) ||
                    (entry.product.variantId
                      ? undefined
                      : findCartItemByIdentifier(confirmedServerItems, entry.product.id));

                  const itemKnownStock =
                    typeof entry.product.stock === "number" && Number.isFinite(entry.product.stock)
                      ? Math.max(0, entry.product.stock)
                      : typeof desiredItem.product.stock === "number" &&
                        Number.isFinite(desiredItem.product.stock)
                      ? Math.max(0, desiredItem.product.stock)
                      : typeof confirmedItem?.product.stock === "number" &&
                        Number.isFinite(confirmedItem.product.stock)
                      ? Math.max(0, confirmedItem.product.stock)
                      : null;

                  const clampedTotal =
                    itemKnownStock !== null
                      ? Math.min(desiredItem.quantity, itemKnownStock)
                      : desiredItem.quantity;

                  if (clampedTotal <= 0) {
                    markKeysSettled([mKey], batchOpVersions);
                    continue;
                  }

                  const targetLineId = confirmedItem?.lineId || desiredItem.lineId;
                  if (currentCartId && targetLineId) {
                    if (confirmedItem && confirmedItem.quantity === clampedTotal) {
                      markKeysSettled([mKey], batchOpVersions);
                    } else {
                      linesToUpdate.push({
                        id: targetLineId,
                        quantity: clampedTotal,
                      });
                    }
                  } else {
                    const shopifyMerchId = formatMerchandiseId(entry.product) || mKey;
                    linesToAdd.push({
                      merchandiseId: shopifyMerchId,
                      quantity: clampedTotal,
                      product: entry.product,
                    });
                  }
                }

                if (linesToUpdate.length === 0 && linesToAdd.length === 0) {
                  if (scheduledEpoch === cartSessionEpoch) {
                    set({ isSyncing: hasUnsyncedItemOperations() });
                  }
                  return;
                }

                let latestCart: ShopifyCart | null = null;
                let hadFailure = false;
                let failureMessage: string | null = null;

                if (!currentCartId) {
                  const createPayload = linesToAdd.map((l) => ({
                    merchandiseId: l.merchandiseId,
                    quantity: l.quantity,
                  }));
                  const createdCart = await cartCreate(createPayload);

                  if (scheduledEpoch !== cartSessionEpoch) {
                    return;
                  }

                  const hasCreateErrors =
                    Array.isArray(createdCart?.userErrors) && createdCart.userErrors.length > 0;

                  if (createdCart && !hasCreateErrors) {
                    latestCart = createdCart;
                  } else if (linesToAdd.length > 1) {
                    hadFailure = true;
                    failureMessage =
                      createdCart?.userErrors?.[0]?.message ||
                      "Alcuni articoli non erano disponibili e non sono stati aggiunti.";

                    if (createdCart && createdCart.id && createdCart.lines.length > 0) {
                      latestCart = createdCart;
                    } else {
                      let fallbackCart: ShopifyCart | null = null;
                      for (const line of linesToAdd) {
                        if (scheduledEpoch !== cartSessionEpoch) return;
                        try {
                          if (!fallbackCart) {
                            const singleCreated = await cartCreate([
                              { merchandiseId: line.merchandiseId, quantity: line.quantity },
                            ]);
                            if (
                              singleCreated &&
                              (!singleCreated.userErrors || singleCreated.userErrors.length === 0) &&
                              singleCreated.lines.length > 0
                            ) {
                              fallbackCart = singleCreated;
                            } else if (singleCreated?.userErrors?.[0]?.message) {
                              failureMessage = singleCreated.userErrors[0].message;
                            }
                          } else {
                            const singleAdded = await cartLinesAdd(fallbackCart.id, [
                              { merchandiseId: line.merchandiseId, quantity: line.quantity },
                            ]);
                            if (
                              singleAdded &&
                              (!singleAdded.userErrors || singleAdded.userErrors.length === 0)
                            ) {
                              fallbackCart = singleAdded;
                            } else if (singleAdded?.userErrors?.[0]?.message) {
                              failureMessage = singleAdded.userErrors[0].message;
                            }
                          }
                        } catch {
                          // Continue trying remaining valid items in the batch
                        }
                      }
                      latestCart = fallbackCart;
                    }
                  } else {
                    hadFailure = true;
                    failureMessage =
                      createdCart?.userErrors?.[0]?.message ||
                      "Impossibile sincronizzare con Shopify";
                    if (createdCart && createdCart.lines.length > 0) {
                      latestCart = createdCart;
                    }
                  }
                } else {
                  let activeCartId = currentCartId;

                  if (linesToUpdate.length > 0) {
                    const updatedRes = await cartLinesUpdate(activeCartId, linesToUpdate);
                    if (scheduledEpoch !== cartSessionEpoch) return;

                    if (updatedRes) {
                      if (Array.isArray(updatedRes.userErrors) && updatedRes.userErrors.length > 0) {
                        hadFailure = true;
                        failureMessage =
                          updatedRes.userErrors[0]?.message ||
                          "Impossibile aggiornare la quantità richiesta.";
                      }
                      if (updatedRes.id) {
                        latestCart = updatedRes;
                        activeCartId = updatedRes.id;
                      }
                    } else {
                      hadFailure = true;
                      failureMessage = "Impossibile sincronizzare con Shopify";
                    }
                  }

                  if (linesToAdd.length > 0) {
                    const addPayload = linesToAdd.map((l) => ({
                      merchandiseId: l.merchandiseId,
                      quantity: l.quantity,
                    }));
                    const addedRes = await cartLinesAdd(activeCartId, addPayload);
                    if (scheduledEpoch !== cartSessionEpoch) return;

                    const hasAddErrors =
                      Array.isArray(addedRes?.userErrors) && addedRes.userErrors.length > 0;

                    if (addedRes && !hasAddErrors) {
                      latestCart = addedRes;
                    } else if (linesToAdd.length > 1) {
                      hadFailure = true;
                      failureMessage =
                        addedRes?.userErrors?.[0]?.message ||
                        "Alcuni articoli non erano disponibili e non sono stati aggiunti.";

                      if (addedRes && addedRes.lines.length > 0) {
                        const returnedMerchIds = new Set(
                          addedRes.lines.map((l) => l.merchandise?.id).filter(Boolean)
                        );
                        const missingLines = linesToAdd.filter(
                          (l) => !returnedMerchIds.has(l.merchandiseId)
                        );
                        latestCart = addedRes;

                        if (missingLines.length < linesToAdd.length) {
                          // Shopify already added the valid subset
                        } else {
                          for (const line of linesToAdd) {
                            if (scheduledEpoch !== cartSessionEpoch) return;
                            try {
                              const singleAdded = await cartLinesAdd(
                                latestCart?.id || activeCartId,
                                [{ merchandiseId: line.merchandiseId, quantity: line.quantity }]
                              );
                              if (
                                singleAdded &&
                                (!singleAdded.userErrors || singleAdded.userErrors.length === 0)
                              ) {
                                latestCart = singleAdded;
                              }
                            } catch {
                              // Continue adding remaining valid lines
                            }
                          }
                        }
                      } else {
                        for (const line of linesToAdd) {
                          if (scheduledEpoch !== cartSessionEpoch) return;
                          try {
                            const singleAdded = await cartLinesAdd(
                              latestCart?.id || activeCartId,
                              [{ merchandiseId: line.merchandiseId, quantity: line.quantity }]
                            );
                            if (
                              singleAdded &&
                              (!singleAdded.userErrors || singleAdded.userErrors.length === 0)
                            ) {
                              latestCart = singleAdded;
                            } else if (singleAdded?.userErrors?.[0]?.message) {
                              failureMessage = singleAdded.userErrors[0].message;
                            }
                          } catch {
                            // Continue adding remaining valid lines
                          }
                        }
                      }
                    } else {
                      hadFailure = true;
                      failureMessage =
                        addedRes?.userErrors?.[0]?.message ||
                        "Impossibile sincronizzare con Shopify";
                      if (addedRes && addedRes.lines.length > 0) {
                        latestCart = addedRes;
                      }
                    }
                  }
                }

                if (scheduledEpoch !== cartSessionEpoch) {
                  return;
                }

                if (latestCart) {
                  markKeysSettled(batchOpVersions.keys(), batchOpVersions);
                  hydrateCartFromShopify(latestCart, false, "addItem - success");
                  if (hadFailure && failureMessage) {
                    set({ error: failureMessage, isSyncing: hasUnsyncedItemOperations() });
                  }
                  const newCartId = latestCart.id;
                  if (
                    currentMode === "customer" &&
                    activeUserId &&
                    newCartId &&
                    previousCartId !== newCartId
                  ) {
                    try {
                      const { saveCustomerActiveCartIdAction } = await import(
                        "@/app/actions/cart-metafield"
                      );
                      await saveCustomerActiveCartIdAction(activeUserId, newCartId);
                    } catch (metaErr) {
                      console.error(
                        "Failed to persist new customer active cart ID metafield:",
                        metaErr
                      );
                    }
                  }
                } else {
                  rollbackKeysToConfirmed(
                    batchOpVersions.keys(),
                    batchOpVersions,
                    failureMessage || "Impossibile sincronizzare con Shopify"
                  );
                }
              } catch (err) {
                console.error("Cart API Sync failed:", err);
                if (scheduledEpoch === cartSessionEpoch) {
                  rollbackKeysToConfirmed(
                    batchOpVersions.keys(),
                    batchOpVersions,
                    "Impossibile sincronizzare con Shopify"
                  );
                }
              } finally {
                allResolvers.forEach((r) => r());
              }
            });
          }, 40);

          logActionExit("addItem");
          return completionPromise;
        },

        removeItem: async (identifier) => {
          const currentItems = get().items;
          const itemToRemove =
            findCartItemByIdentifier(currentItems, identifier) ||
            findCartItemByIdentifier(confirmedServerItems, identifier);

          if (itemToRemove) {
            trackRemoveFromCart(itemToRemove.product, itemToRemove.quantity);
          }

          const merchKey = itemToRemove
            ? getCanonicalMerchKey(itemToRemove.product)
            : identifier;

          const nextOpVer = (itemOpVersion.get(merchKey) || 0) + 1;
          itemOpVersion.set(merchKey, nextOpVer);
          const removeOpVersions = new Map<string, number>([[merchKey, nextOpVer]]);

          const keysToClear = new Set<string>([identifier, merchKey]);
          if (itemToRemove?.product.variantId) keysToClear.add(itemToRemove.product.variantId);
          if (itemToRemove?.product.id) keysToClear.add(itemToRemove.product.id);
          if (itemToRemove?.lineId) keysToClear.add(itemToRemove.lineId);

          keysToClear.forEach((key) => {
            if (debounceTimers[key]) {
              clearTimeout(debounceTimers[key]);
              delete debounceTimers[key];
            }
            if (debounceResolvers[key]) {
              debounceResolvers[key].forEach((r) => r());
              delete debounceResolvers[key];
            }
            if (pendingAddBatch.has(key)) {
              const pending = pendingAddBatch.get(key);
              pending?.resolvers.forEach((r) => r());
              pendingAddBatch.delete(key);
            }
          });

          const optimisticRemaining = currentItems.filter(
            (item) =>
              item !== itemToRemove &&
              getCanonicalMerchKey(item.product) !== merchKey &&
              getCartItemKey(item) !== identifier
          );
          set({ items: optimisticRemaining, isSyncing: true, error: null });

          const scheduledEpoch = cartSessionEpoch;

          return enqueueCartMutation(async () => {
            if (scheduledEpoch !== cartSessionEpoch) return;

            // If a newer local add/update happened on this item after removeItem was called, do not remove
            const latestVer = itemOpVersion.get(merchKey) || 0;
            const reAddedItem = findCartItemByIdentifier(get().items, merchKey);
            if (latestVer > nextOpVer && reAddedItem && reAddedItem.quantity > 0) {
              return;
            }

            const { cartId } = get();
            const confirmedItem =
              findCartItemByIdentifier(confirmedServerItems, merchKey) ||
              findCartItemByIdentifier(confirmedServerItems, identifier) ||
              itemToRemove;
            const targetLineId = confirmedItem?.lineId || itemToRemove?.lineId;

            if (cartId && targetLineId) {
              try {
                const updatedCart = await cartLinesRemove(cartId, [targetLineId]);
                if (scheduledEpoch !== cartSessionEpoch) return;

                if (updatedCart) {
                  const hasErrors =
                    Array.isArray(updatedCart.userErrors) && updatedCart.userErrors.length > 0;
                  markKeysSettled([merchKey], removeOpVersions);
                  hydrateCartFromShopify(updatedCart, false, "removeItem - success");
                  if (hasErrors) {
                    set({
                      isSyncing: hasUnsyncedItemOperations(),
                      error:
                        updatedCart.userErrors?.[0]?.message ||
                        "Impossibile rimuovere il prodotto dal carrello.",
                    });
                  }
                } else {
                  rollbackKeysToConfirmed(
                    [merchKey],
                    removeOpVersions,
                    "Impossibile rimuovere il prodotto dal carrello."
                  );
                }
              } catch (err) {
                console.error("Remove line item failed:", err);
                if (scheduledEpoch === cartSessionEpoch) {
                  rollbackKeysToConfirmed(
                    [merchKey],
                    removeOpVersions,
                    "Impossibile rimuovere il prodotto dal carrello."
                  );
                }
              }
            } else {
              markKeysSettled([merchKey], removeOpVersions);
              set({ isSyncing: hasUnsyncedItemOperations() });
            }
          });
        },

        updateQuantity: async (identifier, quantity) => {
          const currentItems = get().items;
          const initialItem = findCartItemByIdentifier(currentItems, identifier);
          const timerKey = initialItem ? getCartItemKey(initialItem) : identifier;

          if (quantity <= 0) {
            [identifier, timerKey].forEach((key) => {
              if (debounceTimers[key]) {
                clearTimeout(debounceTimers[key]);
                delete debounceTimers[key];
              }
              if (debounceResolvers[key]) {
                debounceResolvers[key].forEach((r) => r());
                delete debounceResolvers[key];
              }
            });
            return get().removeItem(identifier);
          }

          if (!initialItem) {
            return;
          }

          const merchKey = getCanonicalMerchKey(initialItem.product);
          const maxStock =
            typeof initialItem.product.stock === "number" &&
            Number.isFinite(initialItem.product.stock)
              ? Math.max(0, initialItem.product.stock)
              : null;
          const clampedOptimisticQty =
            maxStock !== null && maxStock > 0
              ? Math.min(Math.floor(quantity), maxStock)
              : Math.floor(quantity);

          const nextOpVer = (itemOpVersion.get(merchKey) || 0) + 1;
          itemOpVersion.set(merchKey, nextOpVer);

          const optimisticItems = currentItems.map((item) =>
            item === initialItem || getCanonicalMerchKey(item.product) === merchKey
              ? { ...item, quantity: clampedOptimisticQty }
              : item
          );
          set({ items: optimisticItems, isSyncing: true, error: null });

          if (debounceTimers[timerKey]) {
            clearTimeout(debounceTimers[timerKey]);
          }
          if (identifier !== timerKey && debounceTimers[identifier]) {
            clearTimeout(debounceTimers[identifier]);
            delete debounceTimers[identifier];
          }
          if (merchKey !== timerKey && debounceTimers[merchKey]) {
            clearTimeout(debounceTimers[merchKey]);
            delete debounceTimers[merchKey];
          }

          const scheduledEpoch = cartSessionEpoch;

          return new Promise<void>((resolve) => {
            if (!debounceResolvers[timerKey]) {
              debounceResolvers[timerKey] = [];
            }
            debounceResolvers[timerKey].push(resolve);

            debounceTimers[timerKey] = setTimeout(() => {
              delete debounceTimers[timerKey];
              const resolvers = debounceResolvers[timerKey] || [];
              delete debounceResolvers[timerKey];

              void enqueueCartMutation(async () => {
                const snapVer = itemOpVersion.get(merchKey) || nextOpVer;
                const updateOpVersions = new Map<string, number>([[merchKey, snapVer]]);
                try {
                  if (scheduledEpoch !== cartSessionEpoch) return;
                  const { cartId, items } = get();
                  const itemToUpdate =
                    findCartItemByIdentifier(items, merchKey) ||
                    findCartItemByIdentifier(items, timerKey) ||
                    findCartItemByIdentifier(items, identifier);

                  if (!itemToUpdate || itemToUpdate.quantity <= 0) {
                    markKeysSettled([merchKey], updateOpVersions);
                    set({ isSyncing: hasUnsyncedItemOperations() });
                    return;
                  }

                  const confirmedItem =
                    findCartItemByIdentifier(confirmedServerItems, merchKey) ||
                    findCartItemByIdentifier(confirmedServerItems, timerKey) ||
                    findCartItemByIdentifier(confirmedServerItems, identifier);

                  const itemMaxStock =
                    typeof itemToUpdate.product.stock === "number" &&
                    Number.isFinite(itemToUpdate.product.stock)
                      ? Math.max(0, itemToUpdate.product.stock)
                      : typeof confirmedItem?.product.stock === "number" &&
                        Number.isFinite(confirmedItem.product.stock)
                      ? Math.max(0, confirmedItem.product.stock)
                      : null;
                  const clampedQty =
                    itemMaxStock !== null && itemMaxStock > 0
                      ? Math.min(itemToUpdate.quantity, itemMaxStock)
                      : itemToUpdate.quantity;

                  const targetLineId = confirmedItem?.lineId || itemToUpdate.lineId;

                  if (cartId && targetLineId) {
                    if (confirmedItem && confirmedItem.quantity === clampedQty) {
                      markKeysSettled([merchKey], updateOpVersions);
                      set({ isSyncing: hasUnsyncedItemOperations() });
                      return;
                    }

                    try {
                      const updatedCart = await cartLinesUpdate(cartId, [
                        { id: targetLineId, quantity: clampedQty },
                      ]);
                      if (scheduledEpoch !== cartSessionEpoch) return;

                      if (updatedCart && updatedCart.id) {
                        const hasErrors =
                          Array.isArray(updatedCart.userErrors) &&
                          updatedCart.userErrors.length > 0;
                        markKeysSettled([merchKey], updateOpVersions);
                        hydrateCartFromShopify(updatedCart, false, "updateQuantity - success");
                        if (hasErrors) {
                          set({
                            isSyncing: hasUnsyncedItemOperations(),
                            error:
                              updatedCart.userErrors?.[0]?.message ||
                              "Quantità richiesta non disponibile.",
                          });
                        }
                      } else {
                        rollbackKeysToConfirmed(
                          [merchKey],
                          updateOpVersions,
                          updatedCart?.userErrors?.[0]?.message ||
                            "Impossibile aggiornare la quantità nel carrello."
                        );
                      }
                    } catch (err) {
                      console.error("Update line item quantity failed:", err);
                      if (scheduledEpoch === cartSessionEpoch) {
                        rollbackKeysToConfirmed(
                          [merchKey],
                          updateOpVersions,
                          "Impossibile aggiornare la quantità nel carrello."
                        );
                      }
                    }
                  } else if (!pendingAddBatch.has(merchKey)) {
                    // Item was added optimistically and not yet created on server
                    const shopifyMerchId =
                      formatMerchandiseId(itemToUpdate.product) || merchKey;
                    try {
                      const updatedCart = cartId
                        ? await cartLinesAdd(cartId, [
                            { merchandiseId: shopifyMerchId, quantity: clampedQty },
                          ])
                        : await cartCreate([
                            { merchandiseId: shopifyMerchId, quantity: clampedQty },
                          ]);
                      if (scheduledEpoch !== cartSessionEpoch) return;

                      if (updatedCart && updatedCart.id) {
                        const hasErrors =
                          Array.isArray(updatedCart.userErrors) &&
                          updatedCart.userErrors.length > 0;
                        markKeysSettled([merchKey], updateOpVersions);
                        hydrateCartFromShopify(
                          updatedCart,
                          false,
                          "updateQuantity (create/add fallback) - success"
                        );
                        if (hasErrors) {
                          set({
                            isSyncing: hasUnsyncedItemOperations(),
                            error:
                              updatedCart.userErrors?.[0]?.message ||
                              "Quantità richiesta non disponibile.",
                          });
                        }
                      } else {
                        rollbackKeysToConfirmed(
                          [merchKey],
                          updateOpVersions,
                          updatedCart?.userErrors?.[0]?.message ||
                            "Impossibile aggiornare la quantità nel carrello."
                        );
                      }
                    } catch (err) {
                      console.error("Update line item fallback add/create failed:", err);
                      if (scheduledEpoch === cartSessionEpoch) {
                        rollbackKeysToConfirmed(
                          [merchKey],
                          updateOpVersions,
                          "Impossibile aggiornare la quantità nel carrello."
                        );
                      }
                    }
                  } else {
                    set({ isSyncing: hasUnsyncedItemOperations() });
                  }
                } finally {
                  resolvers.forEach((r) => r());
                }
              });
            }, 350);
          });
        },

        applyDiscountCode: async (code: string) => {
          const cleanCode = (code || "").trim().toUpperCase();
          if (!cleanCode) {
            return {
              success: false,
              error: "Inserisci un codice promozionale valido.",
            };
          }

          const { cartId, items } = get();
          if (!cartId) {
            if (!items || items.length === 0) {
              set({
                discountCode: null,
                appliedDiscount: 0,
                isSyncing: false,
              });
              return {
                success: false,
                error: "Il carrello è vuoto. Aggiungi prodotti prima di applicare uno sconto.",
              };
            }
            return {
              success: false,
              error: "Carrello non ancora sincronizzato con Shopify. Riprova tra un istante.",
            };
          }

          const prevDiscountCode = get().discountCode;
          const prevAppliedDiscount = get().appliedDiscount;
          const prevShopifySubtotal = get().shopifySubtotal;
          const prevShopifyTotal = get().shopifyTotal;

          set({ isSyncing: true, error: null });

          try {
            const updatedCart = await cartDiscountCodesUpdate(cartId, [cleanCode]);

            if (!updatedCart) {
              set({
                isSyncing: false,
                discountCode: prevDiscountCode,
                appliedDiscount: prevAppliedDiscount,
                shopifySubtotal: prevShopifySubtotal,
                shopifyTotal: prevShopifyTotal,
              });
              return {
                success: false,
                error: "Impossibile verificare il codice promozionale con Shopify. Riprova.",
              };
            }

            if (Array.isArray(updatedCart.userErrors) && updatedCart.userErrors.length > 0) {
              const errorMessage =
                updatedCart.userErrors[0]?.message ||
                "Codice promozionale rifiutato da Shopify.";
              if (updatedCart.checkoutUrl || (Array.isArray(updatedCart.lines) && updatedCart.lines.length > 0)) {
                hydrateCartFromShopify(updatedCart, false, "applyDiscountCode - userErrors");
              } else {
                set({
                  isSyncing: false,
                  discountCode: null,
                  appliedDiscount: 0,
                  shopifyTotal: get().shopifySubtotal,
                });
              }
              return {
                success: false,
                error: errorMessage,
              };
            }

            const discountCodes = Array.isArray(updatedCart.discountCodes)
              ? updatedCart.discountCodes
              : [];
            const matchingDiscount = discountCodes.find(
              (d) =>
                d &&
                typeof d.code === "string" &&
                d.code.trim().toUpperCase() === cleanCode
            );

            const pricing = extractCartPricingFromShopify(updatedCart);

            if (!matchingDiscount || matchingDiscount.applicable !== true || pricing.appliedDiscount <= 0) {
              hydrateCartFromShopify(updatedCart, false, "applyDiscountCode - rejected/ineligible");
              return {
                success: false,
                error: "Codice promozionale non valido, scaduto o non applicabile a questo ordine.",
              };
            }

            hydrateCartFromShopify(updatedCart, false, "applyDiscountCode - accepted");
            return { success: true };
          } catch (err) {
            console.error("Discount code application failed:", err);
            set({
              isSyncing: false,
              discountCode: prevDiscountCode,
              appliedDiscount: prevAppliedDiscount,
              shopifySubtotal: prevShopifySubtotal,
              shopifyTotal: prevShopifyTotal,
            });
            return {
              success: false,
              error: "Errore di connessione a Shopify durante la verifica del codice sconto.",
            };
          }
        },

        removeDiscountCode: async () => {
          const { cartId } = get();
          if (!cartId) {
            set({
              discountCode: null,
              appliedDiscount: 0,
              shopifyTotal: get().shopifySubtotal,
              isSyncing: false,
            });
            return { success: true };
          }

          set({ isSyncing: true, error: null });
          try {
            const updatedCart = await cartDiscountCodesUpdate(cartId, []);
            if (!updatedCart) {
              set({ isSyncing: false });
              return {
                success: false,
                error: "Impossibile rimuovere il codice sconto in questo momento.",
              };
            }
            hydrateCartFromShopify(updatedCart, false, "removeDiscountCode - success");
            return { success: true };
          } catch (err) {
            console.error("Discount code removal failed:", err);
            set({ isSyncing: false });
            return {
              success: false,
              error: "Errore di connessione a Shopify durante la rimozione del codice sconto.",
            };
          }
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
              const guestApplicableCodes = (guestRemoteCart?.discountCodes || [])
                .filter((d) => d && d.applicable && d.code)
                .map((d) => d.code);
              const customerHasApplicableCode = (currentCart.discountCodes || []).some(
                (d) => d && d.applicable
              );
              if (guestApplicableCodes.length > 0 && !customerHasApplicableCode) {
                const discountRes = await cartDiscountCodesUpdate(currentCart.id, guestApplicableCodes);
                if (discountRes) currentCart = discountRes;
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

          confirmedServerItems = [];
          itemOpVersion.clear();
          syncedItemOpVersion.clear();

          set({
            cartId: null,
            checkoutUrl: null,
            items: [],
            discountCode: null,
            appliedDiscount: 0,
            shopifySubtotal: null,
            shopifyTotal: null,
            shopifyTax: null,
            isSyncing: false,
          });
          logActionExit("switchToGuestMode");
        },

        clearCart: () => {
          logActionEnter("clearCart");
          cartSessionEpoch += 1;
          const currentMode = get().mode;
          const activeUserId = get().activeUserId;

          confirmedServerItems = [];
          itemOpVersion.clear();
          syncedItemOpVersion.clear();

          if (addBatchTimer) {
            clearTimeout(addBatchTimer);
            addBatchTimer = null;
          }
          pendingAddBatch.forEach((entry) => {
            entry.resolvers.forEach((r) => r());
          });
          pendingAddBatch.clear();

          // Clear any pending debounced mutation timers
          Object.keys(debounceTimers).forEach((key) => {
            if (debounceTimers[key]) {
              clearTimeout(debounceTimers[key]);
              delete debounceTimers[key];
            }
          });
          Object.keys(debounceResolvers).forEach((key) => {
            if (debounceResolvers[key]) {
              debounceResolvers[key].forEach((r) => r());
              delete debounceResolvers[key];
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
            shopifySubtotal: null,
            shopifyTotal: null,
            shopifyTax: null,
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
export const selectCartSubtotal = (state: CartState) => {
  if (!state.items || state.items.length === 0) return 0;
  if (
    !state.isSyncing &&
    typeof state.shopifySubtotal === "number" &&
    Number.isFinite(state.shopifySubtotal) &&
    state.shopifySubtotal > 0
  ) {
    return Number(state.shopifySubtotal.toFixed(2));
  }
  return Number(
    state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)
  );
};
export const selectCartDiscount = (state: CartState) => {
  if (!state.discountCode || typeof state.appliedDiscount !== "number" || state.appliedDiscount <= 0) {
    return 0;
  }
  const subtotal = selectCartSubtotal(state);
  if (subtotal <= 0) return 0;
  return Number(Math.min(subtotal, state.appliedDiscount).toFixed(2));
};
export const selectCartTotal = (state: CartState) => {
  const subtotal = selectCartSubtotal(state);
  if (subtotal <= 0) return 0;
  const discount = selectCartDiscount(state);
  if (discount <= 0 || !state.discountCode) {
    return subtotal;
  }
  if (
    !state.isSyncing &&
    typeof state.shopifyTotal === "number" &&
    Number.isFinite(state.shopifyTotal) &&
    state.shopifyTotal >= 0 &&
    state.shopifyTotal <= subtotal
  ) {
    return Number(state.shopifyTotal.toFixed(2));
  }
  return Number(Math.max(0, subtotal - discount).toFixed(2));
};
export const selectProductCartQuantity = (identifier: string) => (state: CartState) =>
  findCartItemByIdentifier(state.items, identifier)?.quantity || 0;

export const getSavedItemKey = (item: CartItem): string =>
  item.product.variantId || item.product.id;

export const saveCartItemForLater = (
  activeItems: CartItem[],
  savedItems: CartItem[],
  identifier: string
): { itemToMove: CartItem | null; updatedSavedItems: CartItem[] } => {
  const itemToMove = findCartItemByIdentifier(activeItems, identifier);
  if (!itemToMove) {
    return { itemToMove: null, updatedSavedItems: savedItems };
  }
  const targetKey = getSavedItemKey(itemToMove);
  const filtered = savedItems.filter((item) => getSavedItemKey(item) !== targetKey);
  const preservedItem: CartItem = {
    ...itemToMove,
    product: {
      ...itemToMove.product,
      variantId: itemToMove.product.variantId,
      variants: itemToMove.product.variants ? [...itemToMove.product.variants] : undefined,
    },
  };
  return {
    itemToMove: preservedItem,
    updatedSavedItems: [...filtered, preservedItem],
  };
};

export const removeSavedCartItem = (
  savedItems: CartItem[],
  identifier: string
): CartItem[] => {
  const target = findCartItemByIdentifier(savedItems, identifier);
  if (!target) {
    return savedItems.filter(
      (item) => item.product.variantId !== identifier && item.product.id !== identifier
    );
  }
  const targetKey = getSavedItemKey(target);
  return savedItems.filter((item) => getSavedItemKey(item) !== targetKey);
};

export const restoreSavedCartItem = (
  savedItems: CartItem[],
  identifier: string,
  locale: string = "it"
): {
  canRestore: boolean;
  itemToRestore: CartItem | null;
  restoreQuantity: number;
  updatedSavedItems: CartItem[];
  error?: string;
} => {
  const itemToRestore = findCartItemByIdentifier(savedItems, identifier);
  if (!itemToRestore) {
    return {
      canRestore: false,
      itemToRestore: null,
      restoreQuantity: 0,
      updatedSavedItems: savedItems,
      error:
        locale === "it"
          ? "Articolo salvato non trovato."
          : "Saved item not found.",
    };
  }

  const product = itemToRestore.product;
  const variantRecord = product.variants?.find(
    (v) => v.id === (product.variantId || identifier)
  );

  const isUnavailable =
    product.available === false ||
    variantRecord?.available === false ||
    (typeof product.stock === "number" && product.stock <= 0) ||
    (typeof variantRecord?.stock === "number" && variantRecord.stock <= 0) ||
    Boolean(
      product.variants &&
        product.variants.length > 0 &&
        product.variantId &&
        !variantRecord
    );

  if (isUnavailable) {
    const label = product.unit ? `${product.name} (${product.unit})` : product.name;
    return {
      canRestore: false,
      itemToRestore,
      restoreQuantity: 0,
      updatedSavedItems: savedItems,
      error:
        locale === "it"
          ? `La variante selezionata "${label}" non è più disponibile e non può essere ripristinata nel carrello.`
          : `The selected variant "${label}" is no longer available and cannot be restored to your cart.`,
    };
  }

  const knownStock =
    typeof product.stock === "number" && Number.isFinite(product.stock)
      ? Math.max(0, product.stock)
      : typeof variantRecord?.stock === "number" &&
        Number.isFinite(variantRecord.stock)
      ? Math.max(0, variantRecord.stock)
      : null;

  const restoreQuantity =
    knownStock !== null
      ? Math.min(Math.max(1, itemToRestore.quantity), knownStock)
      : Math.max(1, itemToRestore.quantity);

  const targetKey = getSavedItemKey(itemToRestore);
  const updatedSavedItems = savedItems.filter(
    (item) => getSavedItemKey(item) !== targetKey
  );

  return {
    canRestore: true,
    itemToRestore,
    restoreQuantity,
    updatedSavedItems,
  };
};

export const prepareOrderLineItemsForReorder = (
  lineItems: ShopifyOrderLineItem[],
  locale: string = "it"
): {
  restorableProducts: Array<{ product: Product; quantity: number }>;
  skippedItems: Array<{ title: string; reason: string }>;
  warningMessage: string | null;
} => {
  const restorableProducts: Array<{ product: Product; quantity: number }> = [];
  const skippedItems: Array<{ title: string; reason: string }> = [];

  for (const item of lineItems || []) {
    const itemLabel = item.variantTitle
      ? `${item.title} (${item.variantTitle})`
      : item.title || "Prodotto";

    const hasValidVariantId =
      typeof item.variantId === "string" &&
      item.variantId.trim().startsWith("gid://shopify/ProductVariant/");

    const isAvailable =
      hasValidVariantId &&
      item.available !== false &&
      (typeof item.stock !== "number" || item.stock > 0);

    if (!isAvailable) {
      skippedItems.push({
        title: itemLabel,
        reason: !hasValidVariantId
          ? locale === "it"
            ? "Variante non più esistente"
            : "Variant no longer exists"
          : locale === "it"
          ? "Esaurito / Non disponibile"
          : "Out of stock / Unavailable",
      });
      continue;
    }

    const numericStock =
      typeof item.stock === "number" && Number.isFinite(item.stock)
        ? Math.max(0, item.stock)
        : null;
    const requestedQty =
      typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
    const clampedQty =
      numericStock !== null ? Math.min(requestedQty, numericStock) : requestedQty;

    if (clampedQty <= 0) {
      skippedItems.push({
        title: itemLabel,
        reason: locale === "it" ? "Esaurito" : "Out of stock",
      });
      continue;
    }

    const parsedPrice = parseFloat(item.price?.amount || "0");
    const safePrice = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

    restorableProducts.push({
      product: {
        id: item.productId || item.variantId!,
        variantId: item.variantId!,
        handle: item.productHandle,
        name: item.title,
        price: safePrice,
        unit: item.variantTitle || "",
        imageUrl:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
        category: "Alimentari",
        description: "",
        tags: [],
        available: true,
        stock: numericStock,
      },
      quantity: clampedQty,
    });
  }

  let warningMessage: string | null = null;
  if (skippedItems.length > 0) {
    const names = skippedItems.map((s) => s.title).join(", ");
    if (restorableProducts.length === 0) {
      warningMessage =
        locale === "it"
          ? `Impossibile riordinare: le varianti selezionate non sono più disponibili (${names}).`
          : `Unable to reorder: the selected variants are no longer available (${names}).`;
    } else {
      warningMessage =
        locale === "it"
          ? `Alcune varianti non sono più disponibili e non sono state aggiunte al carrello: ${names}.`
          : `Some variants are no longer available and were not added to your cart: ${names}.`;
    }
  }

  return {
    restorableProducts,
    skippedItems,
    warningMessage,
  };
};
