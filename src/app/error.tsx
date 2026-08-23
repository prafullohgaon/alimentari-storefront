"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Unhandled Application Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between items-center p-6 select-none font-sans">
      <div className="flex-grow flex flex-col items-center justify-center text-center max-w-md my-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center border border-error/20 shadow-soft">
          <AlertTriangle className="w-8 h-8 stroke-[2]" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Si è verificato un errore
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Si è verificato un problema temporaneo durante il caricamento della pagina. Il nostro team è stato notificato.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <Button
            onClick={() => reset()}
            variant="primary"
            className="flex-1 font-bold text-xs h-11 shadow-soft flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Ricarica Pagina
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="flex-1 font-bold text-xs h-11 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Torna alla Home
          </Button>
        </div>
      </div>

      <footer className="text-[10px] text-muted-foreground font-semibold">
        Alimentari Storefront • System Status OK
      </footer>
    </div>
  );
}
