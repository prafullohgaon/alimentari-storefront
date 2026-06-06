import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]/30 pb-12 flex flex-col font-sans">
      {/* Header Placeholder */}
      <div className="bg-white border-b border-border/60 py-4 px-6 h-16 flex items-center justify-between">
        <Skeleton className="w-8 h-8 rounded bg-muted/10" />
        <Skeleton className="h-6 w-32 bg-muted/10" />
        <Skeleton className="w-10 h-10 rounded bg-muted/10" />
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 flex-grow">
        {/* Header Title */}
        <div className="border-b border-border/80 pb-5 flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 bg-muted/10" />
            <Skeleton className="h-8 w-60 bg-muted/10" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg bg-muted/10" />
        </div>

        {/* Dynamic Split Dashboard Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar (3 columns) */}
          <div className="lg:col-span-3 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-xl bg-muted/10" />
            ))}
          </div>

          {/* Main Account Settings panel (9 columns) */}
          <div className="lg:col-span-9 bg-white border border-border/80 rounded-2xl p-6 md:p-8 shadow-soft space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <Skeleton className="h-6 w-48 bg-muted/10" />
              <Skeleton className="h-4 w-20 bg-muted/10" />
            </div>

            {/* Profile fields or active tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-24 bg-muted/10" />
                  <Skeleton className="h-11 w-full rounded-lg bg-muted/10" />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t flex justify-end">
              <Skeleton className="h-11 w-32 rounded-lg bg-muted/10" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
