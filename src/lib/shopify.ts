/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shopify Headless Storefront Client - Alimentari
 * Designed for Next.js App Router & Shopify Storefront API.
 * 
 * Configured via environment variables:
 * - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN / SHOPIFY_STORE_DOMAIN
 * - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN / SHOPIFY_STOREFRONT_ACCESS_TOKEN
 */

import { Product } from "./data";

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
    const isCartOperation =
      query.includes("cartCreate") ||
      query.includes("cartLines") ||
      query.includes("cartBuyerIdentity") ||
      query.includes("cartDiscount") ||
      query.includes("getCart");

    const fetchOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: isCartOperation ? "no-store" : "default",
      ...(isServer && !isCartOperation ? { next: { revalidate: 900 } } : {}),
      ...options,
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

/// Convert a Shopify GraphQL Product Node into our clean local Product shape
function mapShopifyToLocalProduct(node: any): Product {
  const price = parseFloat(node.priceRange?.minVariantPrice?.amount || "0");
  const originalPrice = node.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
    : undefined;

  // Extract custom unit or brand metafields, falling back to tags
  const brand = node.vendor || "Alimentari Artigiani";
  const rawUnitTitle = node.variants?.nodes?.[0]?.title;
  const unit = (rawUnitTitle && !rawUnitTitle.toLowerCase().includes("default title") && rawUnitTitle.toLowerCase() !== "default")
    ? rawUnitTitle
    : undefined;


  // Map images
  const images = node.images?.nodes?.map((img: any) => ({
    url: img.url,
    altText: img.altText || undefined,
  })) || [];

  // Map options
  const options = node.options?.map((opt: any) => ({
    name: opt.name,
    values: opt.values,
  })) || [];

  // Map variants
  const variants = node.variants?.nodes?.map((v: any) => {
    const vPrice = parseFloat(v.price?.amount || v.priceRange?.minVariantPrice?.amount || "0");
    const vComparePrice = v.compareAtPrice?.amount ? parseFloat(v.compareAtPrice.amount) : undefined;
    return {
      id: v.id,
      title: v.title,
      sku: v.sku || "",
      price: vPrice,
      originalPrice: vComparePrice && vComparePrice > vPrice ? vComparePrice : undefined,
      stock: v.quantityAvailable || 0,
      available: v.availableForSale ?? true,
      selectedOptions: v.selectedOptions?.map((o: any) => ({
        name: o.name,
        value: o.value,
      })) || [],
      image: v.image ? { url: v.image.url, altText: v.image.altText || undefined } : undefined,
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

  const nutrition = (caloriesVal || fatVal || carbsVal || proteinVal || sodiumVal) ? {
    calories: caloriesVal || "N/A",
    fat: fatVal || "N/A",
    carbs: carbsVal || "N/A",
    protein: proteinVal || "N/A",
    sodium: sodiumVal || "N/A",
  } : undefined;

  return {
    id: node.id,
    variantId: node.variants?.nodes?.[0]?.id || undefined,
    handle: node.handle || undefined,
    name: node.title,
    price: price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    unit: unit,
    imageUrl: node.featuredImage?.url || node.images?.nodes?.[0]?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
    category: node.collections?.nodes?.[0]?.title || "",
    rating: ratingVal,
    tags: node.tags || [],
    isOrganic: node.tags?.includes("Bio") || node.title?.toLowerCase().includes("bio") || false,
    brand: brand,
    dietary: node.tags?.includes("Gluten Free") ? "Gluten Free" : node.tags?.includes("Vegan") ? "Vegan" : undefined,
    stock: node.variants?.nodes?.[0]?.quantityAvailable || 0,
    available: node.availableForSale ?? (node.variants?.nodes?.[0]?.availableForSale ?? true),
    sku: node.variants?.nodes?.[0]?.sku || `AL-${node.handle?.toUpperCase()}`,
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

// --- SHOPIFY STOREFRONT API IMPLEMENTATIONS ---

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
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            nodes { url altText }
          }
          variants(first: 1) {
            nodes { id title sku quantityAvailable }
          }
          collections(first: 1) {
            nodes { title }
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ products: { nodes: any[] } }>(query, { first });
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
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            nodes { url altText }
          }
          variants(first: 1) {
            nodes { id title sku quantityAvailable }
          }
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
  }>(query, { first, after, sortKey, reverse });

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
  let response = await shopifyFetch<{ product: any }>(query, { handle });

  // Fallback 1: Handle normalization for decimal numbers (e.g. "-1-5l" -> "-15l")
  if (!response?.data?.product && handle.includes("-")) {
    const altHandle = handle.replace(/-(\d+)-(\d+)/g, "-$1$2");
    if (altHandle !== handle) {
      console.log("[getProductByHandle] Retrying with normalized handle:", altHandle);
      response = await shopifyFetch<{ product: any }>(query, { handle: altHandle });
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
    const searchRes = await shopifyFetch<{ products: { nodes: Array<{ handle: string }> } }>(searchQuery, { query: searchTerm });
    const matchedHandle = searchRes?.data?.products?.nodes?.[0]?.handle;
    if (matchedHandle) {
      console.log("[getProductByHandle] Resolved real handle via search fallback:", matchedHandle);
      response = await shopifyFetch<{ product: any }>(query, { handle: matchedHandle });
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
        variants(first: 1) {
          nodes { id title sku quantityAvailable }
        }
        collections(first: 1) {
          nodes { title }
        }
      }
    }
  `;

  try {
    const response = await shopifyFetch<{ productRecommendations: any[] }>(query, { productId });
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
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            compareAtPriceRange {
              minVariantPrice { amount currencyCode }
            }
            images(first: 1) {
              nodes { url altText }
            }
            variants(first: 1) {
              nodes { id title sku quantityAvailable }
            }
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
  }>(query, {
    handle: collectionHandle,
    first,
    after,
    sortKey,
    reverse,
  });
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
          priceRange {
            minVariantPrice { amount }
          }
          images(first: 1) {
            nodes { url }
          }
          variants(first: 1) {
            nodes { id title quantityAvailable }
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ products: { nodes: any[] } }>(query, { query: `title:*${searchTerm}* OR tag:*${searchTerm}*` });
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
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          compareAtPriceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 1) {
            nodes { url altText }
          }
          variants(first: 1) {
            nodes { id title sku quantityAvailable }
          }
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
  }>(query, { first, after, query: builtQuery, sortKey, reverse });

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
export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    price: { amount: string; currencyCode?: string };
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
  lines(first: 100) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          price { amount currencyCode }
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
    discountCodes: c.discountCodes || [],
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

  const response = await shopifyFetch<{ cartCreate: { cart: any; userErrors: any[] } }>(query, {
    input: inputPayload,
  });

  if (response?.data?.cartCreate?.cart) {
    const formatted = formatCartResponse(response.data.cartCreate.cart);
    console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartCreate`, {
      returnedCartId: formatted.id,
      returnedCheckoutUrl: formatted.checkoutUrl,
    });
    return formatted;
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

  const response = await shopifyFetch<{ cartLinesAdd: { cart: any } }>(query, { cartId, lines });
  if (response?.data?.cartLinesAdd?.cart) {
    const formatted = formatCartResponse(response.data.cartLinesAdd.cart);
    console.log(`[SHOPIFY DIAGNOSTIC] [${timestamp}] EXIT cartLinesAdd`, {
      requestedCartId: cartId,
      returnedCartId: formatted.id,
      checkoutUrl: formatted.checkoutUrl,
    });
    return formatted;
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

  const response = await shopifyFetch<{ cartLinesUpdate: { cart: any } }>(query, { cartId, lines });
  if (response?.data?.cartLinesUpdate?.cart) {
    return formatCartResponse(response.data.cartLinesUpdate.cart);
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

  const response = await shopifyFetch<{ cartLinesRemove: { cart: any } }>(query, { cartId, lineIds });
  if (response?.data?.cartLinesRemove?.cart) {
    return formatCartResponse(response.data.cartLinesRemove.cart);
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
  discountCodes: string[]
): Promise<ShopifyCart | null> {
  const query = `
    mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
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

  const response = await shopifyFetch<{ cartDiscountCodesUpdate: { cart: any } }>(query, { cartId, discountCodes });
  if (response?.data?.cartDiscountCodesUpdate?.cart) {
    return formatCartResponse(response.data.cartDiscountCodesUpdate.cart);
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
  console.log("[createSocialCustomer] Reconciling OAuth user with Shopify:", email);

  const crypto = await import("crypto");
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "alimentari-social-auth-fallback-secret";
  const deterministicPassword = `SocialUser_${crypto.createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex").slice(0, 16)}!`;

  // 1. Try login first in case customer already exists
  const loginRes = await customerLogin(email, deterministicPassword);
  if (loginRes.token) {
    console.log("[createSocialCustomer] Existing OAuth customer logged in successfully.");
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
      const lineItems: ShopifyOrderLineItem[] = (order.lineItems?.nodes || []).map((node: any) => ({
        title: node.title || node.variant?.product?.title || "Prodotto",
        quantity: node.quantity || 1,
        variantId: node.variant?.id || undefined,
        price: node.variant?.price || { amount: "0.00", currencyCode: "EUR" },
        imageUrl: node.variant?.image?.url || node.variant?.product?.featuredImage?.url || undefined,
        productHandle: node.variant?.product?.handle || undefined,
        productId: node.variant?.product?.id || undefined,
      }));

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
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  return customerUpdate(accessToken, { password: newPassword });
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
