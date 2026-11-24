/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shopify Headless Storefront Client - Alimentari
 * Designed for Next.js App Router & Shopify Storefront API.
 * 
 * Configured via environment variables:
 * - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN / SHOPIFY_STORE_DOMAIN
 * - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN / SHOPIFY_STOREFRONT_ACCESS_TOKEN
 */

import { Product, ProductVariant } from "./data";

function getShopifyConfig() {
  const domain =
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    "alimentari-store-lshog1qx.myshopify.com";

  const accessToken =
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";
  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

  return { domain, accessToken, endpoint, isConfigured: !!(domain && accessToken) };
}


const isConfigured = getShopifyConfig().isConfigured;


export class ShopifyNetworkError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = "ShopifyNetworkError";
  }
}

export function isInventoryOrDynamicShopifyQuery(query: string): boolean {
  const normalized = query || "";
  if (
    normalized.includes("cartCreate") ||
    normalized.includes("cartLines") ||
    normalized.includes("cartBuyerIdentity") ||
    normalized.includes("cartDiscount") ||
    normalized.includes("cartNote") ||
    normalized.includes("cartAttributes") ||
    normalized.includes("getCart")
  ) {
    return true;
  }
  if (
    normalized.includes("customerAccessToken") ||
    normalized.includes("customerCreate") ||
    normalized.includes("customerRecover") ||
    normalized.includes("customerReset") ||
    normalized.includes("customerAddress") ||
    normalized.includes("customerDefaultAddress") ||
    normalized.includes("customerUpdate") ||
    normalized.includes("getCustomer")
  ) {
    return true;
  }
  if (
    normalized.includes("quantityAvailable") ||
    normalized.includes("availableForSale") ||
    normalized.includes("GetProductByHandle") ||
    normalized.includes("GetProductInventoryByHandle") ||
    normalized.includes("GetProducts") ||
    normalized.includes("GetCollectionProducts") ||
    normalized.includes("GetProductRecommendations") ||
    normalized.includes("SearchProducts") ||
    normalized.includes("SearchProductByTerm")
  ) {
    return true;
  }
  return false;
}

// GraphQL Fetch Helper
export async function shopifyFetch<T>(
  query: string,
  variables = {},
  options: RequestInit = {}
): Promise<{ data: T; errors?: any[] } | null> {
  const { accessToken, endpoint, isConfigured } = getShopifyConfig();
  if (!isConfigured || !accessToken) {
    console.error("[ShopifyFetch] Missing required environment variable: NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN.");
    return null;
  }
  try {
    const isServer = typeof window === "undefined";
    const optionsWithNext = options as RequestInit & {
      next?: { revalidate?: number | false; tags?: string[] };
    };
    const callerRequestedNoStore =
      options.cache === "no-store" ||
      options.cache === "no-cache" ||
      optionsWithNext.next?.revalidate === 0;
    const callerProvidedExplicitCache =
      options.cache !== undefined || optionsWithNext.next !== undefined;

    const shouldBypassCache =
      callerRequestedNoStore ||
      (!callerProvidedExplicitCache && isInventoryOrDynamicShopifyQuery(query));

    const { next: callerNext, ...restOptions } = optionsWithNext;

    const fetchOptions: RequestInit & {
      next?: { revalidate?: number | false; tags?: string[] };
    } = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      ...restOptions,
      cache: shouldBypassCache ? "no-store" : (restOptions.cache ?? "default"),
      ...(!shouldBypassCache && isServer
        ? { next: callerNext ?? { revalidate: 900 } }
        : !shouldBypassCache && callerNext
        ? { next: callerNext }
        : {}),
    };
    const res = await fetch(endpoint, fetchOptions);


    if (!res.ok) {
      console.error("Shopify Storefront HTTP error:", res.statusText);
      throw new ShopifyNetworkError(`Shopify Storefront HTTP error ${res.status}: ${res.statusText}`);
    }
    const responseText = await res.text();
    let jsonResponse: any = null;
    try {
      jsonResponse = JSON.parse(responseText);
      if (process.env.NODE_ENV === "development") {
        console.log('PARSED_JSON_RESPONSE', jsonResponse);
      }
    } catch (parseErr) {
      console.error('JSON_PARSE_ERROR', parseErr);
      throw new ShopifyNetworkError("Failed to parse Shopify JSON response", parseErr);
    }

    return jsonResponse;

  } catch (err) {
    console.error("Shopify Storefront Fetch error:", err);
    if (err instanceof ShopifyNetworkError) {
      throw err;
    }
    throw new ShopifyNetworkError("Network or fetch exception during Shopify GraphQL call", err);
  }
}

export function cleanVariantUnitTitle(title?: string | null): string {
  if (!title || typeof title !== "string") return "";
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();
  if (
    !trimmed ||
    lower === "default title" ||
    lower === "default" ||
    lower === "title" ||
    lower.startsWith("default title")
  ) {
    return "";
  }
  return trimmed;
}

export function isProductVariantAvailable(
  variant: ProductVariant | null | undefined,
  fallbackProductAvailable?: boolean
): boolean {
  if (!variant) return false;
  if (variant.available === false) return false;
  if (typeof variant.stock === "number" && variant.stock <= 0) return false;
  if (variant.available === true) return true;
  if (typeof variant.stock === "number") return variant.stock > 0;
  return fallbackProductAvailable !== false;
}

export function getDefaultProductVariant(
  variants: ProductVariant[] | undefined,
  fallbackProductAvailable?: boolean
): ProductVariant | null {
  if (!variants || variants.length === 0) return null;
  const firstAvailable = variants.find((v) =>
    isProductVariantAvailable(v, fallbackProductAvailable)
  );
  return firstAvailable || variants[0] || null;
}

export function getInitialProductOptions(product: Product): Record<string, string> {
  const opts: Record<string, string> = {};
  const defaultVariant = getDefaultProductVariant(product.variants, product.available);
  if (defaultVariant && defaultVariant.selectedOptions.length > 0) {
    defaultVariant.selectedOptions.forEach((o) => {
      opts[o.name] = o.value;
    });
  } else if (product.options && product.options.length > 0) {
    product.options.forEach((opt) => {
      if (opt.values && opt.values.length > 0) {
        opts[opt.name] = opt.values[0];
      }
    });
  }
  return opts;
}

export interface ResolvedVariantState {
  currentVariant: ProductVariant | null;
  isUnmatchedCombination: boolean;
  displayPrice: number;
  displayComparePrice: number | undefined;
  displaySku: string | undefined;
  displayStock: number | null;
  isAvailable: boolean;
  maxStock: number | undefined;
  selectedVariantId: string | undefined;
  displayUnit: string;
}

export function resolveSelectedVariantState(
  product: Product,
  selectedOptionsState: Record<string, string>
): ResolvedVariantState {
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const selectedKeys = Object.keys(selectedOptionsState || {});

  let currentVariant: ProductVariant | null = null;
  let isUnmatchedCombination = false;

  if (hasVariants && product.variants) {
    if (selectedKeys.length === 0) {
      const singleNoOptionsVariant =
        product.variants.length === 1 && product.variants[0].selectedOptions.length === 0
          ? product.variants[0]
          : null;
      currentVariant =
        singleNoOptionsVariant ||
        getDefaultProductVariant(product.variants, product.available);
    } else {
      const matched = product.variants.find(
        (v) =>
          v.selectedOptions.length > 0 &&
          v.selectedOptions.every((o) => selectedOptionsState[o.name] === o.value) &&
          selectedKeys.every((key) =>
            v.selectedOptions.some((o) => o.name === key && o.value === selectedOptionsState[key])
          )
      );
      if (matched) {
        currentVariant = matched;
      } else {
        currentVariant = null;
        isUnmatchedCombination = true;
      }
    }
  }

  if (isUnmatchedCombination) {
    const selectedOptionValues = selectedKeys
      .map((k) => selectedOptionsState[k])
      .filter(Boolean)
      .join(" / ");
    return {
      currentVariant: null,
      isUnmatchedCombination: true,
      displayPrice: product.price,
      displayComparePrice: undefined,
      displaySku: undefined,
      displayStock: null,
      isAvailable: false,
      maxStock: undefined,
      selectedVariantId: undefined,
      displayUnit: selectedOptionValues || product.unit || "",
    };
  }

  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayComparePrice = currentVariant
    ? currentVariant.originalPrice
    : product.originalPrice;
  const displaySku = currentVariant ? currentVariant.sku : product.sku;
  const displayStock: number | null = currentVariant
    ? currentVariant.stock
    : product.stock ?? null;

  const isAvailable = currentVariant
    ? isProductVariantAvailable(currentVariant, product.available)
    : product.available === false
    ? false
    : typeof product.stock === "number" && product.stock <= 0
    ? false
    : product.available === true
    ? true
    : typeof product.stock === "number"
    ? product.stock > 0
    : true;

  const maxStock =
    typeof displayStock === "number" && displayStock > 0 ? displayStock : undefined;
  const selectedVariantId = currentVariant
    ? currentVariant.id
    : !hasVariants
    ? product.variantId || undefined
    : undefined;

  const variantUnit = currentVariant ? cleanVariantUnitTitle(currentVariant.title) : "";
  const displayUnit = variantUnit || cleanVariantUnitTitle(product.unit);

  return {
    currentVariant,
    isUnmatchedCombination: false,
    displayPrice,
    displayComparePrice,
    displaySku,
    displayStock,
    isAvailable,
    maxStock,
    selectedVariantId,
    displayUnit,
  };
}

