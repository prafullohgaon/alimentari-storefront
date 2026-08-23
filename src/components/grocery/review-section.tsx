"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Star, CheckCircle2, ThumbsUp, MessageSquarePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthStore } from "@/store/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  author: string;
  email?: string;
  city?: string;
  rating: number;           // 1–5
  date: string;             // Display string, e.g. "15 Maggio 2026"
  title: string;
  body: string;
  verified: boolean;
  helpfulCount?: number;
  avatarUrl?: string;
}

export interface ReviewSectionProps {
  productId: string;        // Shopify product ID
  productName?: string;
  productHandle?: string;
  onRatingUpdate?: (avgRating: number, count: number) => void;
}


// ─── Helper: Star row renderer ────────────────────────────────────────────────

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-6 h-6",
  };
  const roundedRating = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5" aria-label={`Valutazione ${rating} su 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSizes[size],
            star <= roundedRating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

// ─── Helper: Star distribution breakdown bars ─────────────────────────────────

function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  if (total === 0) return null;

  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[star] = (counts[star] || 0) + 1;
  });

  return (
    <div className="space-y-1.5 text-xs text-slate-600 font-semibold select-none">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star] || 0;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="w-3 text-right font-mono text-[11px] text-slate-500">{star}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-7 text-right text-[11px] font-mono text-slate-400">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Individual review card ────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const { locale } = useTranslation();
  const isAuthorProcessing = !review.author || review.author.trim() === "";
  const initials = isAuthorProcessing
    ? "?"
    : review.author!
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <article className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-3.5 shadow-xs hover:shadow-md transition-all">
      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.avatarUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden relative shrink-0 border border-slate-200 shadow-xs">
              <Image
                src={review.avatarUrl}
                alt={review.author || "Reviewer"}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs border border-emerald-200/60 select-none">
              {initials}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAuthorProcessing ? (
                <span className="italic text-slate-400 font-medium text-xs flex items-center gap-1.5 select-none">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400 shrink-0" />
                  {locale === "it" ? "Elaborazione recensione..." : "Processing review..."}
                </span>
              ) : (
                <span className="font-extrabold text-sm text-slate-900">{review.author}</span>
              )}
              {review.city && (
                <span className="text-[11px] text-slate-400 font-medium">· {review.city}</span>
              )}
            </div>
            {review.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2 py-0.5 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Acquisto Verificato
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <StarRow rating={review.rating} />
          <span className="text-[10px] text-slate-400 font-medium block mt-1">{review.date}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h5 className="font-bold text-sm text-slate-900">{review.title}</h5>
        <p className="text-xs text-slate-600 leading-relaxed">{review.body}</p>
      </div>

      {/* Helpful */}
      {review.helpfulCount !== undefined && review.helpfulCount > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
          <span>{review.helpfulCount} persone hanno trovato utile questa recensione</span>
        </div>
      )}
    </article>
  );
}

// ─── Skeleton (shown when isLoading = true) ────────────────────────────────────

function ReviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="space-y-1.5 flex-grow">
              <div className="h-3 bg-slate-200 rounded w-28" />
              <div className="h-2.5 bg-slate-200 rounded w-20" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3.5 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ReviewSection Component ─────────────────────────────────────────────

