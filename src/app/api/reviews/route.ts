import { NextRequest, NextResponse } from "next/server";
import {
  createOrUpdateReviewAuthorMetaobject,
  getReviewAuthorMappings,
} from "@/lib/shopify-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface MappedReview {
  id: string;
  author: string | null;
  email?: string;
  city?: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  helpfulCount?: number;
  avatarUrl?: string;
}

const JUDGEME_BASE_URL = "https://judge.me/api/v1";

function getJudgeMeCredentials() {
  const privateToken = process.env.JUDGEME_PRIVATE_TOKEN;
  const shopDomain =
    process.env.JUDGEME_SHOP_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    "alimentari-store-lshog1qx.myshopify.com";

  return { privateToken, shopDomain };
}

function extractNumericProductId(gidOrId: string | null): string {
  if (!gidOrId) return "";
  if (/^\d+$/.test(gidOrId)) return gidOrId;
  const match = gidOrId.match(/\/Product\/(\d+)/);
  if (match) return match[1];
  return gidOrId;
}

async function resolveJudgeMeProduct(
  numericId: string,
  handle: string | null,
  shopDomain: string,
  privateToken: string
): Promise<{ id: number | string; external_id?: number | string; title?: string; handle?: string } | null> {
  try {
    if (numericId) {
      const extUrl = `${JUDGEME_BASE_URL}/products/-1?shop_domain=${encodeURIComponent(
        shopDomain
      )}&api_token=${encodeURIComponent(privateToken)}&external_id=${encodeURIComponent(numericId)}`;

      const res = await fetch(extUrl, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.product?.id) {
          return {
            id: data.product.id,
            external_id: data.product.external_id,
            title: data.product.title,
            handle: data.product.handle,
          };
        }
      }
    }

    if (handle) {
      const handleUrl = `${JUDGEME_BASE_URL}/products/-1?shop_domain=${encodeURIComponent(
        shopDomain
      )}&api_token=${encodeURIComponent(privateToken)}&handle=${encodeURIComponent(handle)}`;

      const res = await fetch(handleUrl, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.product?.id) {
          return {
            id: data.product.id,
            external_id: data.product.external_id,
            title: data.product.title,
            handle: data.product.handle,
          };
        }
      }
    }
  } catch (err) {
    console.error("[Judge.me] Error resolving product ID:", err);
  }
  return null;
}

interface JudgeMeRawReview {
  id: number | string;
  title?: string;
  body?: string;
  rating?: number;
  hidden?: boolean;
  verified?: boolean;
  verified_buyer?: boolean;
  reviewer_name?: string;
  reviewer?: {
    name?: string;
    email?: string;
    verified?: string;
  };
  city?: string;
  created_at?: string;
  product_id?: number | string;
  external_id?: number | string;
  product_external_id?: number | string;
  product_handle?: string;
  product_title?: string;
  upvotes?: number;
  pictures?: Array<{ urls?: { small?: string } }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawProductId = searchParams.get("productId");
  const handle = searchParams.get("handle");

  if (!rawProductId && !handle) {
    return NextResponse.json(
      { error: "productId or handle is required" },
      { status: 400 }
    );
  }

  const { privateToken, shopDomain } = getJudgeMeCredentials();
  const numericId = rawProductId ? extractNumericProductId(rawProductId) : null;