export function buildProductJsonLd(product: Product, handle: string) {
  const defaultVariant = getDefaultProductVariant(product.variants, product.available);
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const isPurchasable = hasVariants
    ? isProductVariantAvailable(defaultVariant, product.available)
    : product.available === false
    ? false
    : typeof product.stock === "number" && product.stock <= 0
    ? false
    : product.available === true
    ? true
    : typeof product.stock === "number"
    ? product.stock > 0
    : true;

  const offerPrice = defaultVariant ? defaultVariant.price : product.price;
  const offerSku =
    (defaultVariant?.sku && defaultVariant.sku.trim()) ||
    (product.sku && product.sku.trim()) ||
    `AL-${product.id}`;

  const resolvedAvailability = isPurchasable
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const hasValidOfferPrice = Number.isFinite(offerPrice) && offerPrice > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: defaultVariant?.image?.url || product.imageUrl,
    description:
      product.description ||
      `Acquista ${product.name} su 081 Food & Beverage — Eccellenze Napoletane.`,
    sku: offerSku,
    brand: {
      "@type": "Brand",
      name: product.brand || "081 Food & Beverage",
    },
    ...(hasValidOfferPrice
      ? {
          offers: {
            "@type": "Offer",
            url: `https://alimentari.it/prodotto/${handle}`,
            priceCurrency: "EUR",
            price: offerPrice,
            sku: offerSku,
            itemCondition: "https://schema.org/NewCondition",
            availability: resolvedAvailability,
          },
        }
      : {}),
  };
}

/// Convert a Shopify GraphQL Product Node into our clean local Product shape
export function mapShopifyToLocalProduct(node: any): Product {
  const minPrice = parseFloat(node.priceRange?.minVariantPrice?.amount || "0");
  const minComparePrice = node.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
    : undefined;

  // Extract custom unit or brand metafields, falling back to tags
  const brand = node.vendor || "Alimentari Artigiani";

  // Map images
  const images =
    node.images?.nodes?.map((img: any) => ({
      url: img.url,
      altText: img.altText || undefined,
    })) || [];

  // Map options
  const options =
    node.options?.map((opt: any) => ({
      name: opt.name,
      values: opt.values,
    })) || [];

  // Map variants
  const variants: ProductVariant[] =
    node.variants?.nodes?.map((v: any) => {
      const hasExplicitVariantPrice =
        v.price?.amount !== undefined && v.price?.amount !== null && v.price?.amount !== "";
      const vPrice = hasExplicitVariantPrice
        ? parseFloat(v.price.amount)
        : parseFloat(v.priceRange?.minVariantPrice?.amount || String(minPrice));
      const vComparePrice = v.compareAtPrice?.amount
        ? parseFloat(v.compareAtPrice.amount)
        : undefined;
      const vStock =
        typeof v.quantityAvailable === "number" && Number.isFinite(v.quantityAvailable)
          ? v.quantityAvailable
          : null;
      const vAvailable =
        typeof v.availableForSale === "boolean" ? v.availableForSale : undefined;
      return {
        id: v.id,
        title: v.title || "",
        sku: v.sku || "",
        price: Number.isFinite(vPrice) ? vPrice : 0,
        originalPrice:
          vComparePrice && Number.isFinite(vComparePrice) && vComparePrice > vPrice
            ? vComparePrice
            : undefined,
        stock: vStock,
        available: vAvailable,
        selectedOptions:
          v.selectedOptions?.map((o: any) => ({
            name: o.name,
            value: o.value,
          })) || [],
        image: v.image
          ? { url: v.image.url, altText: v.image.altText || undefined }
          : undefined,
      };
    }) || [];

  // Map metafields safely without fake defaults
  const ratingVal = node.rating?.value ? parseFloat(node.rating.value) : undefined;
  const originVal = node.origin?.value || undefined;
  const ingredientsVal = node.ingredients?.value || undefined;

  const caloriesVal = node.calories?.value || undefined;
  const fatVal = node.fat?.value || undefined;
  const carbsVal = node.carbs?.value || undefined;
  const proteinVal = node.protein?.value || undefined;
  const sodiumVal = node.sodium?.value || undefined;

  const nutrition =
    caloriesVal || fatVal || carbsVal || proteinVal || sodiumVal
      ? {
          calories: caloriesVal || "N/A",
          fat: fatVal || "N/A",
          carbs: carbsVal || "N/A",
          protein: proteinVal || "N/A",
          sodium: sodiumVal || "N/A",
        }
      : undefined;

  const defaultVariant = getDefaultProductVariant(variants, node.availableForSale);
  const defaultVariantIsAvailable = defaultVariant
    ? isProductVariantAvailable(defaultVariant, node.availableForSale)
    : false;

  const resolvedPrice = defaultVariant ? defaultVariant.price : minPrice;
  const resolvedOriginalPrice = defaultVariant
    ? defaultVariant.originalPrice
    : minComparePrice && minComparePrice > minPrice
    ? minComparePrice
    : undefined;
  const resolvedUnit = defaultVariant ? cleanVariantUnitTitle(defaultVariant.title) : "";
  const resolvedStock: number | null = defaultVariant ? defaultVariant.stock : null;
  const resolvedSku =
    defaultVariant?.sku ||
    (node.handle ? `AL-${String(node.handle).toUpperCase()}` : "");

  // Authoritative availability for the mapped default variant:
  // If variants were returned, top-level `available` must reflect whether `defaultVariant`
  // itself is purchasable (and never true if `node.availableForSale === false` or if all
  // returned variants in the subset are unavailable).
  const productAvailable: boolean | undefined =
    node.availableForSale === false
      ? false
      : defaultVariant
      ? defaultVariantIsAvailable
      : typeof node.availableForSale === "boolean"
      ? node.availableForSale
      : undefined;

  const resolvedImageUrl =
    defaultVariant?.image?.url ||
    node.featuredImage?.url ||
    node.images?.nodes?.[0]?.url ||
    "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";

  return {
    id: node.id,
    variantId: defaultVariant?.id || undefined,
    handle: node.handle || undefined,
    name: node.title,
    price: resolvedPrice,
    originalPrice: resolvedOriginalPrice,
    unit: resolvedUnit,
    imageUrl: resolvedImageUrl,
    category: node.collections?.nodes?.[0]?.title || "",
    rating: ratingVal,
    tags: node.tags || [],
    isOrganic:
      node.tags?.includes("Bio") || node.title?.toLowerCase().includes("bio") || false,
    brand: brand,
    dietary: node.tags?.includes("Gluten Free")
      ? "Gluten Free"
      : node.tags?.includes("Vegan")
      ? "Vegan"
      : undefined,
    stock: resolvedStock,
    available: productAvailable,
    sku: resolvedSku,
    origin: originVal,
    description: node.description || "",
    descriptionHtml: node.descriptionHtml || undefined,
    ingredients: ingredientsVal,
    nutrition: nutrition,
    images: images.length > 0 ? images : undefined,
    variants: variants.length > 0 ? variants : undefined,
    options: options.length > 0 ? options : undefined,
  };
}

