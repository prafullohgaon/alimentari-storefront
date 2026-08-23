"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/store/locale";

export function ShippingClient() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const initLocale = useLocaleStore((state) => state.initLocale);

  useEffect(() => {
    initLocale();
  }, [initLocale]);

  useEffect(() => {
    document.title = locale === "en" ? "Shipping Information | Alimentari" : "Spedizioni | Alimentari";
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            {t("shippingPage.pageTitle")}
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            {t("shippingPage.lastUpdated")}
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>{t("shippingPage.intro")}</p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("shippingPage.section1Title")}
            </h2>
            <p>{t("shippingPage.section1Paragraph1")}</p>
            <p>{t("shippingPage.section1Paragraph2")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("shippingPage.section2Title")}
            </h2>
            <p>{t("shippingPage.section2Intro")}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>{t("shippingPage.standardRateLabel")}</strong>{" "}
                {t("shippingPage.standardRateDesc")}
              </li>
              <li>
                <strong>{t("shippingPage.freeShippingLabel")}</strong>{" "}
                {t("shippingPage.freeShippingDesc")}
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("shippingPage.section3Title")}
            </h2>
            <p>{t("shippingPage.section3Paragraph1")}</p>
            <p>{t("shippingPage.section3Paragraph2")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("shippingPage.section4Title")}
            </h2>
            <p>{t("shippingPage.section4Paragraph1")}</p>
            <p>{t("shippingPage.section4Paragraph2")}</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