export function ReviewSection({
  productId,
  productName,
  productHandle,
  onRatingUpdate,
}: ReviewSectionProps) {
  const { t, locale } = useTranslation();
  const profile = useAuthStore((state) => state.profile);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);

  // Write Review Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [nameInput, setNameInput] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>("");
  const [titleInput, setTitleInput] = useState<string>("");
  const [bodyInput, setBodyInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill author inputs if customer is logged in
  useEffect(() => {
    if (profile) {
      if (profile.firstName) setNameInput(`${profile.firstName} ${profile.lastName || ""}`.trim());
      if (profile.email) setEmailInput(profile.email);
    }
  }, [profile]);

  // Fetch production reviews for current productId
  const fetchReviews = useCallback(async (): Promise<Review[] | null> => {
    if (!productId) return null;
    setIsLoading(true);
    try {
      const ts = Date.now();
      const url = productHandle
        ? `/api/reviews?productId=${encodeURIComponent(productId)}&handle=${encodeURIComponent(productHandle)}&_t=${ts}`
        : `/api/reviews?productId=${encodeURIComponent(productId)}&_t=${ts}`;

      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const fetchedReviews: Review[] = data.reviews || [];
        setReviews(fetchedReviews);
        setTotalCount(data.totalCount || 0);
        setAverageRating(data.averageRating || 0);

        if (onRatingUpdate) {
          onRatingUpdate(data.averageRating || 0, data.totalCount || 0);
        }
        return fetchedReviews;
      }
    } catch (err) {
      console.error("Failed to load production reviews:", err);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [productId, productHandle, onRatingUpdate]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Bounded post-submission polling effect while Judge.me indexes reviewer identity
  useEffect(() => {
    if (!pendingReviewId) return;

    let attempt = 0;
    const maxAttempts = 6;
    const intervals = [2000, 4000, 6000, 8000, 10000];
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      attempt++;
      const latestReviews = await fetchReviews();

      if (latestReviews) {
        const target = latestReviews.find((r) => String(r.id) === String(pendingReviewId));
        if (target && target.author !== null && target.author.trim() !== "") {
          setPendingReviewId(null);
          return;
        }
      }

      if (attempt < maxAttempts) {
        const delay = intervals[attempt - 1] || 2000;
        timeoutId = setTimeout(poll, delay);
      } else {
        setPendingReviewId(null);
      }
    };

    timeoutId = setTimeout(poll, 2000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pendingReviewId, fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const finalAuthor = profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`.trim()
      : nameInput.trim();
    const finalEmail = profile?.email ? profile.email.trim() : emailInput.trim();

    if (!finalAuthor) {
      setErrorMsg(locale === "it" ? "Il nome è obbligatorio." : "Name is required.");
      return;
    }

    if (!finalEmail || !emailRegex.test(finalEmail)) {
      setErrorMsg(
        locale === "it"
          ? "Inserisci un indirizzo email valido."
          : "Please enter a valid email address."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          handle: productHandle,
          author: finalAuthor,
          email: finalEmail,
          rating: ratingInput,
          title: titleInput.trim(),
          body: bodyInput.trim(),
          verified: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit review");
      }

      const resData = await res.json().catch(() => null);
      if (resData?.reviewId) {
        setPendingReviewId(String(resData.reviewId));
      }

      setSubmitted(true);
      const latestReviews = await fetchReviews();

      // If newly created review returned with null author during Judge.me indexing, apply submittedName from response
      if (resData?.reviewId && resData?.submittedName && latestReviews) {
        const targetId = String(resData.reviewId);
        const subName = String(resData.submittedName);
        setReviews(
          latestReviews.map((r) =>
            String(r.id) === targetId && (!r.author || r.author.trim() === "")
              ? { ...r, author: subName }
              : r
          )
        );
      }

      setTimeout(() => {
        setSubmitted(false);
        setShowModal(false);
        setTitleInput("");
        setBodyInput("");
      }, 3500);
    } catch (err: unknown) {

      console.error("Submit review error:", err);
      const message = err instanceof Error ? err.message : "Failed to submit review.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <section className="border-t border-slate-200/80 pt-10 space-y-6" aria-label={t("pdp.reviewsAria")}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h3 className="font-serif text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
            {t("pdp.reviewsTitle")}
          </h3>
          {productName && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {locale === "it" ? `Opinioni verificate dei clienti su ${productName}` : `Verified customer reviews for ${productName}`}
            </p>
          )}
        </div>
        <button
          className="h-10 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
          onClick={() => setShowModal(true)}
          aria-label={t("pdp.writeReview")}
        >
          <MessageSquarePlus className="w-4 h-4" />
          {t("pdp.writeReview")}
        </button>
      </div>

      {/* Two-column layout: breakdown left, cards right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left: Rating breakdown */}
        <aside className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 h-fit">
          {/* Large score display */}
          <div className="text-center lg:text-left space-y-1">
            {totalCount > 0 ? (
              <>
                <div className="text-5xl font-black text-slate-900 tabular-nums leading-none">
                  {averageRating.toFixed(1)}
                </div>
                <div className="py-1">
                  <StarRow rating={averageRating} size="md" />
                </div>
                <p className="text-xs text-slate-500 font-semibold">
                  {locale === "it" ? `Basato su ${totalCount} recensioni` : `Based on ${totalCount} reviews`}
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-extrabold text-slate-900 leading-snug">
                  {locale === "it" ? "Ancora nessuna recensione" : "No reviews yet"}
                </div>
                <p className="text-xs text-slate-500 font-medium pt-0.5">
                  {locale === "it" ? "Sii il primo a recensire questo prodotto" : "Be the first to review this product"}
                </p>
              </>
            )}
          </div>

          {/* Star bar chart */}
          {!isLoading && totalCount > 0 && <RatingBreakdown reviews={reviews} />}

          {/* CTA */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {locale === "it" ? "Hai acquistato questo prodotto?" : "Purchased this item?"}
            </p>
            <button
              className="mt-2 w-full h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              {t("pdp.writeReview")}
            </button>
          </div>
        </aside>

        {/* Right: Review cards */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <ReviewSkeleton />
          ) : reviews.length === 0 ? (
            <div className="py-12 bg-white border border-slate-200/80 rounded-2xl text-center text-slate-500 text-sm space-y-3 p-6">
              <p className="font-serif font-bold text-slate-900 text-base">
                {locale === "it" ? "Ancora nessuna recensione" : "No reviews yet"}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {locale === "it"
                  ? "Sii il primo a recensire questo prodotto e condividi la tua esperienza con altri clienti."
                  : "Be the first to review this product and share your experience with other customers."}
              </p>
              <button
                className="mt-2 px-5 h-10 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
                onClick={() => setShowModal(true)}
              >
                <MessageSquarePlus className="w-4 h-4" />
                {t("pdp.writeReview")}
              </button>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-serif font-bold text-lg text-slate-900">{t("pdp.writeReview")}</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
            </div>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold space-y-2 text-center">
                <p>✓ {t("pdp.submitReviewNotice")}</p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {locale === "it"
                    ? "Recensione inviata con successo. Potrebbe essere necessario qualche secondo prima che sia visibile."
                    : "Review submitted successfully. It may take a few seconds to appear."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    {locale === "it" ? "Valutazione" : "Rating"}
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        className="p-1 cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Star className={cn("w-6 h-6", star <= ratingInput ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    {locale === "it" ? "Il tuo Nome" : "Your Name"}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={Boolean(profile?.firstName)}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t("pdp.reviewNamePlaceholder")}
                    className={cn(
                      "w-full h-10 border border-slate-200 rounded-xl px-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20",
                      profile?.firstName ? "bg-slate-50 cursor-not-allowed opacity-90" : "bg-white"
                    )}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    {locale === "it" ? "La tua Email" : "Your Email"}
                  </label>
                  <input
                    type="email"
                    required
                    readOnly={Boolean(profile?.email)}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={t("pdp.reviewEmailPlaceholder")}
                    className={cn(
                      "w-full h-10 border border-slate-200 rounded-xl px-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20",
                      profile?.email ? "bg-slate-50 cursor-not-allowed opacity-90" : "bg-white"
                    )}
                  />
                </div>



                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    {locale === "it" ? "Titolo della Recensione" : "Review Title"}
                  </label>
                  <input
                    type="text"
                    required
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder={locale === "it" ? "e.g. Prodotto eccellente" : "e.g. Excellent product"}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 bg-white text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    {locale === "it" ? "La tua Recensione" : "Your Review"}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={bodyInput}
                    onChange={(e) => setBodyInput(e.target.value)}
                    placeholder={locale === "it" ? "Descrivi la tua esperienza con il prodotto..." : "Describe your experience..."}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 h-10 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    {locale === "it" ? "Annulla" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 h-10 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {locale === "it" ? "Invio in corso..." : "Submitting..."}
                      </>
                    ) : (
                      locale === "it" ? "Invia Recensione" : "Submit Review"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
