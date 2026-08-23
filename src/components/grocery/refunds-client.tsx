"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/store/locale";

export function RefundsClient() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const initLocale = useLocaleStore((state) => state.initLocale);

  useEffect(() => {
    initLocale();
  }, [initLocale]);

  useEffect(() => {
    document.title = locale === "en" ? "Returns & Refunds | Alimentari" : "Resi & Rimborsi | Alimentari";
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            {t("refundsPage.pageTitle")}
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            {t("refundsPage.lastUpdated")}
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>{t("refundsPage.intro")}</p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("refundsPage.section1Title")}
            </h2>
            <p>{t("refundsPage.section1Paragraph1")}</p>
            <p>{t("refundsPage.section1Paragraph2")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("refundsPage.section2Title")}
            </h2>
            <p>{t("refundsPage.section2Intro")}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>{t("refundsPage.section2Bullet1")}</li>
              <li>{t("refundsPage.section2Bullet2")}</li>
              <li>{t("refundsPage.section2Bullet3")}</li>
            </ul>
            <p className="mt-2">{t("refundsPage.section2Outro")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("refundsPage.section3Title")}
            </h2>
            <p>
              {t("refundsPage.section3Intro")}{" "}
              <code className="bg-card px-1.5 py-0.5 rounded text-xs font-mono">
                {t("refundsPage.section3SupportEmail")}
              </code>
              .
            </p>
            <p>{t("refundsPage.section3ListIntro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("refundsPage.section3Bullet1")}</li>
              <li>{t("refundsPage.section3Bullet2")}</li>
              <li>{t("refundsPage.section3Bullet3")}</li>
            </ul>
            <p className="mt-2">{t("refundsPage.section3Outro")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("refundsPage.section4Title")}
            </h2>
            <p>{t("refundsPage.section4Paragraph1")}</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
