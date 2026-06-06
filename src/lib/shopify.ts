/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shopify Headless Storefront Client - Alimentari
 * Designed for Next.js App Router & Shopify Storefront API.
 * 
 * Supports Live Storefront API integration when .env.local variables are defined:
 * - NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
 * - NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
 * 
 * Falls back dynamically to local DOP/IGP gourmet Italian database when offline or credentials
 * are missing to maintain visual design, storytelling, and zero-configuration demo testing.
 */

import { PRODUCTS, Product } from "./data";

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "";
const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";
const apiVersion = "2024-07";

// Ensure dummy templates are treated as unconfigured to prevent broken network calls
const isConfigured = !!(
  domain &&
  domain !== "alimentari-market.myshopify.com" &&
  accessToken &&
  accessToken !== "shp_storefront_api_access_token_token_secret" &&
  !accessToken.includes("placeholder")
);
const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

// GraphQL Fetch Helper
async function shopifyFetch<T>(query: string, variables = {}): Promise<{ data: T; errors?: any[] } | null> {
  if (!isConfigured) return null;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 900 } // Cache results for 15 minutes at Next edge
    });
    if (!res.ok) {
      console.error("Shopify Storefront HTTP error:", res.statusText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Shopify Storefront Fetch error:", err);
    return null;
  }
}

// Convert a Shopify GraphQL Product Node into our clean local Product shape
function mapShopifyToLocalProduct(node: any): Product {
  const price = parseFloat(node.priceRange?.minVariantPrice?.amount || "0");
  const originalPrice = node.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
    : undefined;

  // Extract custom unit or brand metafields, falling back to tags
  const brand = node.vendor || "Alimentari Artigiani";
  const unit = node.variants?.nodes?.[0]?.title || "Pezzo";
  
  return {
    id: node.id,
    name: node.title,
    price: price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    unit: unit,
    imageUrl: node.images?.nodes?.[0]?.url || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop",
    category: node.collections?.nodes?.[0]?.title || "Dispensa",
    rating: node.metafields?.find((m: any) => m?.key === "rating")?.value 
      ? parseFloat(node.metafields.find((m: any) => m.key === "rating").value) 
      : 4.9,
    tags: node.tags || [],
    isOrganic: node.tags?.includes("Bio") || node.title?.toLowerCase().includes("bio") || false,
    brand: brand,
    dietary: node.tags?.includes("Gluten Free") ? "Gluten Free" : node.tags?.includes("Vegan") ? "Vegan" : undefined,
    stock: node.variants?.nodes?.[0]?.quantityAvailable || 20,
    sku: node.variants?.nodes?.[0]?.sku || `AL-${node.handle?.toUpperCase()}`,
    origin: node.metafields?.find((m: any) => m?.key === "origin")?.value || "Italia",
    description: node.description || "",
    ingredients: node.metafields?.find((m: any) => m?.key === "ingredients")?.value || "100% Naturale",
    nutrition: {
      calories: node.metafields?.find((m: any) => m?.key === "calories")?.value || "N/A",
      fat: node.metafields?.find((m: any) => m?.key === "fat")?.value || "N/A",
      carbs: node.metafields?.find((m: any) => m?.key === "carbs")?.value || "N/A",
      protein: node.metafields?.find((m: any) => m?.key === "protein")?.value || "N/A",
      sodium: node.metafields?.find((m: any) => m?.key === "sodium")?.value || "N/A"
    }
  };
}

