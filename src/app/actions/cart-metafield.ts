"use server";

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
 * Saves or clears the active cart GID for a Shopify Customer via Admin API metafieldsSet.
 */
export async function saveCustomerActiveCartIdAction(
  customerId: string,
  cartId: string | null
): Promise<SaveMetafieldResponse> {
  const timestamp = new Date().toISOString();
  console.log("=================================================================");
  console.log(`[METAFIELD DIAGNOSTIC] [${timestamp}] ENTER saveCustomerActiveCartIdAction`);
  console.log("  customerId:", customerId);
  console.log("  newMetafieldValue (cartId):", cartId);
  console.log("=================================================================");

  if (!customerId || !customerId.startsWith("gid://shopify/Customer/")) {
    console.error("[CartMetafield] Failure: Invalid Customer GID provided.");
    console.log("=================================================================");
    console.log(`[METAFIELD DIAGNOSTIC] [${timestamp}] EXIT saveCustomerActiveCartIdAction`, {
      didWriteSucceed: false,
      error: "Invalid Customer GID provided.",
    });
    console.log("=================================================================");
    return { success: false, error: "Invalid Customer GID provided." };
  }

  // Read current metafield value before updating (for diagnostic audit)
  let oldMetafieldValue: string | null = null;
  try {
    const existing = await getCustomerActiveCartIdAction(customerId);
    oldMetafieldValue = existing.cartId;
  } catch {
    oldMetafieldValue = "error-reading-old-value";
  }

  console.log(`[METAFIELD DIAGNOSTIC] [${timestamp}] Metafield Value Comparison:`, {
    oldMetafieldValue,
    newMetafieldValue: cartId,
  });

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
    ownerId: customerId,
    namespace: "custom",
    key: "active_cart_id",
    type: "single_line_text_field",
    value: cartId || "",
  };

  console.log("[saveCustomerActiveCartIdAction] Admin API payload:");
  console.log(JSON.stringify({ metafields: [metafieldInput] }, null, 2));

  try {
    const data = await shopifyAdminFetch<MetafieldsSetMutationData>(mutation, {
      metafields: [metafieldInput],
    });

    console.log("[saveCustomerActiveCartIdAction] Admin API response:");
    console.log(JSON.stringify(data, null, 2));

    const userErrors = data?.metafieldsSet?.userErrors || [];
    console.log("[saveCustomerActiveCartIdAction] userErrors:");
    if (userErrors.length === 0) {
      console.log("  No userErrors");
    } else {
      console.log(JSON.stringify(userErrors, null, 2));
    }

    if (userErrors.length > 0) {
      const errMsg = userErrors.map((err) => err.message).join("; ");
      console.error(`[CartMetafield] Failure: ${errMsg}`);
      console.log("=================================================================");
      console.log(`[METAFIELD DIAGNOSTIC] [${timestamp}] EXIT saveCustomerActiveCartIdAction`, {
        oldMetafieldValue,
        newMetafieldValue: cartId,
        didWriteSucceed: false,
        error: errMsg,
      });
      console.log("=================================================================");
      return { success: false, error: errMsg };
    }

    console.log("=================================================================");
    console.log(`[METAFIELD DIAGNOSTIC] [${timestamp}] EXIT saveCustomerActiveCartIdAction (SUCCESS)`, {
      oldMetafieldValue,
      newMetafieldValue: cartId,
      didWriteSucceed: true,
    });
    console.log("=================================================================");
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[CartMetafield] Failure: ${errorMessage}`);
    console.log("=================================================================");
    console.log(`[METAFIELD DIAGNOSTIC] [${timestamp}] EXIT saveCustomerActiveCartIdAction (EXCEPTION)`, {
      oldMetafieldValue,
      newMetafieldValue: cartId,
      didWriteSucceed: false,
      error: errorMessage,
    });
    console.log("=================================================================");
    return { success: false, error: errorMessage };
  }
}

/**
 * Retrieves the active cart GID for a Shopify Customer via Admin API query.
 */
export async function getCustomerActiveCartIdAction(
  customerId: string
): Promise<GetMetafieldResponse> {
  console.log(`[CartMetafield] Reading active cart for customer ${customerId}`);

  if (!customerId || !customerId.startsWith("gid://shopify/Customer/")) {
    console.error("[CartMetafield] Failure: Invalid Customer GID provided.");
    return { cartId: null, error: "Invalid Customer GID provided." };
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
      id: customerId,
    });

    if (!data.customer) {
      console.log("[CartMetafield] Failure: Customer not found.");
      return { cartId: null, error: "Customer not found." };
    }

    const cartIdValue = data.customer.metafield?.value || null;
    console.log("[CartMetafield] Success: Retrieved active cart ID metafield.");
    return { cartId: cartIdValue ? cartIdValue : null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[CartMetafield] Failure: ${errorMessage}`);
    return { cartId: null, error: errorMessage };
  }
}