  try {
    let judgemeProductId: number | string | null = null;
    let judgemeExternalId: number | string | null = null;

    if (privateToken) {
      const judgemeProduct = await resolveJudgeMeProduct(
        numericId || "",
        handle,
        shopDomain || "",
        privateToken
      );

      if (judgemeProduct) {
        judgemeProductId = judgemeProduct.id;
        judgemeExternalId = judgemeProduct.external_id || null;
      }
    }

    // Parallel fetch: Judge.me production reviews + Shopify Metaobject author mappings
    const [reviewsRes, authorMap] = await Promise.all([
      fetch(
        `${JUDGEME_BASE_URL}/reviews?shop_domain=${encodeURIComponent(
          shopDomain || ""
        )}&api_token=${encodeURIComponent(privateToken || "")}&per_page=100`,
        { cache: "no-store" }
      ),
      getReviewAuthorMappings(),
    ]);

    if (!reviewsRes.ok) {
      console.error("[Judge.me] Error fetching reviews from Judge.me API");
      return NextResponse.json(
        { reviews: [], totalCount: 0, averageRating: 0 },
        { status: 200 }
      );
    }

    const data = await reviewsRes.json();
    const rawReviews = data.reviews || [];

    // Map Judge.me reviews to our frontend interface with Metaobject author overrides
    const mappedReviews: MappedReview[] = rawReviews
      .filter((r: JudgeMeRawReview) => {
        if (r.hidden === true) return false;

        const matchesProduct =
          (judgemeProductId && String(r.product_id) === String(judgemeProductId)) ||
          String(r.external_id) === String(numericId) ||
          String(r.product_external_id) === String(numericId) ||
          (judgemeExternalId && String(r.product_external_id) === String(judgemeExternalId)) ||
          (handle && r.product_handle === handle);

        return matchesProduct;
      })
      .map((r: JudgeMeRawReview) => {
        const rawDate = r.created_at ? new Date(r.created_at) : new Date();
        const formattedDate = rawDate.toLocaleDateString("it-IT", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Strict Judge.me official verified status check:
        const isVerifiedBuyer =
          r.verified === true ||
          r.reviewer?.verified === "buyer" ||
          r.verified_buyer === true;

        const localSubmittedName = authorMap.get(String(r.id).trim());
        const rawAuthorName = r.reviewer?.name?.trim() || r.reviewer_name?.trim() || null;

        const finalAuthor =
          localSubmittedName && localSubmittedName.trim() !== ""
            ? localSubmittedName.trim()
            : rawAuthorName && rawAuthorName !== ""
            ? rawAuthorName
            : null;

        return {
          id: String(r.id),
          author: finalAuthor,
          email: r.reviewer?.email || undefined,
          city: r.city || undefined,
          rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
          date: formattedDate,
          title: r.title || "Recensione",
          body: r.body || "",
          verified: isVerifiedBuyer,
          helpfulCount: r.upvotes || 0,
          avatarUrl: r.pictures?.[0]?.urls?.small || undefined,
        };
      });

    const totalCount = mappedReviews.length;
    const sum = mappedReviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating =
      totalCount > 0 ? Math.round((sum / totalCount) * 10) / 10 : 0;

    return NextResponse.json(
      {
        reviews: mappedReviews,
        totalCount,
        averageRating,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[Judge.me] Error fetching reviews:", error);
    return NextResponse.json(
      { reviews: [], totalCount: 0, averageRating: 0 },
      { status: 200 }
    );
  }
}

async function recoverCreatedReviewId(
  shopDomain: string,
  privateToken: string,
  productHandle: string | null,
  cleanEmail: string,
  cleanTitle: string,
  cleanBody: string,
  numRating: number
): Promise<string | null> {
  const intervals = [0, 500, 1000, 2000, 3000];

  for (let attempt = 0; attempt < intervals.length; attempt++) {
    if (intervals[attempt] > 0) {
      await new Promise((res) => setTimeout(res, intervals[attempt]));
    }

    try {
      const url = `${JUDGEME_BASE_URL}/reviews?shop_domain=${encodeURIComponent(
        shopDomain
      )}&api_token=${encodeURIComponent(privateToken)}&per_page=20`;

      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const rawReviews: JudgeMeRawReview[] = data.reviews || [];

        // Exact matching by email + product_handle + title + body + rating
        const matchingReviews = rawReviews.filter((r) => {
          const matchEmail =
            r.reviewer?.email?.toLowerCase().trim() === cleanEmail.toLowerCase().trim();
          const matchTitle = (r.title || "").trim() === cleanTitle;
          const matchBody = (r.body || "").trim() === cleanBody;
          const matchRating = Number(r.rating) === numRating;
          const matchHandle =
            !productHandle || !r.product_handle || r.product_handle === productHandle;

          return matchEmail && matchTitle && matchBody && matchRating && matchHandle;
        });

        if (matchingReviews.length > 0) {
          // Sort by newest created_at to get exact latest match
          matchingReviews.sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
          });

          const foundId = String(matchingReviews[0].id);
          console.log(
            `[Review Author Mapping] Exact review ID recovered on attempt ${attempt + 1}: ${foundId}`
          );
          return foundId;
        }
      }
    } catch (err) {
      console.warn(`[Review Author Mapping] Review ID recovery attempt ${attempt + 1} failed:`, err);
    }
  }