// Convert product item to dynamic URL handle helper
export function getProductHandle(product: Product): string {
  if (product.handle) return product.handle;
  return product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface VariantInventorySnapshot {
  id: string;
  available?: boolean;
  stock: number | null;
}

export interface ProductInventorySnapshot {
  productId: string;
  handle: string;
  available?: boolean;
  variants: VariantInventorySnapshot[];
}

function areVariantArraysInventoryEqual(
  prevVariants?: ProductVariant[],
  nextVariants?: ProductVariant[]
): boolean {
  if (prevVariants === nextVariants) return true;
  if (!prevVariants || !nextVariants) return false;
  if (prevVariants.length !== nextVariants.length) return false;
  for (let i = 0; i < prevVariants.length; i++) {
    const a = prevVariants[i];
    const b = nextVariants[i];
    if (
      a.id !== b.id ||
      a.stock !== b.stock ||
      a.available !== b.available ||
      a.price !== b.price ||
      a.originalPrice !== b.originalPrice
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Safely merges fresh inventory data (from `getProductInventoryByHandle` or a fresh `Product`)
 * into an existing `Product` without mutating prices, variant IDs, titles, or active option structures.
 * Returns the exact same `product` reference if no stock or availability values changed.
 */
export function mergeProductInventory(
  product: Product,
  freshSource: ProductInventorySnapshot | Product | null | undefined
): Product {
  if (!freshSource) return product;

  const isSnapshot = "productId" in freshSource;
  const sourceId = isSnapshot ? freshSource.productId : freshSource.id;
  if (sourceId && product.id && sourceId !== product.id) {
    return product;
  }

  const freshProductAvailable = freshSource.available;
  const sourceVariants: VariantInventorySnapshot[] = isSnapshot
    ? freshSource.variants
    : (freshSource.variants || []).map((v) => ({
        id: v.id,
        available: v.available,
        stock: v.stock,
      }));

  let variantsChanged = false;
  let updatedVariants = product.variants;

  if (product.variants && product.variants.length > 0 && sourceVariants.length > 0) {
    const byId = new Map<string, VariantInventorySnapshot>();
    sourceVariants.forEach((sv) => {
      if (sv.id) byId.set(sv.id, sv);
    });

    const nextVariants = product.variants.map((v) => {
      const freshVar = byId.get(v.id);
      if (!freshVar) return v;
      const nextStock = freshVar.stock;
      const nextAvailable =
        freshVar.available !== undefined ? freshVar.available : v.available;
      if (v.stock === nextStock && v.available === nextAvailable) {
        return v;
      }
      variantsChanged = true;
      return {
        ...v,
        stock: nextStock,
        available: nextAvailable,
      };
    });

    if (variantsChanged) {
      updatedVariants = nextVariants;
    }
  }

  const defaultVariant = getDefaultProductVariant(
    updatedVariants,
    freshProductAvailable !== undefined ? freshProductAvailable : product.available
  );
  const defaultVariantIsAvailable = defaultVariant
    ? isProductVariantAvailable(
        defaultVariant,
        freshProductAvailable !== undefined ? freshProductAvailable : product.available
      )
    : false;

  const nextStock: number | null = defaultVariant
    ? defaultVariant.stock
    : ! isSnapshot && "stock" in freshSource && freshSource.stock !== undefined
    ? freshSource.stock
    : product.stock ?? null;

  const nextAvailable: boolean | undefined =
    freshProductAvailable === false
      ? false
      : defaultVariant
      ? defaultVariantIsAvailable
      : freshProductAvailable !== undefined
      ? freshProductAvailable
      : product.available;

  const nextVariantId = defaultVariant?.id || product.variantId;
  const nextPrice = defaultVariant ? defaultVariant.price : product.price;
  const nextOriginalPrice = defaultVariant
    ? defaultVariant.originalPrice
    : product.originalPrice;
  const nextUnit = defaultVariant
    ? cleanVariantUnitTitle(defaultVariant.title)
    : product.unit;
  const nextSku = defaultVariant?.sku || product.sku;

  if (
    !variantsChanged &&
    product.stock === nextStock &&
    product.available === nextAvailable &&
    product.variantId === nextVariantId &&
    product.price === nextPrice &&
    product.originalPrice === nextOriginalPrice &&
    product.unit === nextUnit &&
    product.sku === nextSku
  ) {
    return product;
  }

  return {
    ...product,
    variantId: nextVariantId,
    price: nextPrice,
    originalPrice: nextOriginalPrice,
    unit: nextUnit,
    sku: nextSku,
    stock: nextStock,
    available: nextAvailable,
    variants: updatedVariants,
  };
}

/**
 * Synchronizes a product array with fresh products from Shopify while preserving object references
 * for unchanged items (and returning `currentProducts` unchanged if nothing changed) so React
 * components and memoized `ProductCard` instances do not re-render unnecessarily.
 */
export function synchronizeProductsList(
  currentProducts: Product[],
  freshProducts: Product[]
): Product[] {
  if (currentProducts === freshProducts) return currentProducts;
  if (!freshProducts) return currentProducts;
  if (currentProducts.length !== freshProducts.length) return freshProducts;

  let anyChanged = false;
  const merged = freshProducts.map((freshProd, idx) => {
    const prevProd = currentProducts[idx];
    if (
      prevProd &&
      prevProd.id === freshProd.id &&
      prevProd.variantId === freshProd.variantId &&
      prevProd.price === freshProd.price &&
      prevProd.originalPrice === freshProd.originalPrice &&
      prevProd.unit === freshProd.unit &&
      prevProd.name === freshProd.name &&
      prevProd.imageUrl === freshProd.imageUrl &&
      prevProd.stock === freshProd.stock &&
      prevProd.available === freshProd.available &&
      areVariantArraysInventoryEqual(prevProd.variants, freshProd.variants)
    ) {
      return prevProd;
    }
    anyChanged = true;
    return freshProd;
  });

  return anyChanged ? merged : currentProducts;
}

// --- SHOPIFY STOREFRONT API IMPLEMENTATIONS ---

const LISTING_VARIANT_FIELDS = `
  variants(first: 10) {
    nodes {
      id
      title
      sku
      availableForSale
      quantityAvailable
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      selectedOptions { name value }
      image { url altText }
    }
  }
`;

// 1. Fetch products list (simple backward-compatible array return)
export async function getProducts(first = 12, locale?: string): Promise<Product[]> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query GetProducts($first: Int!) ${langDirective} {
      products(first: $first) {
        nodes {
          id
          title
          handle
          description
          vendor
          tags
          availableForSale
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            nodes { url altText }
          }
          ${LISTING_VARIANT_FIELDS}
          collections(first: 1) {
            nodes { title }
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ products: { nodes: any[] } }>(
    query,
    { first },
    { cache: "no-store" }
  );
  if (response?.data?.products?.nodes) {
    return response.data.products.nodes.map(mapShopifyToLocalProduct);
  }

  // Return empty array when Shopify returns no products
  return [];
}

export interface GetProductsWithPaginationOptions {
  first?: number;
  after?: string;
  sortKey?: string;
  reverse?: boolean;
  locale?: string;
}

// 1b. Fetch products list with cursor pagination and sorting (options pattern)
export async function getProductsWithPagination({
  first = 12,
  after,
  sortKey,
  reverse,
  locale,
}: GetProductsWithPaginationOptions = {}): Promise<CollectionProductsResult> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query GetProductsWithPagination(
      $first: Int!,
      $after: String,
      $sortKey: ProductSortKeys,
      $reverse: Boolean
    ) ${langDirective} {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          handle
          description
          vendor
          tags
          availableForSale
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            nodes { url altText }
          }
          ${LISTING_VARIANT_FIELDS}
          collections(first: 1) {
            nodes { title }
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{
    products: {
      nodes: any[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  }>(query, { first, after, sortKey, reverse }, { cache: "no-store" });

  if (response?.data?.products) {
    const productsData = response.data.products;
    return {
      products: productsData.nodes.map(mapShopifyToLocalProduct),
      pageInfo: {
        hasNextPage: productsData.pageInfo?.hasNextPage || false,
        endCursor: productsData.pageInfo?.endCursor || null,
      },
    };
  }

  // Return empty pagination result when Shopify returns no products
  return {
    products: [],
    pageInfo: {
      hasNextPage: false,
      endCursor: null,
    },
  };
}

export interface ProductSeoMetadata {
  id: string;
  name: string;
  handle: string;
  description: string;
  imageUrl: string;
}

/**
 * Fetches slow-changing SEO metadata for a product handle (title, description, image).
 * Uses a 15-minute revalidation window (`revalidate: 900`) because it does not include
 * inventory or availability fields, avoiding duplicate uncached Storefront API calls during `generateMetadata`.
 */
export async function getProductSeoMetadata(
  handle: string,
  locale?: string
): Promise<ProductSeoMetadata | null> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query GetProductSeoMetadata($handle: String!) ${langDirective} {
      product(handle: $handle) {
        id
        title
        handle
        description
        featuredImage {
          url
        }
        images(first: 1) {
          nodes { url }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ product: any }>(
    query,
    { handle },
    { next: { revalidate: 900 } } as RequestInit
  );

  const node = response?.data?.product;
  if (!node) return null;

  return {
    id: node.id,
    name: node.title || "",
    handle: node.handle || handle,
    description: node.description || "",
    imageUrl:
      node.featuredImage?.url ||
      node.images?.nodes?.[0]?.url ||
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
  };
}

/**
 * Lightweight uncached query that fetches only variant inventory (`quantityAvailable`) and
 * availability (`availableForSale`) for a product handle.
 */
export async function getProductInventoryByHandle(
  handle: string,
  locale?: string
): Promise<ProductInventorySnapshot | null> {
  if (!handle) return null;
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query GetProductInventoryByHandle($handle: String!) ${langDirective} {
      product(handle: $handle) {
        id
        handle
        availableForSale
        variants(first: 50) {
          nodes {
            id
            availableForSale
            quantityAvailable
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ product: any }>(
    query,
    { handle },
    { cache: "no-store" }
  );

  const node = response?.data?.product;
  if (!node) return null;

  const variants: VariantInventorySnapshot[] =
    node.variants?.nodes?.map((v: any) => ({
      id: v.id,
      available: typeof v.availableForSale === "boolean" ? v.availableForSale : undefined,
      stock:
        typeof v.quantityAvailable === "number" && Number.isFinite(v.quantityAvailable)
          ? v.quantityAvailable
          : null,
    })) || [];

  return {
    productId: node.id,
    handle: node.handle || handle,
    available:
      typeof node.availableForSale === "boolean" ? node.availableForSale : undefined,
    variants,
  };
}

// 2. Fetch single product details using URL handle
export async function getProductByHandle(handle: string, locale?: string): Promise<Product | null> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query GetProductByHandle($handle: String!) ${langDirective} {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        vendor
        tags
        availableForSale
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        compareAtPriceRange {
          minVariantPrice { amount currencyCode }
        }
        featuredImage {
          url
          altText
        }
        images(first: 20) {
          nodes { url altText }
        }
        options {
          name
          values
        }
        variants(first: 50) {
          nodes {
            id
            title
            sku
            quantityAvailable
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            image {
              url
              altText
            }
          }
        }
        collections(first: 2) {
          nodes { handle title }
        }
        rating: metafield(namespace: "reviews", key: "rating") { value }
        origin: metafield(namespace: "custom", key: "origin") { value }
        ingredients: metafield(namespace: "custom", key: "ingredients") { value }
        calories: metafield(namespace: "custom", key: "calories") { value }
        fat: metafield(namespace: "custom", key: "fat") { value }
        carbs: metafield(namespace: "custom", key: "carbs") { value }
        protein: metafield(namespace: "custom", key: "protein") { value }
        sodium: metafield(namespace: "custom", key: "sodium") { value }
      }
    }
  `;

  console.log("[getProductByHandle] Requested handle:", handle);
  let response = await shopifyFetch<{ product: any }>(
    query,
    { handle },
    { cache: "no-store" }
  );

  // Fallback 1: Handle normalization for decimal numbers (e.g. "-1-5l" -> "-15l")
  if (!response?.data?.product && handle.includes("-")) {
    const altHandle = handle.replace(/-(\d+)-(\d+)/g, "-$1$2");
    if (altHandle !== handle) {
      console.log("[getProductByHandle] Retrying with normalized handle:", altHandle);
      response = await shopifyFetch<{ product: any }>(
        query,
        { handle: altHandle },
        { cache: "no-store" }
      );
    }
  }

  // Fallback 2: Catalog search query if handle lookup returns null
  if (!response?.data?.product) {
    const searchTerm = handle.replace(/-/g, " ");
    console.log("[getProductByHandle] Attempting search fallback for term:", searchTerm);
    const searchQuery = `
      query SearchProductByTerm($query: String!) ${langDirective} {
        products(first: 5, query: $query) {
          nodes {
            handle
          }
        }
      }
    `;
    const searchRes = await shopifyFetch<{ products: { nodes: Array<{ handle: string }> } }>(
      searchQuery,
      { query: searchTerm },
      { cache: "no-store" }
    );
    const matchedHandle = searchRes?.data?.products?.nodes?.[0]?.handle;
    if (matchedHandle) {
      console.log("[getProductByHandle] Resolved real handle via search fallback:", matchedHandle);
      response = await shopifyFetch<{ product: any }>(
        query,
        { handle: matchedHandle },
        { cache: "no-store" }
      );
    }
  }

  if (response?.data?.product) {
    console.log("[getProductByHandle] Shopify returned product:", response.data.product.title, "ID:", response.data.product.id);
    return mapShopifyToLocalProduct(response.data.product);
  }

  console.log("[getProductByHandle] Product null for handle:", handle, "-> Calling notFound()");
  return null;
}

export async function getProductRecommendations(productId: string, locale?: string): Promise<Product[]> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query GetProductRecommendations($productId: ID!) ${langDirective} {
      productRecommendations(productId: $productId) {
        id
        title
        handle
        description
        vendor
        tags
        availableForSale
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        compareAtPriceRange {
          minVariantPrice { amount currencyCode }
        }
        featuredImage {
          url
          altText
        }
        images(first: 1) {
          nodes { url altText }
        }
        ${LISTING_VARIANT_FIELDS}
        collections(first: 1) {
          nodes { title }
        }
      }
    }
  `;

  try {
    const response = await shopifyFetch<{ productRecommendations: any[] }>(
      query,
      { productId },
      { cache: "no-store" }
    );
    if (response?.data?.productRecommendations) {
      return response.data.productRecommendations.map(mapShopifyToLocalProduct);
    }
  } catch (error) {
    console.error("Failed to fetch product recommendations from Shopify:", error);
  }

  return [];
}

export interface CollectionProductsResult {
  products: Product[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

// 3. Fetch products from specific collection handle
export async function getCollectionProducts(
  collectionHandle: string,
  first = 12,
  after?: string,
  sortKey?: string,
  reverse?: boolean,
  locale?: string
): Promise<CollectionProductsResult> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query GetCollectionProducts(
      $handle: String!,
      $first: Int!,
      $after: String,
      $sortKey: ProductCollectionSortKeys,
      $reverse: Boolean
    ) ${langDirective} {
      collection(handle: $handle) {
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            title
            handle
            description
            vendor
            tags
            availableForSale
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            compareAtPriceRange {
              minVariantPrice { amount currencyCode }
            }
            images(first: 1) {
              nodes { url altText }
            }
            ${LISTING_VARIANT_FIELDS}
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{
    collection: {
      products: {
        nodes: any[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };
  }>(
    query,
    {
      handle: collectionHandle,
      first,
      after,
      sortKey,
      reverse,
    },
    { cache: "no-store" }
  );
  console.log('SHOPIFY FETCH RESPONSE:', response);
  console.log('response?.data:', response?.data);
  console.log('response?.data?.collection:', response?.data?.collection);
  console.log('response?.data?.collection?.products:', response?.data?.collection?.products);
  console.log('response?.data?.collection?.products?.nodes:', response?.data?.collection?.products?.nodes);
  console.log('Boolean(response?.data?.collection?.products):', Boolean(response?.data?.collection?.products));

  if (response?.data?.collection?.products) {
    const productsData = response.data.collection.products;
    return {
      products: productsData.nodes.map(mapShopifyToLocalProduct),
      pageInfo: {
        hasNextPage: productsData.pageInfo?.hasNextPage || false,
        endCursor: productsData.pageInfo?.endCursor || null,
      },
    };
  }

  // Return empty collection result when Shopify returns no collection or 0 products
  return {
    products: [],
    pageInfo: {
      hasNextPage: false,
      endCursor: null,
    },
  };
}

// 4. Search and Predictive Suggestions
export async function searchProducts(searchTerm: string, locale?: string): Promise<Product[]> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query SearchProducts($query: String!) ${langDirective} {
      products(first: 6, query: $query) {
        nodes {
          id
          title
          handle
          description
          tags
          availableForSale
          priceRange {
            minVariantPrice { amount }
          }
          compareAtPriceRange {
            minVariantPrice { amount }
          }
          images(first: 1) {
            nodes { url }
          }
          ${LISTING_VARIANT_FIELDS}
        }
      }
    }
  `;

  const response = await shopifyFetch<{ products: { nodes: any[] } }>(
    query,
    { query: `title:*${searchTerm}* OR tag:*${searchTerm}*` },
    { cache: "no-store" }
  );
  if (response?.data?.products?.nodes) {
    return response.data.products.nodes.map(mapShopifyToLocalProduct);
  }

  // Return empty array when search query returns no items
  return [];
}

export interface SearchProductsWithPaginationOptions {
  searchTerm: string;
  collectionHandle?: string | null;
  first?: number;
  after?: string;
  sortKey?: string;
  reverse?: boolean;
  locale?: string;
}

export async function searchProductsWithPagination({
  searchTerm,
  collectionHandle,
  first = 12,
  after,
  sortKey,
  reverse,
  locale,
}: SearchProductsWithPaginationOptions): Promise<CollectionProductsResult> {
  const langDirective = getShopifyLanguageDirective(locale);
  const query = `
    query SearchProductsWithPagination(
      $first: Int!,
      $after: String,
      $query: String!,
      $sortKey: ProductSortKeys,
      $reverse: Boolean
    ) ${langDirective} {
      products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          handle
          description
          vendor
          tags
          availableForSale
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            nodes { url altText }
          }
          ${LISTING_VARIANT_FIELDS}
          collections(first: 1) {
            nodes { title }
          }
        }
      }
    }
  `;

  let builtQuery = `title:*${searchTerm}* OR tag:*${searchTerm}*`;
  if (collectionHandle) {
    builtQuery = `collection:${collectionHandle} AND (title:*${searchTerm}* OR tag:*${searchTerm}*)`;
  }

  const response = await shopifyFetch<{
    products: {
      nodes: any[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  }>(
    query,
    { first, after, query: builtQuery, sortKey, reverse },
    { cache: "no-store" }
  );

  if (response?.data?.products) {
    const productsData = response.data.products;
    return {
      products: productsData.nodes.map(mapShopifyToLocalProduct),
      pageInfo: {
        hasNextPage: productsData.pageInfo?.hasNextPage || false,
        endCursor: productsData.pageInfo?.endCursor || null,
      },
    };
  }

  // Return empty pagination result when search returns no products
  return {
    products: [],
    pageInfo: {
      hasNextPage: false,
      endCursor: null,
    },
  };
}

// --- CART API MUTATIONS & INTEGRATION ---
export interface ShopifyDiscountAllocation {
  discountedAmount: { amount: string; currencyCode?: string };
}

export interface ShopifyCartUserError {
  code?: string;
  field?: string[];
  message: string;
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  discountAllocations?: ShopifyDiscountAllocation[];
  merchandise: {
    id: string;
    title?: string;
    sku?: string | null;
    availableForSale?: boolean;
    quantityAvailable?: number | null;
    price: { amount: string; currencyCode?: string };
    compareAtPrice?: { amount: string; currencyCode?: string } | null;
    selectedOptions?: Array<{ name: string; value: string }>;
    image?: { url: string; altText?: string | null } | null;
    product: {
      id: string;
      title: string;
      handle: string;
      featuredImage?: { url: string };
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode?: string };
    totalAmount: { amount: string; currencyCode?: string };
    totalTaxAmount?: { amount: string; currencyCode?: string } | null;
  };
  discountCodes?: Array<{ code: string; applicable: boolean }>;
  discountAllocations?: ShopifyDiscountAllocation[];
  userErrors?: ShopifyCartUserError[];
  lines: ShopifyCartLine[];
}

const CART_FRAGMENT = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
    totalTaxAmount { amount currencyCode }
  }
  discountCodes {
    code
    applicable
  }
  discountAllocations {
    discountedAmount { amount currencyCode }
  }
  lines(first: 100) {
    nodes {
      id
      quantity
      discountAllocations {
        discountedAmount { amount currencyCode }
      }
      merchandise {
        ... on ProductVariant {
          id
          title
          sku
          availableForSale
          quantityAvailable
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          selectedOptions {
            name
            value
          }
          image {
            url
            altText
          }
          product {
            id
            title
            handle
            featuredImage { url }
          }
        }
      }
    }
  }
`;

function formatCartResponse(c: any): ShopifyCart {
  const lines = c.lines?.nodes || [];
  const calculatedTotal = lines.reduce((sum: number, l: any) => sum + (l.quantity || 0), 0);
  const totalQuantity = calculatedTotal > 0 ? calculatedTotal : (c.totalQuantity || 0);
  
  const formatted: ShopifyCart = {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity,
    cost: c.cost || { subtotalAmount: { amount: "0.00" }, totalAmount: { amount: "0.00" } },
    discountCodes: Array.isArray(c.discountCodes) ? c.discountCodes : [],
    discountAllocations: Array.isArray(c.discountAllocations) ? c.discountAllocations : [],
    lines,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("========================");
    console.log("[FORMAT_CART_RESPONSE DIAGNOSTIC]");
    console.log("Cart ID:", c.id);
    console.log("Raw GraphQL c.lines?.nodes:", JSON.stringify(c.lines?.nodes || null, null, 2));
    console.log("Formatted remoteCart.lines:", JSON.stringify(formatted.lines, null, 2));
    console.log("Line Details:");
    formatted.lines.forEach((line: any, index: number) => {
      console.log(` Line #${index + 1}:`, {
        lineId: line?.id || null,
        merchandiseId: line?.merchandise?.id || null,
        productId: line?.merchandise?.product?.id || null,
        quantity: line?.quantity || 0,
        productTitle: line?.merchandise?.product?.title || null,
      });
    });
    console.log("========================");
  }

  return formatted;
}

function maskToken(token?: string | null): string {
  if (!token) return "NONE";
  return token.length > 10 ? `${token.substring(0, 10)}...` : token;
}

export function getShopifyLanguageDirective(locale?: string): string {
  const langCode = locale?.toLowerCase() === "en" ? "EN" : "IT";
  return `@inContext(language: ${langCode}, country: IT)`;
}

function getCartLanguageDirective(locale?: string): string {
  return getShopifyLanguageDirective(locale);
}

// 1. Get active Cart by ID
export async function getCart(cartId: string, locale?: string): Promise<ShopifyCart | null> {
  const timestamp = new Date().toISOString();
  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] ENTER getCart`, { requestedCartId: cartId, locale });
  if (!cartId) {
    console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT getCart - No cartId provided`);
    return null;
  }
  const langDirective = getCartLanguageDirective(locale);
  const query = `
    query getCart($cartId: ID!) ${langDirective} {
      cart(id: $cartId) {
        ${CART_FRAGMENT}
      }
    }
  `;

  const response = await shopifyFetch<{ cart: any }>(query, { cartId });
  if (response && "data" in response) {
    if (response.data?.cart) {
      const formatted = formatCartResponse(response.data.cart);
      console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT getCart`, {
        requestedCartId: cartId,
        didReturnCart: true,
        returnedCartId: formatted.id,
        checkoutUrl: formatted.checkoutUrl,
      });
      return formatted;
    }
    console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT getCart - Cart not found (expired/missing)`, {
      requestedCartId: cartId,
      didReturnCart: false,
      returnedCartId: null,
      checkoutUrl: null,
    });
    return null;
  }
  throw new ShopifyNetworkError(`Failed to fetch cart ${cartId} due to transient network error`);
}

// 2. Create active Cart session
export async function cartCreate(
  lines: Array<{ merchandiseId: string; quantity: number }> = [],
  buyerIdentity?: { customerAccessToken?: string; email?: string; countryCode?: string },
  locale?: string
): Promise<ShopifyCart | null> {
  const timestamp = new Date().toISOString();
  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] ENTER cartCreate`, {
    incomingLinesCount: lines.length,
    incomingLines: lines,
    locale,
    buyerIdentity: {
      countryCode: buyerIdentity?.countryCode || "IT",
      email: buyerIdentity?.email || null,
      customerAccessToken: maskToken(buyerIdentity?.customerAccessToken),
    },
  });

  const langDirective = getCartLanguageDirective(locale);
  const query = `
    mutation cartCreate($input: CartInput!) ${langDirective} {
      cartCreate(input: $input) {
        cart {
          ${CART_FRAGMENT}
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const inputPayload: any = {
    lines,
    buyerIdentity: {
      countryCode: buyerIdentity?.countryCode || "IT",
      ...(buyerIdentity?.customerAccessToken ? { customerAccessToken: buyerIdentity.customerAccessToken } : {}),
      ...(buyerIdentity?.email ? { email: buyerIdentity.email } : {}),
    },
  };

  const response = await shopifyFetch<{ cartCreate: { cart: any; userErrors: ShopifyCartUserError[] } }>(query, {
    input: inputPayload,
  });

  if (response?.data?.cartCreate?.cart) {
    const formatted = formatCartResponse(response.data.cartCreate.cart);
    const userErrors = response.data.cartCreate.userErrors;
    if (Array.isArray(userErrors) && userErrors.length > 0) {
      formatted.userErrors = userErrors;
    }
    console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartCreate`, {
      returnedCartId: formatted.id,
      returnedCheckoutUrl: formatted.checkoutUrl,
    });
    return formatted;
  }

  const createErrors = response?.data?.cartCreate?.userErrors;
  if (Array.isArray(createErrors) && createErrors.length > 0) {
    return {
      id: "",
      checkoutUrl: "",
      totalQuantity: 0,
      cost: { subtotalAmount: { amount: "0.00" }, totalAmount: { amount: "0.00" } },
      discountCodes: [],
      discountAllocations: [],
      userErrors: createErrors,
      lines: [],
    };
  }

  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartCreate - Failed`, {
    userErrors: response?.data?.cartCreate?.userErrors || [],
    topErrors: (response as any)?.errors || [],
  });
  return null;
}

// 3. Add lines to Cart
export async function cartLinesAdd(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<ShopifyCart | null> {
  const timestamp = new Date().toISOString();
  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] ENTER cartLinesAdd`, {
    cartId,
    lineCount: lines.length,
    lines,
  });

  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ${CART_FRAGMENT}
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ cartLinesAdd: { cart: any; userErrors?: ShopifyCartUserError[] } }>(query, { cartId, lines });
  if (response?.data?.cartLinesAdd?.cart) {
    const formatted = formatCartResponse(response.data.cartLinesAdd.cart);
    const userErrors = response.data.cartLinesAdd.userErrors;
    if (Array.isArray(userErrors) && userErrors.length > 0) {
      formatted.userErrors = userErrors;
    }
    console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartLinesAdd`, {
      requestedCartId: cartId,
      returnedCartId: formatted.id,
      checkoutUrl: formatted.checkoutUrl,
    });
    return formatted;
  }

  const addErrors = response?.data?.cartLinesAdd?.userErrors;
  if (Array.isArray(addErrors) && addErrors.length > 0) {
    return {
      id: "",
      checkoutUrl: "",
      totalQuantity: 0,
      cost: { subtotalAmount: { amount: "0.00" }, totalAmount: { amount: "0.00" } },
      discountCodes: [],
      discountAllocations: [],
      userErrors: addErrors,
      lines: [],
    };
  }

  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartLinesAdd - Failed`, { cartId });
  return null;
}

// 4. Update line quantity in Cart
export async function cartLinesUpdate(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<ShopifyCart | null> {
  const query = `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ${CART_FRAGMENT}
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ cartLinesUpdate: { cart: any; userErrors?: ShopifyCartUserError[] } }>(query, { cartId, lines });
  if (response?.data?.cartLinesUpdate?.cart) {
    const formatted = formatCartResponse(response.data.cartLinesUpdate.cart);
    const userErrors = response.data.cartLinesUpdate.userErrors;
    if (Array.isArray(userErrors) && userErrors.length > 0) {
      formatted.userErrors = userErrors;
    }
    return formatted;
  }

  const updateErrors = response?.data?.cartLinesUpdate?.userErrors;
  if (Array.isArray(updateErrors) && updateErrors.length > 0) {
    return {
      id: "",
      checkoutUrl: "",
      totalQuantity: 0,
      cost: { subtotalAmount: { amount: "0.00" }, totalAmount: { amount: "0.00" } },
      discountCodes: [],
      discountAllocations: [],
      userErrors: updateErrors,
      lines: [],
    };
  }
  return null;
}

// 5. Remove lines from Cart
export async function cartLinesRemove(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart | null> {
  const query = `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ${CART_FRAGMENT}
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ cartLinesRemove: { cart: any; userErrors?: ShopifyCartUserError[] } }>(query, { cartId, lineIds });
  if (response?.data?.cartLinesRemove?.cart) {
    const formatted = formatCartResponse(response.data.cartLinesRemove.cart);
    const userErrors = response.data.cartLinesRemove.userErrors;
    if (Array.isArray(userErrors) && userErrors.length > 0) {
      formatted.userErrors = userErrors;
    }
    return formatted;
  }
  return null;
}

// 6. Update Buyer Identity on Cart (Associate Customer & Italy Market)
export async function cartBuyerIdentityUpdate(
  cartId: string,
  buyerIdentity: { customerAccessToken?: string; email?: string; countryCode?: string },
  locale?: string
): Promise<ShopifyCart | null> {
  const timestamp = new Date().toISOString();
  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] ENTER cartBuyerIdentityUpdate`, {
    incomingCartId: cartId,
    locale,
    customerAccessToken: maskToken(buyerIdentity.customerAccessToken),
    email: buyerIdentity.email || null,
    countryCode: buyerIdentity.countryCode || "IT",
  });

  const langDirective = getCartLanguageDirective(locale);
  const query = `
    mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) ${langDirective} {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart {
          ${CART_FRAGMENT}
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const payload: any = {
    countryCode: buyerIdentity.countryCode || "IT",
    ...(buyerIdentity.customerAccessToken ? { customerAccessToken: buyerIdentity.customerAccessToken } : {}),
    ...(buyerIdentity.email ? { email: buyerIdentity.email } : {}),
  };

  try {
    const response = await shopifyFetch<{ cartBuyerIdentityUpdate: { cart: any } }>(query, { cartId, buyerIdentity: payload });
    if (response?.data?.cartBuyerIdentityUpdate?.cart) {
      const formatted = formatCartResponse(response.data.cartBuyerIdentityUpdate.cart);
      const isNewCart = Boolean(formatted.id && formatted.id !== cartId);
      console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartBuyerIdentityUpdate`, {
        incomingCartId: cartId,
        returnedCartId: formatted.id,
        didShopifyIssueNewCartId: isNewCart,
        oldCartId: cartId,
        newCartId: formatted.id,
        checkoutUrl: formatted.checkoutUrl,
      });
      return formatted;
    }
  } catch (err) {
    console.error("[cartBuyerIdentityUpdate] Error associating buyer identity:", err);
  }
  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartBuyerIdentityUpdate - Failed`, { incomingCartId: cartId });
  return null;
}

// 6b. Sync Delivery Preferences (Note & Attributes) to Cart
export async function syncCartDeliveryPreferences(
  cartId: string,
  preferences: { preferredWindow?: string; gateInstructions?: string }
): Promise<ShopifyCart | null> {
  if (!cartId) return null;

  const windowText = preferences.preferredWindow ? `Fascia Oraria: ${preferences.preferredWindow}` : "";
  const notesText = preferences.gateInstructions ? `Note Corriere: ${preferences.gateInstructions}` : "";
  const fullNote = [windowText, notesText].filter(Boolean).join(". ");

  const attributes: Array<{ key: string; value: string }> = [];
  if (preferences.preferredWindow) {
    attributes.push({ key: "Preferred Delivery Time", value: preferences.preferredWindow });
  }
  if (preferences.gateInstructions) {
    attributes.push({ key: "Courier Instructions", value: preferences.gateInstructions });
  }

  let updatedCart: ShopifyCart | null = null;

  // 1. Update Cart Note
  const noteQuery = `
    mutation cartNoteUpdate($cartId: ID!, $note: String!) {
      cartNoteUpdate(cartId: $cartId, note: $note) {
        cart {
          ${CART_FRAGMENT}
        }
        userErrors { code field message }
      }
    }
  `;

  try {
    const noteRes = await shopifyFetch<{ cartNoteUpdate: { cart: any } }>(noteQuery, { cartId, note: fullNote });
    if (noteRes?.data?.cartNoteUpdate?.cart) {
      updatedCart = formatCartResponse(noteRes.data.cartNoteUpdate.cart);
    }
  } catch (err) {
    console.error("[syncCartDeliveryPreferences] Error updating cart note:", err);
  }

  // 2. Update Cart Attributes
  if (attributes.length > 0) {
    const attrQuery = `
      mutation cartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!) {
        cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
          cart {
            ${CART_FRAGMENT}
          }
          userErrors { code field message }
        }
      }
    `;

    try {
      const attrRes = await shopifyFetch<{ cartAttributesUpdate: { cart: any } }>(attrQuery, { cartId, attributes });
      if (attrRes?.data?.cartAttributesUpdate?.cart) {
        updatedCart = formatCartResponse(attrRes.data.cartAttributesUpdate.cart);
      }
    } catch (err) {
      console.error("[syncCartDeliveryPreferences] Error updating cart attributes:", err);
    }
  }

  return updatedCart;
}

// 7. Update Discount Codes on Cart
export async function cartDiscountCodesUpdate(
  cartId: string,
  discountCodes: string[],
  locale?: string
): Promise<ShopifyCart | null> {
  if (!cartId) return null;

  const langDirective = getCartLanguageDirective(locale);
  const query = `
    mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) ${langDirective} {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
        cart {
          ${CART_FRAGMENT}
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{
    cartDiscountCodesUpdate: {
      cart: any;
      userErrors?: ShopifyCartUserError[];
    };
  }>(query, { cartId, discountCodes });

  if (response?.errors && response.errors.length > 0 && !response?.data?.cartDiscountCodesUpdate?.cart) {
    return null;
  }

  const payload = response?.data?.cartDiscountCodesUpdate;
  if (payload?.cart) {
    const formatted = formatCartResponse(payload.cart);
    if (Array.isArray(payload.userErrors) && payload.userErrors.length > 0) {
      formatted.userErrors = payload.userErrors;
    }
    return formatted;
  }

  if (Array.isArray(payload?.userErrors) && payload.userErrors.length > 0) {
    return {
      id: cartId,
      checkoutUrl: "",
      totalQuantity: 0,
      cost: { subtotalAmount: { amount: "0.00" }, totalAmount: { amount: "0.00" } },
      discountCodes: [],
      discountAllocations: [],
      userErrors: payload.userErrors,
      lines: [],
    };
  }

  return null;
}

export function formatMerchandiseId(product: any): string {
  if (!product) return "";

  if (typeof product === "object" && product !== null) {
    if (product.variantId && product.variantId.startsWith("gid://shopify/ProductVariant/")) {
      return product.variantId;
    }
    if (product.variants && product.variants.length > 0 && product.variants[0]?.id) {
      const vId = product.variants[0].id;
      if (vId.startsWith("gid://shopify/ProductVariant/")) {
        return vId;
      }
    }
    const pId = String(product.id || "");
    if (pId.startsWith("gid://shopify/ProductVariant/")) {
      return pId;
    }
    console.warn("[formatMerchandiseId] Product missing authentic Shopify variantId:", product.name || product.id);
    return "";
  }

  const strId = String(product);
  if (strId.startsWith("gid://shopify/ProductVariant/")) {
    return strId;
  }

  return "";
}

// Unified checkout cart helper to connect local cart state to secure Shopify checkout URL
export async function checkoutCart(
  existingCartId?: string | null,
  items: Array<{ product: any; quantity: number }> = [],
  locale?: string
): Promise<string> {
  console.log("[checkoutCart] Called with existingCartId:", existingCartId, "Items count:", items.length, "Locale:", locale);

  if (existingCartId) {
    const activeCart = await getCart(existingCartId, locale);
    if (activeCart?.checkoutUrl) {
      console.log("[checkoutCart] Active cart verified on store:", activeCart.id, "checkoutUrl:", activeCart.checkoutUrl);
      return activeCart.checkoutUrl;
    }
    console.log("[checkoutCart] Stale or expired cart ID detected. Clearing local cart ID storage...");
    if (typeof window !== "undefined") {
      localStorage.removeItem("alimentari_shopify_cart_id");
    }
  }

  // Create a new cart session if no valid existing cart ID
  const lines = items
    .map((item) => ({
      merchandiseId: formatMerchandiseId(item.product),
      quantity: item.quantity,
    }))
    .filter((line) => line.merchandiseId.startsWith("gid://shopify/ProductVariant/"));

  if (lines.length === 0) {
    console.error("[checkoutCart] Validation failed: No items have valid Shopify ProductVariant IDs");
    throw new Error("Impossibile procedere al checkout: nessun prodotto ha un ID variante Shopify valido.");
  }

  console.log("[checkoutCart] Creating new cart on active store via cartCreate()...");
  const createdCart = await cartCreate(lines, undefined, locale);
  if (createdCart?.checkoutUrl) {
    if (typeof window !== "undefined") {
      localStorage.setItem("alimentari_shopify_cart_id", createdCart.id);
    }
    console.log("[checkoutCart] New cart created. ID:", createdCart.id, "checkoutUrl:", createdCart.checkoutUrl);
    return createdCart.checkoutUrl;
  }

  throw new Error("Impossibile generare l'URL di checkout da Shopify.");
}

// --- CUSTOMER IDENTITY (AUTHENTICATION & PROFILE) ---

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  defaultAddress?: any;
  addresses: any[];
  orders: any[];
}

// 1. customerAccessTokenCreate
export async function customerLogin(email: string, password: string): Promise<{ token: string | null; error: string | null }> {
  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = { input: { email, password } };
  const response = await shopifyFetch<{ customerAccessTokenCreate: any }>(query, variables);

  if (response?.data?.customerAccessTokenCreate) {
    const data = response.data.customerAccessTokenCreate;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      return { token: null, error: errors[0].message };
    }
    return { token: data.customerAccessToken?.accessToken || null, error: null };
  }

  return { token: null, error: "Credenziali non valide o errore di connessione a Shopify." };
}

// 2. customerCreate
export async function customerRegister(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<{ success: boolean; token: string | null; error: string | null }> {
  console.log("[customerRegister] Creating customer on Shopify for:", email);

  const query = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = { input: { firstName, lastName, email, password } };
  const response = await shopifyFetch<{ customerCreate: any }>(query, variables);

  if (response?.data?.customerCreate) {
    const data = response.data.customerCreate;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      const errCode = errors[0].code;
      const errMsg = errors[0].message;
      let userFriendlyMsg = errMsg;
      if (errCode === "TAKEN" || errMsg.toLowerCase().includes("taken") || errMsg.toLowerCase().includes("already")) {
        userFriendlyMsg = "Questa email è già registrata. Accedi o recupera la password.";
      } else if (errMsg.toLowerCase().includes("too short")) {
        userFriendlyMsg = "La password deve contenere almeno 5 caratteri.";
      } else if (errMsg.toLowerCase().includes("invalid")) {
        userFriendlyMsg = "Indirizzo email non valido.";
      }
      return { success: false, token: null, error: userFriendlyMsg };
    }

    // Customer created successfully -> Retry login to acquire access token
    console.log("[customerRegister] Customer created successfully. Acquiring access token...");
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 300));
      const loginRes = await customerLogin(email, password);
      if (loginRes.token) {
        console.log("[customerRegister] Acquired token on attempt", attempt + 1);
        return { success: true, token: loginRes.token, error: null };
      }
    }

    return { success: true, token: null, error: null };
  }

  return { success: false, token: null, error: "Registrazione non riuscita. Connessione a Shopify fallita." };
}

