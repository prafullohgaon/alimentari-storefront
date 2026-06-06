import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarrelloLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]/30 pb-12 flex flex-col font-sans">
      {/* Header Placeholder */}
      <div className="bg-white border-b border-border/60 py-4 px-6 h-16 flex items-center justify-between">
        <Skeleton className="w-8 h-8 rounded bg-muted/10" />
        <Skeleton className="h-6 w-32 bg-muted/10" />
        <Skeleton className="w-10 h-10 rounded bg-muted/10" />
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 flex-grow">
        {/* Title */}
        <div className="border-b border-border/80 pb-5 space-y-2">
          <Skeleton className="h-4 w-40 bg-muted/10" />
          <Skeleton className="h-8 w-56 bg-muted/10" />
        </div>

        {/* Double-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column Left: Cart Items List (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-border/80 rounded-2xl p-6 shadow-soft space-y-6">
              
              {/* Shipping indicator */}
              <div className="bg-secondary/30 p-4 rounded-xl space-y-2">
                <Skeleton className="h-4 w-2/3 bg-muted/10" />
                <Skeleton className="h-2 w-full rounded-full bg-muted/10" />
              </div>

              {/* Items row */}
              <div className="divide-y divide-border space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <Skeleton className="w-20 h-20 rounded-lg bg-muted/10 flex-shrink-0" />
                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-2/3 bg-muted/10" />
                        <Skeleton className="h-4 w-12 bg-muted/10" />
                      </div>
                      <Skeleton className="h-3 w-16 bg-muted/10" />
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-8 w-24 rounded bg-muted/10" />
                        <Skeleton className="h-8 w-8 rounded bg-muted/10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Column Right: Order Summary card (4 Columns) */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-border/80 rounded-2xl p-6 shadow-premium space-y-6">
              <Skeleton className="h-6 w-32 bg-muted/10 border-b pb-2" />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16 bg-muted/10" />
                  <Skeleton className="h-4 w-12 bg-muted/10" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-muted/10" />
                  <Skeleton className="h-4 w-8 bg-muted/10" />
                </div>
                <div className="flex justify-between border-t pt-3">
                  <Skeleton className="h-5 w-20 bg-muted/10" />
                  <Skeleton className="h-6 w-16 bg-muted/10" />
                </div>
              </div>

              <Skeleton className="h-14 w-full rounded-lg bg-muted/10" />
              <Skeleton className="h-3 w-3/4 mx-auto bg-muted/10" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