  console.error("[Review Author Mapping] Failed to recover review ID after bounded retries.");
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId: rawProductId, handle, author, email, rating, title, body: reviewBody } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Security & Input Validation
    if (!rawProductId || !author || !email || !rating || !title || !reviewBody) {
      return NextResponse.json(
        { error: "Missing required fields (productId, author, email, rating, title, body)" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase().slice(0, 150);
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const cleanAuthor = String(author).trim().slice(0, 100);
    const cleanTitle = String(title).trim().slice(0, 200);
    const cleanBody = String(reviewBody).trim().slice(0, 2000);

    const { privateToken, shopDomain } = getJudgeMeCredentials();

    let createdReviewId: string | null = null;
    let metaobjectPersisted = false;
    let postSucceeded = false;

    if (privateToken) {
      const numericId = extractNumericProductId(rawProductId);
      const parsedNumericId = Number(numericId) || numericId;

      const judgemeProduct = await resolveJudgeMeProduct(
        numericId,
        handle || null,
        shopDomain || "",
        privateToken
      );

      const targetExternalId = judgemeProduct?.external_id || parsedNumericId;
      const targetHandle = judgemeProduct?.handle || handle || null;

      const postUrl = `${JUDGEME_BASE_URL}/reviews?shop_domain=${encodeURIComponent(
        shopDomain || ""
      )}&api_token=${encodeURIComponent(privateToken)}`;

      const postPayload: Record<string, string | number> = {
        shop_domain: shopDomain || "",
        platform: "shopify",
        name: cleanAuthor,
        email: cleanEmail,
        rating: numRating,
        title: cleanTitle,
        body: cleanBody,
        id: targetExternalId,
        external_id: targetExternalId,
      };

      if (targetHandle) {
        postPayload.product_handle = targetHandle;
      }

      if (judgemeProduct?.title) {
        postPayload.product_title = judgemeProduct.title;
      }

      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[Judge.me] POST review failed:", errText);
      } else {
        postSucceeded = true;
        console.log("[Review Author Mapping] Judge.me POST succeeded.");
        const resData = await res.json().catch(() => null);
        if (resData?.review?.id) {
          createdReviewId = String(resData.review.id);
        } else if (resData?.id) {
          createdReviewId = String(resData.id);
        }

        // Bounded deterministic recovery if review ID was not returned synchronously
        if (!createdReviewId && shopDomain) {
          console.log(
            "[Review Author Mapping] Review ID not returned synchronously. Recovering via bounded lookup..."
          );
          createdReviewId = await recoverCreatedReviewId(
            shopDomain,
            privateToken,
            targetHandle,
            cleanEmail,
            cleanTitle,
            cleanBody,
            numRating
          );
        }
      }
    }

    // Persist exact submitted author name to Shopify Metaobjects if review ID was recovered
    if (createdReviewId) {
      metaobjectPersisted = await createOrUpdateReviewAuthorMetaobject(
        createdReviewId,
        cleanAuthor
      );
      if (metaobjectPersisted) {
        console.log(
          `[Review Author Mapping] Metaobject mapping saved successfully for review ID: ${createdReviewId}`
        );
      }
    }

    return NextResponse.json({
      success: postSucceeded,
      reviewId: createdReviewId,
      submittedName: cleanAuthor,
      metaobjectPersisted,
      message: "Review submitted successfully to Judge.me for moderation.",
    });
  } catch (error) {
    console.error("[Judge.me] POST handler error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