// 2b. createSocialCustomer (Reconciliation helper for Google & Apple OAuth)
export async function createSocialCustomer(
  firstName: string,
  lastName: string,
  email: string
): Promise<{ customerId: string | null; accessToken: string | null; success: boolean; error: string | null }> {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    console.error("[createSocialCustomer] Missing required NEXTAUTH_SECRET environment variable.");
    throw new Error("Server authentication configuration error: missing required secret.");
  }

  const crypto = await import("crypto");
  const deterministicPassword = `SocialUser_${crypto.createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex").slice(0, 16)}!`;

  // 1. Try login first in case customer already exists
  const loginRes = await customerLogin(email, deterministicPassword);
  if (loginRes.token) {
    const profile = await getCustomerProfile(loginRes.token);
    return { customerId: profile?.id || null, accessToken: loginRes.token, success: true, error: null };
  }

  // 2. Otherwise create customer
  const query = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = { input: { firstName: firstName || "Cliente", lastName: lastName || "Alimentari", email, password: deterministicPassword } };
  const response = await shopifyFetch<{ customerCreate: any }>(query, variables);

  if (response?.data?.customerCreate) {
    const data = response.data.customerCreate;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      const isAlreadyTaken = errors.some((e: any) => e.code === "TAKEN" || e.message?.toLowerCase().includes("taken") || e.message?.toLowerCase().includes("already"));
      if (isAlreadyTaken) {
        return { customerId: null, accessToken: null, success: true, error: null };
      }
      return { customerId: null, accessToken: null, success: false, error: errors[0].message };
    }

    const createdId = data.customer?.id || null;

    // Retry login to get customerAccessToken after indexing delay
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 300));
      const retryLogin = await customerLogin(email, deterministicPassword);
      if (retryLogin.token) {
        console.log("[createSocialCustomer] Created & retrieved access token for OAuth customer.");
        return { customerId: createdId, accessToken: retryLogin.token, success: true, error: null };
      }
    }

    return { customerId: createdId, accessToken: null, success: true, error: null };
  }

  return { customerId: null, accessToken: null, success: false, error: "Creazione cliente OAuth su Shopify non riuscita." };
}

