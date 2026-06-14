"use client";

import React from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  author: string;
  city?: string;
  rating: number;           // 1–5
  date: string;             // Display string, e.g. "15 Maggio 2026"
  title: string;
  body: string;
  verified: boolean;
  helpfulCount?: number;
  avatarUrl?: string;       // Falls back to initials circle if undefined
}

export interface ReviewSectionProps {
  productId: string;        // Used to deterministically seed mock reviews per product
  productName?: string;
  reviews?: Review[];       // Provide live reviews to override mock data
  isLoading?: boolean;      // Show skeleton state while fetching
  totalCount?: number;      // Override displayed total count
  averageRating?: number;   // Override computed average
}

// ─── Mock data pool ───────────────────────────────────────────────────────────
// Seeded by productId so each PDP always gets the same consistent-feeling reviews

const ALL_MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Marco B.",
    city: "Milano",
    rating: 5,
    date: "2 Giugno 2026",
    title: "Qualità eccezionale, come sempre!",
    body: "Prodotto arrivato freschissimo e ben imballato. È la terza volta che ordino e non mi ha mai deluso. Sapore autentico, si sente che è artigianale.",
    verified: true,
    helpfulCount: 14,
  },
  {
    id: "r2",
    author: "Silvia C.",
    city: "Roma",
    rating: 5,
    date: "28 Maggio 2026",
    title: "Consegna rapidissima e prodotto perfetto",
    body: "Ordinato il giovedì e ricevuto il venerdì mattina. Il packaging termico ha mantenuto la catena del freddo perfettamente. Ottimo acquisto!",
    verified: true,
    helpfulCount: 9,
  },
  {
    id: "r3",
    author: "Luca M.",
    city: "Torino",
    rating: 4,
    date: "20 Maggio 2026",
    title: "Ottimo prodotto, spedizione curata",
    body: "Molto soddisfatto della qualità. Il sapore è deciso e genuino. Toglgo una stella solo perché il packaging esterno aveva un piccolo ammaccatura, ma il prodotto era intatto.",
    verified: true,
    helpfulCount: 6,
  },
  {
    id: "r4",
    author: "Anna R.",
    city: "Napoli",
    rating: 5,
    date: "14 Maggio 2026",
    title: "Finalmente trovo qualità vera online!",
    body: "Sono originaria del sud e sono abituata ai prodotti autentici. Questo non delude: sapori intensi e materie prime eccellenti. Lo consiglio a tutti.",
    verified: true,
    helpfulCount: 22,
  },
  {
    id: "r5",
    author: "Giorgio T.",
    city: "Bologna",
    rating: 5,
    date: "7 Maggio 2026",
    title: "Regalo perfetto per i miei genitori",
    body: "L'ho ordinato come sorpresa per i miei e sono rimasti entusiasti. La confezione è elegante e il prodotto di livello gastronomico. Tornerò sicuramente.",
    verified: true,
    helpfulCount: 11,
  },
  {
    id: "r6",
    author: "Federica L.",
    city: "Firenze",
    rating: 4,
    date: "1 Maggio 2026",
    title: "Qualità superiore alla media",
    body: "Ho provato vari prodotti simili nei supermercati locali e questo è nettamente superiore. Aromi più freschi e persistenti. Acquisto consigliato.",
    verified: true,
    helpfulCount: 7,
  },
  {
    id: "r7",
    author: "Roberto N.",
    city: "Venezia",
    rating: 5,
    date: "23 Aprile 2026",
    title: "Prodotto artigianale come si deve",
    body: "Si sente che viene da una produzione autentica e non industriale. L'abbinamento con la pasta fresca è stato una rivelazione. Ordinerò di nuovo.",
    verified: true,
    helpfulCount: 18,
  },
  {
    id: "r8",
    author: "Chiara P.",
    city: "Bari",
    rating: 5,
    date: "15 Aprile 2026",
    title: "Servizio impeccabile, prodotto eccellente",
    body: "Dal momento dell'ordine alla consegna tutto è stato perfetto. Aggiornamenti di spedizione puntuali e prodotto in condizioni ottimali. 10 su 10.",
    verified: true,
    helpfulCount: 5,
  },
];

// Deterministically pick 5 reviews based on productId hash
function getMockReviews(productId: string): Review[] {
  const hash = productId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const start = hash % (ALL_MOCK_REVIEWS.length - 4);
  return ALL_MOCK_REVIEWS.slice(start, start + 5);
}

