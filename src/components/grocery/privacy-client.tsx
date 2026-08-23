"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/store/locale";

export function PrivacyClient() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const initLocale = useLocaleStore((state) => state.initLocale);

  useEffect(() => {
    initLocale();
  }, [initLocale]);

  useEffect(() => {
    document.title = locale === "en" ? "Privacy Policy | Alimentari" : "Privacy Policy | Alimentari";
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            {t("privacyPage.pageTitle")}
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            {t("privacyPage.lastUpdated")}
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>{t("privacyPage.intro")}</p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("privacyPage.section1Title")}
            </h2>
            <p>
              {t("privacyPage.section1Intro")}<br />
              <strong>{t("privacyPage.companyName")}</strong><br />
              {t("privacyPage.companyAddress")}<br />
              {t("privacyPage.contactEmailLabel")}{" "}
              <code className="bg-card px-1.5 py-0.5 rounded text-xs font-mono">
                {t("privacyPage.contactEmail")}
              </code>
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("privacyPage.section2Title")}
            </h2>
            <p>{t("privacyPage.section2Intro")}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>{t("privacyPage.section2Bullet1Label")}</strong>{" "}
                {t("privacyPage.section2Bullet1Text")}
              </li>
              <li>
                <strong>{t("privacyPage.section2Bullet2Label")}</strong>{" "}
                {t("privacyPage.section2Bullet2Text")}
              </li>
              <li>
                <strong>{t("privacyPage.section2Bullet3Label")}</strong>{" "}
                {t("privacyPage.section2Bullet3Text")}
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("privacyPage.section3Title")}
            </h2>
            <p>{t("privacyPage.section3Intro")}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>{t("privacyPage.section3Bullet1Label")}</strong>{" "}
                {t("privacyPage.section3Bullet1Text")}
              </li>
              <li>
                <strong>{t("privacyPage.section3Bullet2Label")}</strong>{" "}
                {t("privacyPage.section3Bullet2Text")}
              </li>
              <li>
                <strong>{t("privacyPage.section3Bullet3Label")}</strong>{" "}
                {t("privacyPage.section3Bullet3Text")}
              </li>
              <li>
                <strong>{t("privacyPage.section3Bullet4Label")}</strong>{" "}
                {t("privacyPage.section3Bullet4Text")}
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("privacyPage.section4Title")}
            </h2>
            <p>{t("privacyPage.section4Paragraph1")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("privacyPage.section5Title")}
            </h2>
            <p>{t("privacyPage.section5Intro")}</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("privacyPage.section5Bullet1")}</li>
              <li>{t("privacyPage.section5Bullet2")}</li>
              <li>{t("privacyPage.section5Bullet3")}</li>
              <li>{t("privacyPage.section5Bullet4")}</li>
              <li>{t("privacyPage.section5Bullet5")}</li>
              <li>{t("privacyPage.section5Bullet6")}</li>
            </ul>
            <p className="mt-2">
              {t("privacyPage.section5OutroPrefix")}{" "}
              <code className="bg-card px-1.5 py-0.5 rounded text-xs font-mono">
                {t("privacyPage.contactEmail")}
              </code>
              . {t("privacyPage.section5OutroSuffix")}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("privacyPage.section6Title")}
            </h2>
            <p>{t("privacyPage.section6Paragraph1")}</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