// 3. customerRecover
export async function customerRecover(email: string): Promise<{ success: boolean; error: string | null }> {
  const query = `
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customerRecover: any }>(query, { email });

  if (response?.data?.customerRecover) {
    const errors = response.data.customerRecover.customerUserErrors || [];
    if (errors.length > 0) {
      return { success: false, error: errors[0].message };
    }
    return { success: true, error: null };
  }

  return { success: false, error: "Impossibile elaborare il recupero password. Connessione a Shopify fallita." };
}

// 3b. customerResetByUrl
export async function customerResetByUrl(
  resetUrl: string,
  password: string
): Promise<{ customer: any | null; token: string | null; email: string | null; error: string | null }> {
  const query = `
    mutation customerResetByUrl($resetUrl: URL!, $password: String!) {
      customerResetByUrl(resetUrl: $resetUrl, password: $password) {
        customer {
          id
          email
          firstName
          lastName
        }
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customerResetByUrl: any }>(query, { resetUrl, password });

  if (response?.data?.customerResetByUrl) {
    const data = response.data.customerResetByUrl;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      return { customer: null, token: null, email: null, error: errors[0].message };
    }
    return {
      customer: data.customer,
      token: data.customerAccessToken?.accessToken || null,
      email: data.customer?.email || null,
      error: null,
    };
  }

  // Handle top-level GraphQL errors (such as Unidentified customer / Expired link)
  if (response?.errors && response.errors.length > 0) {
    const topError = response.errors[0].message;
    const localizedErr =
      topError.includes("Unidentified") || topError.includes("NOT_FOUND")
        ? "Il link di ripristino password è scaduto o non è valido. Richiedine uno nuovo."
        : topError;
    return { customer: null, token: null, email: null, error: localizedErr };
  }

  return { customer: null, token: null, email: null, error: "Impossibile reimpostare la password. Il link potrebbe essere scaduto." };
}

