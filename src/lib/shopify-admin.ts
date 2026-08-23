import "server-only";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
}

export async function shopifyAdminFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-01";

  if (!domain) {
    throw new Error(
      "[ShopifyAdmin] Missing configuration: Neither SHOPIFY_STORE_DOMAIN nor NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is defined in environment."
    );
  }

  if (!adminToken) {
    throw new Error(
      "[ShopifyAdmin] Missing configuration: SHOPIFY_ADMIN_API_ACCESS_TOKEN is not defined in environment."
    );
  }

  const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[ShopifyAdmin] HTTP Error ${response.status} (${response.statusText}): ${errorText}`
    );
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join("; ");
    throw new Error(`[ShopifyAdmin] GraphQL Error: ${messages}`);
  }

  if (!json.data) {
    throw new Error("[ShopifyAdmin] Empty response data received from Shopify Admin GraphQL API.");
  }

  return json.data;
}

// ─── Metaobject Author Mapping Types & GraphQL Operations ─────────────────────

interface MetaobjectByHandleResponse {
  metaobjectByHandle: {
    id: string;
    handle: string;
  } | null;
}

interface MetaobjectCreateResponse {
  metaobjectCreate: {
    metaobject: { id: string; handle: string } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface MetaobjectUpdateResponse {
  metaobjectUpdate: {
    metaobject: { id: string; handle: string } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface MetaobjectsQueryResponse {
  metaobjects: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{
      node: {
        id: string;
        handle: string;
        fields: Array<{
          key: string;
          value: string;
        }>;
      };
    }>;
  };
}

const GET_METAOBJECT_BY_HANDLE_QUERY = `
  query GetMetaobjectByHandle($type: String!, $handle: String!) {
    metaobjectByHandle(handle: { type: $type, handle: $handle }) {
      id
      handle
    }
  }
`;

const CREATE_REVIEW_AUTHOR_METAOBJECT_MUTATION = `
  mutation CreateReviewAuthorMetaobject($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_REVIEW_AUTHOR_METAOBJECT_MUTATION = `
  mutation UpdateReviewAuthorMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_REVIEW_AUTHOR_METAOBJECTS_QUERY = `
  query GetReviewAuthorMetaobjects($first: Int!, $after: String) {
    metaobjects(type: "review_author", first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

/**
 * Persists or updates a submitted author name in Shopify Metaobjects.
 * Uses deterministic handle "review-author-${judgemeReviewId}" for 100% idempotency.
 * Includes server-side exponential backoff retries (100ms, 300ms, 700ms).
 */
export async function createOrUpdateReviewAuthorMetaobject(
  judgemeReviewId: string,
  submittedName: string
): Promise<boolean> {
  if (!judgemeReviewId || !submittedName) return false;

  const cleanReviewId = String(judgemeReviewId).trim();
  const cleanAuthor = String(submittedName).trim();
  const deterministicHandle = `review-author-${cleanReviewId}`;
  const nowIso = new Date().toISOString();

  const maxRetries = 3;
  const backoffs = [100, 300, 700];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Pre-flight handle lookup for idempotent upsert
      const existing = await shopifyAdminFetch<MetaobjectByHandleResponse>(
        GET_METAOBJECT_BY_HANDLE_QUERY,
        {
          type: "review_author",
          handle: deterministicHandle,
        }
      ).catch(() => null);

      if (existing?.metaobjectByHandle?.id) {
        // Update existing metaobject entry
        const updateRes = await shopifyAdminFetch<MetaobjectUpdateResponse>(
          UPDATE_REVIEW_AUTHOR_METAOBJECT_MUTATION,
          {
            id: existing.metaobjectByHandle.id,
            metaobject: {
              fields: [
                { key: "judgeme_review_id", value: cleanReviewId },
                { key: "submitted_name", value: cleanAuthor },
                { key: "created_at", value: nowIso },
              ],
            },
          }
        );

        const errors = updateRes.metaobjectUpdate.userErrors;
        if (!errors || errors.length === 0) return true;
        console.warn(`[ShopifyAdmin] Metaobject update warning for ${cleanReviewId}:`, errors);
      } else {
        // Create new metaobject entry
        const createRes = await shopifyAdminFetch<MetaobjectCreateResponse>(
          CREATE_REVIEW_AUTHOR_METAOBJECT_MUTATION,
          {
            metaobject: {
              type: "review_author",
              handle: deterministicHandle,
              fields: [
                { key: "judgeme_review_id", value: cleanReviewId },
                { key: "submitted_name", value: cleanAuthor },
                { key: "created_at", value: nowIso },
              ],
            },
          }
        );

        const errors = createRes.metaobjectCreate.userErrors;
        if (!errors || errors.length === 0) return true;
        console.warn(`[ShopifyAdmin] Metaobject create warning for ${cleanReviewId}:`, errors);
      }
    } catch (error) {
      console.warn(
        `[ShopifyAdmin] Metaobject persistence attempt ${attempt + 1}/${maxRetries} failed for ${cleanReviewId}:`,
        error
      );
    }

    if (attempt < maxRetries - 1) {
      await new Promise((res) => setTimeout(res, backoffs[attempt]));
    }
  }

  console.error(`[ShopifyAdmin] Permanent failure persisting review author metaobject for ID: ${cleanReviewId}`);
  return false;
}

/**
 * Bulk retrieves all review_author Metaobjects using cursor pagination.
 * Returns an in-memory Map<judgeme_review_id, submitted_name> for O(1) lookup.
 */
export async function getReviewAuthorMappings(): Promise<Map<string, string>> {
  const authorMap = new Map<string, string>();

  try {
    let hasNextPage = true;
    let cursor: string | null = null;
    let totalFetched = 0;

    while (hasNextPage && totalFetched < 1000) {
      const data: MetaobjectsQueryResponse = await shopifyAdminFetch<MetaobjectsQueryResponse>(
        GET_REVIEW_AUTHOR_METAOBJECTS_QUERY,
        {
          first: 250,
          after: cursor,
        }
      );

      const edges = data.metaobjects.edges || [];
      edges.forEach((edge) => {
        const fields = edge.node.fields || [];
        let reviewId: string | null = null;
        let submittedName: string | null = null;

        fields.forEach((f) => {
          if (f.key === "judgeme_review_id") reviewId = f.value;
          if (f.key === "submitted_name") submittedName = f.value;
        });

        if (reviewId && submittedName) {
          authorMap.set(String(reviewId).trim(), String(submittedName).trim());
        }
      });

      totalFetched += edges.length;
      hasNextPage = data.metaobjects.pageInfo.hasNextPage;
      cursor = data.metaobjects.pageInfo.endCursor;
    }
  } catch (error) {
    console.error("[ShopifyAdmin] Error fetching review author metaobject mappings:", error);
  }

  return authorMap;
}
