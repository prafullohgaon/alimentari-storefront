"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/store/locale";

export function TermsClient() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const initLocale = useLocaleStore((state) => state.initLocale);

  useEffect(() => {
    initLocale();
  }, [initLocale]);

  useEffect(() => {
    document.title = locale === "en" ? "Terms & Conditions | Alimentari" : "Termini e Condizioni | Alimentari";
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            {t("termsPage.pageTitle")}
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            {t("termsPage.lastUpdated")}
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>{t("termsPage.intro")}</p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("termsPage.section1Title")}
            </h2>
            <p>{t("termsPage.section1Paragraph1")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("termsPage.section2Title")}
            </h2>
            <p>{t("termsPage.section2Paragraph1")}</p>
            <p>{t("termsPage.section2Paragraph2")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("termsPage.section3Title")}
            </h2>
            <p>{t("termsPage.section3Paragraph1")}</p>
            <p>{t("termsPage.section3Paragraph2")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("termsPage.section4Title")}
            </h2>
            <p>{t("termsPage.section4Paragraph1")}</p>
            <p>{t("termsPage.section4Paragraph2")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("termsPage.section5Title")}
            </h2>
            <p>{t("termsPage.section5Intro")}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>{t("termsPage.section5Bullet1")}</li>
              <li>{t("termsPage.section5Bullet2")}</li>
            </ul>
            <p>{t("termsPage.section5Outro")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("termsPage.section6Title")}
            </h2>
            <p>{t("termsPage.section6Paragraph1")}</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