export interface ShopifyOrderLineItem {
  title: string;
  quantity: number;
  variantId?: string;
  variantTitle?: string;
  available?: boolean;
  stock?: number | null;
  price: { amount: string; currencyCode?: string };
  imageUrl?: string;
  productHandle?: string;
  productId?: string;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  orderNumber?: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  email?: string | null;
  statusUrl?: string | null;
  totalPrice: { amount: string; currencyCode: string };
  subtotalPrice?: { amount: string; currencyCode: string } | null;
  totalShippingPrice?: { amount: string; currencyCode: string } | null;
  totalTax?: { amount: string; currencyCode: string } | null;
  shippingAddress?: {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  } | null;
  billingAddress?: {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
  } | null;
  trackingInfo?: Array<{ number: string; url?: string; company?: string }>;
  lineItems: ShopifyOrderLineItem[];
}

export async function getCustomerOrders(accessToken: string): Promise<ShopifyOrder[]> {
  if (!accessToken) return [];
  const query = `
    query getCustomerOrders($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          nodes {
            id
            name
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            email
            statusUrl
            totalPrice {
              amount
              currencyCode
            }
            subtotalPrice {
              amount
              currencyCode
            }
            totalShippingPrice {
              amount
              currencyCode
            }
            totalTax {
              amount
              currencyCode
            }
            shippingAddress {
              name
              address1
              address2
              city
              province
              zip
              country
            }
            billingAddress {
              name
              address1
              address2
              city
              province
              zip
              country
            }
            successfulFulfillments(first: 5) {
              trackingCompany
              trackingInfo(first: 5) {
                number
                url
              }
            }
            lineItems(first: 50) {
              nodes {
                title
                quantity
                variant {
                  id
                  title
                  availableForSale
                  quantityAvailable
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                  }
                  product {
                    id
                    title
                    handle
                    featuredImage {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customer: { orders: { nodes: any[] } } }>(query, {
    customerAccessToken: accessToken,
  });

  if (response?.data?.customer?.orders?.nodes) {
    return response.data.customer.orders.nodes.map((order: any) => {
      const lineItems: ShopifyOrderLineItem[] = (order.lineItems?.nodes || []).map((node: any) => {
        const rawVariantTitle = typeof node.variant?.title === "string" ? node.variant.title.trim() : "";
        const cleanVariantTitle =
          rawVariantTitle &&
          !rawVariantTitle.toLowerCase().includes("default title") &&
          rawVariantTitle.toLowerCase() !== "default"
            ? rawVariantTitle
            : undefined;
        const available = node.variant ? node.variant.availableForSale !== false : false;
        const stock =
          typeof node.variant?.quantityAvailable === "number" &&
          Number.isFinite(node.variant.quantityAvailable)
            ? Math.max(0, node.variant.quantityAvailable)
            : null;

        return {
          title: node.title || node.variant?.product?.title || "Prodotto",
          quantity: node.quantity || 1,
          variantId: node.variant?.id || undefined,
          variantTitle: cleanVariantTitle,
          available,
          stock,
          price: node.variant?.price || { amount: "0.00", currencyCode: "EUR" },
          imageUrl: node.variant?.image?.url || node.variant?.product?.featuredImage?.url || undefined,
          productHandle: node.variant?.product?.handle || undefined,
          productId: node.variant?.product?.id || undefined,
        };
      });

      const trackingInfo = (order.successfulFulfillments || []).flatMap((fulfillment: any) =>
        (fulfillment.trackingInfo || []).map((info: any) => ({
          number: info.number,
          url: info.url,
          company: fulfillment.trackingCompany,
        }))
      );

      return {
        id: order.id,
        name: order.name || `#${order.orderNumber}`,
        orderNumber: order.orderNumber,
        processedAt: order.processedAt,
        financialStatus: order.financialStatus || "PAID",
        fulfillmentStatus: order.fulfillmentStatus || "UNFULFILLED",
        email: order.email || null,
        statusUrl: order.statusUrl || null,
        totalPrice: order.totalPrice || { amount: "0.00", currencyCode: "EUR" },
        subtotalPrice: order.subtotalPrice || null,
        totalShippingPrice: order.totalShippingPrice || null,
        totalTax: order.totalTax || null,
        shippingAddress: order.shippingAddress || null,
        billingAddress: order.billingAddress || null,
        trackingInfo,
        lineItems,
      };
    });
  }

  return [];
}

