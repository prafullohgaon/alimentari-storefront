"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { initAnalytics } from "@/lib/analytics";

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("alimentari_cookies_consent");
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    } else if (consent === "accepted") {
      initAnalytics(true);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    const value = accepted ? "accepted" : "declined";
    localStorage.setItem("alimentari_cookies_consent", value);
    setShowBanner(false);
    initAnalytics(accepted);
  };

  if (!mounted || !showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-sm z-50 bg-[#FAF7F2]/95 backdrop-blur-md border border-[#EFECE6] rounded-2xl p-3 sm:p-4 shadow-xl select-none"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-xs sm:text-sm font-bold text-[#1C3B2B] tracking-tight">
            Informativa Cookie
          </h4>
          <Link href="/cookie-policy" className="text-[10px] text-emerald-800 font-bold underline hover:text-emerald-700">
            Cookie Policy
          </Link>
        </div>
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-600 leading-snug">
          Utilizziamo cookie tecnici per il carrello ed analitici previo consenso.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="flex-1 h-9 min-h-[44px] bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Accetta Tutti
          </button>
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="flex-1 h-9 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 active:scale-95 transition-all cursor-pointer"
          >
            Solo Essenziali
          </button>
        </div>
      </div>
    </div>
  );
}
