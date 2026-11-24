"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCustomerProfile } from "@/lib/shopify";
import { shopifyAdminFetch } from "@/lib/shopify-admin";

export interface SaveMetafieldResponse {
  success: boolean;
  error?: string;
}

export interface GetMetafieldResponse {
  cartId: string | null;
  error?: string;
}

interface MetafieldsSetMutationData {
  metafieldsSet: {
    metafields: Array<{
      id: string;
      namespace: string;
      key: string;
      value: string;
    }> | null;
    userErrors: Array<{
      field: string[];
      message: string;
    }>;
  };
}

interface CustomerMetafieldQueryData {
  customer: {
    id: string;
    metafield: {
      value: string;
    } | null;
  } | null;
}

/**
 * Strict format check for Shopify Customer GIDs: gid://shopify/Customer/<numeric_id>
 */
const SHOPIFY_CUSTOMER_GID_REGEX = /^gid:\/\/shopify\/Customer\/\d+$/;

/**
 * Strict format check for Shopify Cart GIDs returned by the Storefront API:
 * gid://shopify/Cart/<token> or gid://shopify/Cart/<token>?key=<key>
 *
 * Note: This validates GID syntax only; it does not by itself prove that the cart's
 * Storefront buyerIdentity belongs to the authenticated customer.
 */
const SHOPIFY_CART_GID_REGEX = /^gid:\/\/shopify\/Cart\/[A-Za-z0-9_-]+(\?key=[A-Za-z0-9_%=-]+)?$/;

function isValidShopifyCustomerGid(id: unknown): id is string {
  return typeof id === "string" && SHOPIFY_CUSTOMER_GID_REGEX.test(id);
}

function isValidShopifyCartGid(cartId: unknown): cartId is string {
  return typeof cartId === "string" && SHOPIFY_CART_GID_REGEX.test(cartId);
}

/**
 * Verifies the server-side NextAuth session and ensures the authenticated user
 * owns the target Shopify Customer GID before executing privileged Admin API operations.
 * When both session.user.id and session.accessToken are present, verifies that they
 * resolve to the same Shopify customer.
 */
async function verifyCustomerOwnership(
  requestedCustomerId: string
): Promise<{ authorizedCustomerId: string | null; error?: string }> {
  if (!isValidShopifyCustomerGid(requestedCustomerId)) {
    return { authorizedCustomerId: null, error: "Invalid Customer GID provided." };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { authorizedCustomerId: null, error: "Authentication required." };
  }

  const rawSessionUserId = typeof session.user.id === "string" ? session.user.id.trim() : "";
  const rawAccessToken = typeof session.accessToken === "string" ? session.accessToken.trim() : "";

  // If session.user.id claims to be a GID but is not a valid Shopify Customer GID, fail closed
  if (rawSessionUserId.startsWith("gid://") && !isValidShopifyCustomerGid(rawSessionUserId)) {
    return { authorizedCustomerId: null, error: "Unable to verify customer identity." };
  }

  const sessionCustomerGid: string | null = isValidShopifyCustomerGid(rawSessionUserId)
    ? rawSessionUserId
    : null;

  let tokenCustomerGid: string | null = null;
  if (rawAccessToken) {
    try {
      const profile = await getCustomerProfile(rawAccessToken);
      if (!isValidShopifyCustomerGid(profile?.id)) {
        return { authorizedCustomerId: null, error: "Unable to verify customer identity." };
      }
      tokenCustomerGid = profile.id;
    } catch {
      return { authorizedCustomerId: null, error: "Unable to verify customer session." };
    }
  }

  // If both session.user.id (as Customer GID) and session.accessToken exist, they must match
  if (sessionCustomerGid && tokenCustomerGid && sessionCustomerGid !== tokenCustomerGid) {
    return { authorizedCustomerId: null, error: "Inconsistent customer session identity." };
  }

  const trustedCustomerId = tokenCustomerGid || sessionCustomerGid;
  if (!trustedCustomerId) {
    return { authorizedCustomerId: null, error: "Unable to verify customer identity." };
  }

  if (requestedCustomerId !== trustedCustomerId) {
    return { authorizedCustomerId: null, error: "Forbidden: customer ownership mismatch." };
  }

  return { authorizedCustomerId: trustedCustomerId };
}

/**
 * Saves or clears the active cart GID for the authenticated Shopify Customer via Admin API metafieldsSet.
 */
export async function saveCustomerActiveCartIdAction(
  customerId: string,
  cartId: string | null
): Promise<SaveMetafieldResponse> {
  const authCheck = await verifyCustomerOwnership(customerId);
  if (!authCheck.authorizedCustomerId) {
    return { success: false, error: authCheck.error || "Unauthorized." };
  }

  if (cartId !== null && cartId !== "" && !isValidShopifyCartGid(cartId)) {
    return { success: false, error: "Invalid Cart GID provided." };
  }

  const mutation = `
    mutation saveCustomerActiveCartId($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const metafieldInput = {
    ownerId: authCheck.authorizedCustomerId,
    namespace: "custom",
    key: "active_cart_id",
    type: "single_line_text_field",
    value: cartId || "",
  };

  try {
    const data = await shopifyAdminFetch<MetafieldsSetMutationData>(mutation, {
      metafields: [metafieldInput],
    });

    const userErrors = data?.metafieldsSet?.userErrors || [];
    if (userErrors.length > 0) {
      return { success: false, error: "Failed to update active cart metafield." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to save active cart metafield." };
  }
}

/**
 * Retrieves the active cart GID for the authenticated Shopify Customer via Admin API query.
 */
export async function getCustomerActiveCartIdAction(
  customerId: string
): Promise<GetMetafieldResponse> {
  const authCheck = await verifyCustomerOwnership(customerId);
  if (!authCheck.authorizedCustomerId) {
    return { cartId: null, error: authCheck.error || "Unauthorized." };
  }

  const query = `
    query getCustomerActiveCartId($id: ID!) {
      customer(id: $id) {
        id
        metafield(namespace: "custom", key: "active_cart_id") {
          value
        }
      }
    }
  `;

  try {
    const data = await shopifyAdminFetch<CustomerMetafieldQueryData>(query, {
      id: authCheck.authorizedCustomerId,
    });

    if (!data.customer) {
      return { cartId: null, error: "Customer not found." };
    }

    const cartIdValue = data.customer.metafield?.value || null;
    return { cartId: cartIdValue && isValidShopifyCartGid(cartIdValue) ? cartIdValue : null };
  } catch {
    return { cartId: null, error: "Failed to retrieve active cart metafield." };
  }
}
