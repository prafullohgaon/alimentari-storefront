import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepartoLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]/30 pb-12 flex flex-col font-sans">
      {/* Top Header Placeholder */}
      <div className="bg-white border-b border-border/60 py-4 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded bg-muted/10" />
          <Skeleton className="h-6 w-32 bg-muted/10" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full bg-muted/10" />
          <Skeleton className="w-10 h-10 rounded bg-muted/10" />
        </div>
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 flex-grow">
        {/* Breadcrumbs & Title shimmer */}
        <div className="border-b border-border/80 pb-5 space-y-3">
          <Skeleton className="h-4 w-40 bg-muted/10" />
          <Skeleton className="h-9 w-60 bg-muted/10" />
        </div>

        {/* Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left filter pane (hidden on mobile, beautiful on desktop) */}
          <aside className="hidden lg:flex flex-col gap-6">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <Skeleton className="h-5 w-28 bg-muted/10" />
              <Skeleton className="h-3 w-12 bg-muted/10" />
            </div>
            
            {/* Reparti tree items */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-16 bg-muted/10" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg bg-muted/10" />
                ))}
              </div>
            </div>

            {/* Price slider */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <Skeleton className="h-3 w-20 bg-muted/10" />
              <Skeleton className="h-4 w-full bg-muted/10" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-8 bg-muted/10" />
                <Skeleton className="h-3 w-16 bg-muted/10" />
              </div>
            </div>

            {/* Switch */}
            <div className="pt-4 border-t border-border/60 flex justify-between items-center">
              <Skeleton className="h-4 w-24 bg-muted/10" />
              <Skeleton className="h-6 w-11 rounded-full bg-muted/10" />
            </div>
          </aside>

          {/* Right products grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Sorting top bar */}
            <div className="flex justify-between items-center border border-border/60 bg-white rounded-xl px-4 py-3 shadow-soft">
              <Skeleton className="h-4 w-32 bg-muted/10 lg:hidden" />
              <Skeleton className="h-4 w-40 bg-muted/10 ml-auto" />
            </div>

            {/* Product card shimmer grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-border/80 rounded-xl overflow-hidden shadow-soft flex flex-col p-0">
                  <Skeleton className="aspect-square w-full bg-muted/10" />
                  <div className="p-4 space-y-3 flex-grow flex flex-col">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-16 bg-muted/10" />
                      <Skeleton className="h-3 w-8 bg-muted/10" />
                    </div>
                    <Skeleton className="h-5 w-5/6 bg-muted/10" />
                    <div className="mt-auto space-y-2.5 pt-4">
                      <div className="flex justify-between items-baseline">
                        <Skeleton className="h-3 w-10 bg-muted/10" />
                        <Skeleton className="h-4 w-16 bg-muted/10" />
                      </div>
                      <Skeleton className="h-11 w-full rounded-lg bg-muted/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
