"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleStore } from "@/store/locale";

export function CookieClient() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const initLocale = useLocaleStore((state) => state.initLocale);

  useEffect(() => {
    initLocale();
  }, [initLocale]);

  useEffect(() => {
    document.title = locale === "en" ? "Cookie Policy | Alimentari" : "Cookie Policy | Alimentari";
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            {t("cookiePage.pageTitle")}
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            {t("cookiePage.lastUpdated")}
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>{t("cookiePage.intro")}</p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("cookiePage.section1Title")}
            </h2>
            <p>{t("cookiePage.section1Paragraph1")}</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("cookiePage.section2Title")}
            </h2>
            <p>{t("cookiePage.section2Intro")}</p>

            <div className="space-y-3 pl-4 border-l-2 border-[#1C3B2B]/20">
              <p>
                <strong>{t("cookiePage.section2CategoryATitle")}</strong><br />
                {t("cookiePage.section2CategoryADesc")}
              </p>
              <p>
                <strong>{t("cookiePage.section2CategoryBTitle")}</strong><br />
                {t("cookiePage.section2CategoryBDesc")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("cookiePage.section3Title")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#EFECE6] text-xs text-left">
                <thead>
                  <tr className="bg-card font-serif border-b border-[#EFECE6]">
                    <th className="p-2 border-r border-[#EFECE6]">{t("cookiePage.tableColIdentifier")}</th>
                    <th className="p-2 border-r border-[#EFECE6]">{t("cookiePage.tableColProvider")}</th>
                    <th className="p-2 border-r border-[#EFECE6]">{t("cookiePage.tableColPurpose")}</th>
                    <th className="p-2">{t("cookiePage.tableColExpiration")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]/50">
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_cart</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie1Provider")}</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie1Purpose")}</td>
                    <td className="p-2">{t("cookiePage.cookie1Expiration")}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_wishlist</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie2Provider")}</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie2Purpose")}</td>
                    <td className="p-2">{t("cookiePage.cookie2Expiration")}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_customer_token</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie3Provider")}</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie3Purpose")}</td>
                    <td className="p-2">{t("cookiePage.cookie3Expiration")}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_cookies_consent</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie4Provider")}</td>
                    <td className="p-2 border-r border-[#EFECE6]">{t("cookiePage.cookie4Purpose")}</td>
                    <td className="p-2">{t("cookiePage.cookie4Expiration")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
              {t("cookiePage.section4Title")}
            </h2>
            <p>{t("cookiePage.section4Paragraph1")}</p>
            <p>{t("cookiePage.section4Paragraph2")}</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
