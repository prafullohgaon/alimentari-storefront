import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Animated premium logo mark */}
        <div className="w-16 h-16 rounded bg-[#1C3B2B] flex items-center justify-center text-white font-serif text-2xl font-bold mx-auto shadow-premium animate-bounce">
          A
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48 mx-auto bg-espresso/10" />
          <Skeleton className="h-4 w-32 mx-auto bg-espresso/5" />
        </div>
      </div>
    </div>
  );
}
