/**
 * @deprecated Production review persistence is handled 100% by Judge.me via /api/reviews/route.ts.
 * This file is retained for type declarations only.
 */

export interface ProductionReview {
  id: string;
  productId: string;
  author: string;
  email: string;
  city?: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  status: "approved" | "pending";
  helpfulCount: number;
}