// Convert local product database item to a dynamic URL handle helper
export function getProductHandle(product: Product): string {
  return product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// --- SHOPIFY STOREFRONT API IMPLEMENTATIONS ---

// 1. Fetch products list
export async function getProducts(first = 12): Promise<Product[]> {
  const query = `
    query GetProducts($first: Int!) {
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

  // Fallback to local high-density gourmet database
  return PRODUCTS.slice(0, first);
}

// 2. Fetch single product details using URL handle
export async function getProductByHandle(handle: string): Promise<Product | null> {
  const query = `
    query GetProductByHandle($handle: String!) {
      product(handle: $handle) {
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
        images(first: 3) {
          nodes { url altText }
        }
        variants(first: 10) {
          nodes { id title sku quantityAvailable availableForSale }
        }
        collections(first: 2) {
          nodes { handle title }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ product: any }>(query, { handle });
  if (response?.data?.product) {
    return mapShopifyToLocalProduct(response.data.product);
  }

  // Fallback match local items by matching dynamic handle conversions
  const matched = PRODUCTS.find((p) => getProductHandle(p) === handle || p.id === handle);
  return matched || PRODUCTS[0];
}

// 3. Fetch products from specific collection handle
export async function getCollectionProducts(collectionHandle: string, first = 12): Promise<Product[]> {
  const query = `
    query GetCollectionProducts($handle: String!, $first: Int!) {
      collection(handle: $handle) {
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
          }
        }
      }
    }
  `;

  const response = await shopifyFetch<{ collection: { products: { nodes: any[] } } }>(query, { handle: collectionHandle, first });
  if (response?.data?.collection?.products?.nodes) {
    return response.data.collection.products.nodes.map(mapShopifyToLocalProduct);
  }

  // Fallback to local matching categories
  const formattedHandle = collectionHandle.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const matched = PRODUCTS.filter((p) => {
    const formattedCat = p.category.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return formattedCat.includes(formattedHandle) || formattedHandle.includes(formattedCat);
  });
  return matched.length > 0 ? matched : PRODUCTS;
}

// 4. Search and Predictive Suggestions
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  const query = `
    query SearchProducts($query: String!) {
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

  // Fallback to local terms matching
  if (!searchTerm.trim()) return [];
  const searchLower = searchTerm.toLowerCase();
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower) ||
      p.brand?.toLowerCase().includes(searchLower) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchLower))
  ).slice(0, 6);
}

// --- CART API MUTATIONS SIMULATION & INTEGRATION ---
export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: Array<{
    id: string;
    quantity: number;
    merchandise: {
      id: string;
      product: {
        title: string;
      };
    };
  }>;
}

// Create active Cart session
export async function cartCreate(variantId: string, qty = 1): Promise<ShopifyCart> {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          lines(first: 10) {
            nodes {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  price { amount }
                  product { title }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    input: {
      lines: [
        {
          merchandiseId: variantId,
          quantity: qty
        }
      ]
    }
  };

  const response = await shopifyFetch<{ cartCreate: { cart: any } }>(query, variables);
  if (response?.data?.cartCreate?.cart) {
    const cart = response.data.cartCreate.cart;
    return {
      id: cart.id,
      checkoutUrl: cart.checkoutUrl,
      lines: cart.lines?.nodes || []
    };
  }

  // Local fallback session
  return {
    id: `mock-cart-${Date.now()}`,
    checkoutUrl: "https://checkout.shopify.com/mock-checkout-alimentari",
    lines: []
  };
}

// Add lines to Cart
export async function cartLinesAdd(cartId: string, variantId: string, qty = 1): Promise<any> {
  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          cost {
            totalAmount { amount }
          }
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: [{ merchandiseId: variantId, quantity: qty }]
  };

  const response = await shopifyFetch<any>(query, variables);
  return response?.data || null;
}

// Update line quantity in Cart
export async function cartLinesUpdate(cartId: string, lineId: string, qty: number): Promise<any> {
  const query = `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: [{ id: lineId, quantity: qty }]
  };

  const response = await shopifyFetch<any>(query, variables);
  return response?.data || null;
}

// Remove lines from Cart
export async function cartLinesRemove(cartId: string, lineIds: string[]): Promise<any> {
  const query = `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;

  const variables = { cartId, lineIds };
  const response = await shopifyFetch<any>(query, variables);
  return response?.data || null;
}

// Unified checkout cart helper to connect local cart state to secure Shopify checkout URL
export async function checkoutCart(items: Array<{ product: { id: string; sku?: string }; quantity: number }>): Promise<string> {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;

  // Map our local cart items to Shopify lines.
  // Shopify needs a variant ID (merchandiseId). We use the product.id.
  // If it's a numeric ID or doesn't have the standard Shopify GID format, we construct a mock Shopify Variant GID.
  const lines = items.map((item) => {
    let merchandiseId = item.product.id;
    if (!merchandiseId.includes("gid://shopify/")) {
      merchandiseId = `gid://shopify/ProductVariant/${merchandiseId}`;
    }
    return {
      merchandiseId,
      quantity: item.quantity
    };
  });

  const variables = {
    input: {
      lines
    }
  };

  const response = await shopifyFetch<{ cartCreate: { cart: any } }>(query, variables);
  if (response?.data?.cartCreate?.cart) {
    const cart = response.data.cartCreate.cart;
    if (typeof window !== "undefined") {
      localStorage.setItem("alimentari_shopify_cart_id", cart.id);
    }
    return cart.checkoutUrl;
  }

  // Fallback URL for zero-configuration demo testing
  return "/checkout";
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

  // Local fallback demo mode check
  if (!isConfigured) {
    if (email === "ronan@alimentari.it" && password === "alimentari123") {
      return { token: "mock-customer-token-12345", error: null };
    }
    // Allow any demo login if offline/plug-and-play to keep UX frictionless
    if (email.includes("@") && password.length >= 6) {
      return { token: `mock-customer-token-${Date.now()}`, error: null };
    }
    return { token: null, error: "Credenziali non valide. Prova ronan@alimentari.it / alimentari123 per il demo." };
  }

  return { token: null, error: "Connessione a Shopify fallita. Riprova più tardi." };
}