// 4. customer profile fetching using Access Token
export async function getCustomerProfile(accessToken: string): Promise<CustomerProfile | null> {
  const query = `
    query getCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        firstName
        lastName
        email
        phone
        defaultAddress {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          province
          zip
          country
          phone
          formatted
        }
        addresses(first: 10) {
          nodes {
            id
            firstName
            lastName
            company
            address1
            address2
            city
            province
            zip
            country
            phone
            formatted
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customer: any }>(query, { customerAccessToken: accessToken });

  if (response?.data?.customer) {
    const customer = response.data.customer;
    return {
      id: customer.id,
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      defaultAddress: customer.defaultAddress || null,
      addresses: customer.addresses?.nodes || [],
      orders: [],
    };
  }
  return null;
}

// 5. customerAddressCreate
export async function customerAddressCreate(accessToken: string, address: any): Promise<{ address: any | null; error: string | null }> {
  const query = `
    mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          province
          zip
          country
          phone
          formatted
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customerAddressCreate: any }>(query, { customerAccessToken: accessToken, address });
  if (response?.data?.customerAddressCreate) {
    const data = response.data.customerAddressCreate;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      return { address: null, error: errors[0].message };
    }
    return { address: data.customerAddress, error: null };
  }

  // Fallback demo mode check
  if (!isConfigured) {
    const mockAddr = {
      id: `mock-address-${Date.now()}`,
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      province: address.province,
      zip: address.zip,
      country: address.country || "Italia",
      phone: address.phone || "",
      formatted: [address.address1, `${address.zip} ${address.city} (${address.province})`, address.country || "Italia"]
    };
    return { address: mockAddr, error: null };
  }

  return { address: null, error: "Impossibile salvare l'indirizzo." };
}

