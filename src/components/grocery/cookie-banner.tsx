"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { initAnalytics } from "@/lib/analytics";

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent has already been saved on the client
    const consent = localStorage.getItem("alimentari_cookies_consent");
    if (!consent) {
      // Small delay for natural page load flow
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    } else if (consent === "accepted") {
      // Direct telemetry triggers on immediate reload
      initAnalytics(true);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    const value = accepted ? "accepted" : "declined";
    localStorage.setItem("alimentari_cookies_consent", value);
    setShowBanner(false);

    // Trigger dynamic telemetry init
    initAnalytics(accepted);
  };

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-sm z-50 bg-[#FAF7F2]/95 backdrop-blur-md border border-[#EFECE6] rounded-xl p-4.5 shadow-premium animate-slideIn select-none"
    >
      <div className="space-y-3">
        <h4 className="font-serif text-sm font-bold text-[#1C3B2B] tracking-tight">
          Informativa sui Cookie
        </h4>
        <p className="text-[11px] font-semibold text-muted-foreground leading-normal">
          Utilizziamo cookie tecnici essenziali per il funzionamento del carrello. Con il tuo consenso, abilitiamo cookie analitici per migliorare il servizio. Leggi la nostra{" "}
          <Link href="/cookie-policy" className="underline hover:text-primary transition-colors">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => handleConsent(true)}
            className="flex-grow h-8 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[11px] rounded-lg shadow-sm transition-all"
          >
            Accetta Tutti
          </button>
          <button
            onClick={() => handleConsent(false)}
            className="px-3 h-8 bg-transparent text-muted-foreground hover:text-foreground font-bold text-[11px] transition-all"
          >
            Solo Essenziali
          </button>
        </div>
      </div>
    </div>
  );
}