// 2. customerCreate
export async function customerRegister(firstName: string, lastName: string, email: string, password: string): Promise<{ success: boolean; error: string | null }> {
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
      return { success: false, error: errors[0].message };
    }
    return { success: true, error: null };
  }

  // Fallback demo mode check
  if (!isConfigured) {
    return { success: true, error: null };
  }

  return { success: false, error: "Registrazione non riuscita. Riprova più tardi." };
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

  // Fallback demo mode check
  if (!isConfigured) {
    return { success: true, error: null };
  }

  return { success: false, error: "Impossibile elaborare il recupero password. Riprova più tardi." };
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
          address1
          address2
          city
          province
          zip
          country
          formatted
        }
        addresses(first: 10) {
          nodes {
            id
            address1
            address2
            city
            province
            zip
            country
            formatted
          }
        }
        orders(first: 10) {
          nodes {
            id
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice {
              amount
            }
            lineItems(first: 10) {
              nodes {
                title
                quantity
                variant {
                  price {
                    amount
                  }
                  product {
                    id
                    title
                    images(first: 1) {
                      nodes {
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
      orders: customer.orders?.nodes || []
    };
  }

  // Fallback high-fidelity demo data for "ronan@alimentari.it" or anyone logged in offline
  if (!isConfigured && accessToken.startsWith("mock-customer-token")) {
    return {
      id: "mock-customer-id-12345",
      firstName: "Ronan",
      lastName: "Mastroianni",
      email: "ronan@alimentari.it",
      phone: "+39 333 4567890",
      defaultAddress: {
        id: "mock-address-1",
        address1: "Via Montenapoleone 8",
        address2: "Interno 4",
        city: "Milano",
        province: "MI",
        zip: "20121",
        country: "Italia",
        formatted: ["Via Montenapoleone 8, Interno 4", "20121 Milano (MI)", "Italia"]
      },
      addresses: [
        {
          id: "mock-address-1",
          address1: "Via Montenapoleone 8",
          address2: "Interno 4",
          city: "Milano",
          province: "MI",
          zip: "20121",
          country: "Italia",
          formatted: ["Via Montenapoleone 8, Interno 4", "20121 Milano (MI)", "Italia"]
        },
        {
          id: "mock-address-2",
          address1: "Corso Vittorio Emanuele II 42",
          city: "Torino",
          province: "TO",
          zip: "10123",
          country: "Italia",
          formatted: ["Corso Vittorio Emanuele II 42", "10123 Torino (TO)", "Italia"]
        }
      ],
      orders: [
        {
          id: "ORD-2715",
          processedAt: "2026-05-24T12:00:00Z",
          financialStatus: "PAID",
          fulfillmentStatus: "UNFULFILLED",
          totalPrice: { amount: "67.50" },
          lineItems: {
            nodes: [
              {
                title: "Focaccia Barese Integrale",
                quantity: 2,
                variant: {
                  price: { amount: "4.80" },
                  product: {
                    id: "3",
                    title: "Focaccia Barese Integrale",
                    images: { nodes: [{ url: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?q=80&w=400&auto=format&fit=crop" }] }
                  }
                }
              },
              {
                title: "Parmigiano Reggiano DOP 30 Mesi",
                quantity: 1,
                variant: {
                  price: { amount: "14.90" },
                  product: {
                    id: "2",
                    title: "Parmigiano Reggiano DOP 30 Mesi",
                    images: { nodes: [{ url: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?q=80&w=400&auto=format&fit=crop" }] }
                  }
                }
              }
            ]
          }
        }
      ]
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
          address1
          address2
          city
          province
          zip
          country
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
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      province: address.province,
      zip: address.zip,
      country: address.country || "Italia",
      formatted: [address.address1, `${address.zip} ${address.city} (${address.province})`, address.country || "Italia"]
    };
    return { address: mockAddr, error: null };
  }

  return { address: null, error: "Impossibile salvare l'indirizzo." };
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