// ─── Star renderer ─────────────────────────────────────────────────────────────

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            sizeClass,
            n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-border fill-border"
          )}
        />
      ))}
    </div>
  );
}

// ─── Rating breakdown bar chart ───────────────────────────────────────────────

function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right font-bold text-muted shrink-0">{star}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-grow h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-7 text-right text-[10px] font-semibold text-muted shrink-0">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Individual review card ────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const initials = review.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="border border-border rounded-lg p-4 bg-card space-y-3 hover:shadow-soft transition-shadow">
      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {review.avatarUrl ? (
            <img
              src={review.avatarUrl}
              alt={review.author}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 select-none">
              {initials}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-foreground">{review.author}</span>
              {review.city && (
                <span className="text-[10px] text-muted font-medium">· {review.city}</span>
              )}
            </div>
            {review.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Acquisto Verificato
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <StarRow rating={review.rating} />
          <span className="text-[10px] text-muted font-medium block mt-0.5">{review.date}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h5 className="font-bold text-sm text-foreground">{review.title}</h5>
        <p className="text-xs text-muted leading-relaxed">{review.body}</p>
      </div>

      {/* Helpful */}
      {review.helpfulCount !== undefined && review.helpfulCount > 0 && (
        <p className="text-[10px] text-muted font-medium">
          👍 {review.helpfulCount} persone hanno trovato utile questa recensione
        </p>
      )}
    </article>
  );
}

// ─── Skeleton (shown when isLoading = true) ────────────────────────────────────

function ReviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-secondary" />
            <div className="space-y-1.5 flex-grow">
              <div className="h-3 bg-secondary rounded w-24" />
              <div className="h-2.5 bg-secondary rounded w-16" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-secondary rounded w-48" />
            <div className="h-2.5 bg-secondary rounded w-full" />
            <div className="h-2.5 bg-secondary rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ReviewSection({
  productId,
  productName,
  reviews,
  isLoading = false,
  totalCount,
  averageRating,
}: ReviewSectionProps) {
  const displayReviews = reviews ?? getMockReviews(productId);
  const displayTotal = totalCount ?? displayReviews.length;
  const computedAverage =
    averageRating ??
    (displayReviews.length > 0
      ? displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length
      : 0);

  return (
    <section className="border-t border-border pt-8 space-y-6" aria-label="Recensioni clienti">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-sans text-lg md:text-xl font-extrabold text-foreground tracking-tight">
            Recensioni Clienti
          </h3>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 select-none">
            <StarRow rating={computedAverage} size="sm" />
            <span className="font-bold text-xs text-foreground">{computedAverage.toFixed(1)}</span>
            <span className="text-[10px] text-muted font-medium">({displayTotal})</span>
          </div>
        </div>
        <button
          className="text-xs font-bold text-primary hover:underline underline-offset-2 transition-colors"
          onClick={() => {/* future: open review submission modal */}}
          aria-label="Scrivi una recensione"
        >
          + Scrivi una Recensione
        </button>
      </div>

      {/* Two-column layout: breakdown left, cards right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left: Rating breakdown */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Large score display */}
          <div className="text-center lg:text-left space-y-1">
            <div className="text-5xl font-extrabold text-foreground tabular-nums leading-none">
              {computedAverage.toFixed(1)}
            </div>
            <StarRow rating={computedAverage} size="md" />
            <p className="text-[11px] text-muted font-medium">
              Basato su {displayTotal} {displayTotal === 1 ? "recensione" : "recensioni"}
            </p>
          </div>

          {/* Star bar chart */}
          {!isLoading && <RatingBreakdown reviews={displayReviews} />}

          {/* CTA */}
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] text-muted leading-relaxed">
              Hai acquistato questo prodotto?
            </p>
            <button
              className="mt-1.5 w-full h-9 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-primary/5 transition-colors"
              onClick={() => {/* future: review submission flow */}}
            >
              Scrivi la tua recensione
            </button>
          </div>
        </aside>

        {/* Right: Review cards */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <ReviewSkeleton />
          ) : displayReviews.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              Ancora nessuna recensione per questo prodotto. Sii il primo!
            </div>
          ) : (
            <>
              {displayReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}

              {/* Load more stub */}
              <div className="text-center pt-2">
                <button
                  className="text-xs font-bold text-primary hover:underline underline-offset-2 transition-colors"
                  onClick={() => {/* future: load more reviews */}}
                >
                  Carica altre recensioni
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
