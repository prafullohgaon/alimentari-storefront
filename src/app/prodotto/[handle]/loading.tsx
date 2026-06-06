import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PdpLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]/30 pb-24 md:pb-12 flex flex-col font-sans">
      {/* Top Header Placeholder */}
      <div className="bg-white border-b border-border/60 py-4 px-6 h-16 flex items-center justify-between">
        <Skeleton className="w-8 h-8 rounded bg-muted/10" />
        <Skeleton className="h-6 w-32 bg-muted/10" />
        <Skeleton className="w-10 h-10 rounded bg-muted/10" />
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-12 flex-grow">
        {/* Breadcrumbs */}
        <Skeleton className="h-4 w-48 bg-muted/10" />

        {/* Double-Column Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Column Left (Gallery Layout): 7 Columns */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Thumbnails (hidden on mobile, visible on desktop) */}
            <div className="hidden md:flex md:col-span-2 flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl bg-muted/10" />
              ))}
            </div>
            {/* Main Showcase Image */}
            <div className="md:col-span-10 bg-white border border-border/80 rounded-2xl p-6 shadow-soft flex items-center justify-center">
              <Skeleton className="aspect-square w-full rounded-xl bg-muted/10" />
            </div>
          </div>

          {/* Column Right (Purchase info & configurations): 5 Columns */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title Header Card */}
            <div className="bg-white border border-border/80 rounded-2xl p-6 shadow-soft space-y-3">
              <Skeleton className="h-3 w-16 bg-muted/10" />
              <Skeleton className="h-8 w-4/5 bg-muted/10" />
              <Skeleton className="h-4 w-28 bg-muted/10" />
              <div className="pt-2 border-t border-border/40 flex justify-between">
                <Skeleton className="h-4 w-24 bg-muted/10" />
                <Skeleton className="h-4 w-16 bg-muted/10" />
              </div>
            </div>

            {/* Subscribe panel */}
            <div className="bg-white border border-border/80 rounded-2xl p-6 shadow-premium space-y-6">
              <div className="flex justify-between items-baseline">
                <Skeleton className="h-8 w-32 bg-muted/10" />
                <Skeleton className="h-4 w-12 bg-muted/10" />
              </div>
              <Skeleton className="h-9 w-full rounded-lg bg-muted/10" />
              
              {/* Plan cards */}
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl bg-muted/10" />
                <Skeleton className="h-16 w-full rounded-xl bg-muted/10" />
              </div>

              {/* Action row */}
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-12 flex-grow rounded-lg bg-muted/10" />
                <Skeleton className="h-12 w-12 rounded-lg bg-muted/10" />
              </div>
            </div>
          </div>

        </div>

        {/* Tab content panel */}
        <div className="border-t border-border/80 pt-8 space-y-4">
          <div className="flex gap-4 border-b border-border pb-1">
            <Skeleton className="h-8 w-32 bg-muted/10" />
            <Skeleton className="h-8 w-32 bg-muted/10" />
            <Skeleton className="h-8 w-32 bg-muted/10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-muted/10" />
            <Skeleton className="h-4 w-5/6 bg-muted/10" />
            <Skeleton className="h-4 w-2/3 bg-muted/10" />
          </div>
        </div>

      </main>
    </div>
  );
}