// 5b. customerAddressUpdate
export async function customerAddressUpdate(
  accessToken: string,
  addressId: string,
  address: any
): Promise<{ address: any | null; error: string | null }> {
  const query = `
    mutation customerAddressUpdate($customerAccessToken: String!, $id: ID!, $address: MailingAddressInput!) {
      customerAddressUpdate(customerAccessToken: $customerAccessToken, id: $id, address: $address) {
        customerAddress {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          province
          zip
          country
          phone
          formatted
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customerAddressUpdate: any }>(query, {
    customerAccessToken: accessToken,
    id: addressId,
    address,
  });

  if (response?.data?.customerAddressUpdate) {
    const data = response.data.customerAddressUpdate;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      return { address: null, error: errors[0].message };
    }
    return { address: data.customerAddress, error: null };
  }

  // Fallback demo mode check
  if (!isConfigured) {
    const mockAddr = {
      id: addressId,
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      city: address.city || "",
      province: address.province || "",
      zip: address.zip || "",
      country: address.country || "Italia",
      phone: address.phone || "",
      formatted: [address.address1, `${address.zip} ${address.city} (${address.province})`, address.country || "Italia"]
    };
    return { address: mockAddr, error: null };
  }

  return { address: null, error: "Impossibile aggiornare l'indirizzo." };
}

// 5c. customerDefaultAddressUpdate
export async function customerDefaultAddressUpdate(
  accessToken: string,
  addressId: string
): Promise<{ success: boolean; error: string | null }> {
  const query = `
    mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customerDefaultAddressUpdate: any }>(query, {
    customerAccessToken: accessToken,
    addressId,
  });

  if (response?.data?.customerDefaultAddressUpdate) {
    const data = response.data.customerDefaultAddressUpdate;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      return { success: false, error: errors[0].message };
    }
    return { success: true, error: null };
  }

  // Fallback demo mode check
  if (!isConfigured) {
    return { success: true, error: null };
  }

  return { success: false, error: "Impossibile impostare l'indirizzo predefinito." };
}

// 6. customerAddressDelete
export async function customerAddressDelete(accessToken: string, addressId: string): Promise<{ success: boolean; error: string | null }> {
  const query = `
    mutation customerAddressDelete($id: ID!, $customerAccessToken: String!) {
      customerAddressDelete(id: $id, customerAccessToken: $customerAccessToken) {
        deletedCustomerAddressId
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customerAddressDelete: any }>(query, { id: addressId, customerAccessToken: accessToken });
  if (response?.data?.customerAddressDelete) {
    const data = response.data.customerAddressDelete;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      return { success: false, error: errors[0].message };
    }
    return { success: true, error: null };
  }

  // Fallback demo mode check
  if (!isConfigured) {
    return { success: true, error: null };
  }

  return { success: false, error: "Impossibile rimuovere l'indirizzo." };
}

// 7. customerUpdate
export async function customerUpdate(accessToken: string, customerInput: any): Promise<{ success: boolean; error: string | null }> {
  const query = `
    mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const response = await shopifyFetch<{ customerUpdate: any }>(query, { customerAccessToken: accessToken, customer: customerInput });
  if (response?.data?.customerUpdate) {
    const data = response.data.customerUpdate;
    const errors = data.customerUserErrors || [];
    if (errors.length > 0) {
      return { success: false, error: errors[0].message };
    }
    return { success: true, error: null };
  }

  // Fallback demo mode check
  if (!isConfigured) {
    return { success: true, error: null };
  }

  return { success: false, error: "Impossibile aggiornare il profilo." };
}

// 7b. updateCustomerPassword
export async function updateCustomerPassword(
  accessToken: string,
  newPassword: string,
  currentPassword: string,
  fallbackEmail?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!accessToken || !currentPassword || !newPassword) {
    return { success: false, error: "Credenziali mancanti per l'aggiornamento della password." };
  }

  const profile = await getCustomerProfile(accessToken);
  const authoritativeEmail = profile?.email || fallbackEmail;
  if (!authoritativeEmail) {
    return { success: false, error: "Impossibile verificare l'identità dell'account." };
  }

  const verifyRes = await customerLogin(authoritativeEmail, currentPassword);
  if (verifyRes.error || !verifyRes.token) {
    return { success: false, error: "CURRENT_PASSWORD_INCORRECT" };
  }

  return customerUpdate(verifyRes.token, { password: newPassword });
}

// 8. getCustomerCartMetafield (Storefront API read for cross-browser active cart ID)
export async function getCustomerCartMetafield(customerAccessToken: string): Promise<string | null> {
  const timestamp = new Date().toISOString();
  console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] ENTER getCustomerCartMetafield`, {
    customerAccessToken: maskToken(customerAccessToken),
  });

  const query = `
    query getCustomerCartMetafield($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        metafield(namespace: "custom", key: "active_cart_id") {
          value
        }
      }
    }
  `;

  try {
    const response = await shopifyFetch<{ customer: { metafield: { value: string } | null } | null }>(
      query,
      { customerAccessToken }
    );
    const metafieldValue = response?.data?.customer?.metafield?.value || null;
    console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT getCustomerCartMetafield`, {
      customerAccessToken: maskToken(customerAccessToken),
      metafieldValue,
    });
    return metafieldValue;
  } catch (err) {
    console.error("[getCustomerCartMetafield] Error reading customer cart metafield via Storefront API:", err);
    throw err;
  }
}
