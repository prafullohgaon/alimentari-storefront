// src/components/grocery/footer.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import { useTranslation } from "@/hooks/use-translation";
import { getTrustpilotSettings, TrustpilotSettings } from "@/lib/cms";

export interface FooterProps {
  trustpilotSettings?: TrustpilotSettings | null;
}

export function Footer({ trustpilotSettings: initialTrustpilot }: FooterProps = {}) {
  const { t, locale } = useTranslation();
  const [trustpilot, setTrustpilot] = React.useState<TrustpilotSettings | null>(initialTrustpilot || null);

  React.useEffect(() => {
    if (initialTrustpilot) {
      setTrustpilot(initialTrustpilot);
    } else {
      getTrustpilotSettings(locale)
        .then((data) => {
          if (data) setTrustpilot(data);
        })
        .catch(() => {});
    }
  }, [initialTrustpilot, locale]);

  const title = trustpilot?.title;
  const rating = trustpilot?.rating || "4.9";
  const ratingText = trustpilot?.ratingText;
  const reviewCount = trustpilot?.reviewCount || "10.000+";
  const profileUrl = trustpilot?.profileUrl || "https://www.trustpilot.com/review/alimentari.it";

  const shippingCarriers = [
    { name: "UPS", url: "/assets/footer/ups.png" },
    { name: "FERCAM", url: "/assets/footer/fercam.png" },
    { name: "DHL", url: "/assets/footer/dhl.png" },
    { name: "GLS", url: "/assets/footer/gls.png" },
  ];

  const paymentMethodsRow1 = [
    { name: "VISA",        url: "/assets/footer/visa.png" },
    { name: "Mastercard",  url: "/assets/footer/mastercard.png" },
    { name: "PayPal",      url: "/assets/footer/paypal.png" },
    { name: "ApplePay",    url: "/assets/footer/apple-pay.png" },
  ];

  const paymentMethodsRow2 = [
    { name: "GooglePay",   url: "/assets/footer/google-pay.png" },
    { name: "SEPA",        url: "/assets/footer/sepa.png" },
    { name: "Amex",        url: "/assets/footer/amex.png" },
  ];

  return (
    <footer className="font-sans text-white bg-[#111827] select-none antialiased overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
        {/* Responsive Grid System: Mobile 1 column, Tablet 2 columns (6/12), Desktop 4 columns (4/2/2/4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-start">
          {/* Column 1: Brand & Award Badge (Desktop: span 4, Tablet: span 6, Mobile: full) */}
          <div className="lg:col-span-4 space-y-4 w-full max-w-sm">
            <Link href="/" className="inline-block focus:outline-none">
              <Image
                src="/assets/footer/alimentari-logo.svg"
                alt={t("footer.logoAlt")}
                width={260}
                height={70}
                className="w-auto h-12 sm:h-14 max-w-[260px] object-contain"
                priority={false}
              />
            </Link>
            <p className="text-base sm:text-lg font-bold text-slate-200 leading-snug">
              {t("footer.brandText")}
            </p>
            <div className="pt-1">
              <Image
                src="/assets/footer/award-badge.svg"
                alt={t("footer.awardBadgeAlt")}
                width={100}
                height={100}
                className="w-auto h-20 sm:h-24 max-w-[100px] object-contain"
              />
            </div>
          </div>

          {/* Column 2: Customer Support (Desktop: span 2, Tablet: span 3, Mobile: full) */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 border-b border-slate-800 pb-2">
              {t("footer.supportTitle")}
            </h5>
            <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-300">
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.contactUs")}</Link></li>
              <li><Link href="/shipping" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.faq")}</Link></li>
              <li><Link href="/account" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.orders")}</Link></li>
              <li><Link href="/refunds" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.returns")}</Link></li>
              <li><Link href="/refunds" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.refunds")}</Link></li>
              <li><Link href="/shipping" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.shipping")}</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.privacyPolicy")}</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.cookieLaw")}</Link></li>
            </ul>
          </div>

          {/* Column 3: Company Info (Desktop: span 2, Tablet: span 3, Mobile: full) */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 border-b border-slate-800 pb-2">
              {t("footer.companyTitle")}
            </h5>
            <ul className="space-y-2 text-xs sm:text-sm font-medium text-slate-300">
              <li><Link href="/reparto" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.aboutUs")}</Link></li>
              <li><Link href="/reparto" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.reviews")}</Link></li>
              <li><Link href="/account" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.account")}</Link></li>
              <li><Link href="/account?tab=wishlist" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.wishlist")}</Link></li>
              <li><Link href="/reparto" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.producers")}</Link></li>
              <li><Link href="/reparto" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.giftCard")}</Link></li>
              <li><Link href="/reparto" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.blog")}</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors block py-0.5">{t("footer.links.termsAndConditions")}</Link></li>
            </ul>
          </div>

          {/* Column 4: Shipping & Payment Logos (Desktop: span 4, Tablet: span 6, Mobile: full) */}
          <div className="lg:col-span-4 space-y-5 w-full">
            {/* Shipping Carriers */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 border-b border-slate-800 pb-2">
                {t("footer.shippingTitle")}
              </h5>
              <div className="flex flex-wrap gap-2.5 items-center">
                {shippingCarriers.map((c) => (
                  <div
                    key={c.name}
                    className="h-10 px-3 flex items-center justify-center bg-white rounded-xl border border-slate-200/30 shadow-xs hover:shadow-md transition-all"
                  >
                    <Image
                      src={c.url}
                      alt={c.name}
                      width={44}
                      height={24}
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 border-b border-slate-800 pb-2">
                {t("footer.paymentTitle")}
              </h5>
              <div className="flex flex-wrap gap-2 items-center max-w-xs">
                {[...paymentMethodsRow1, ...paymentMethodsRow2].map((m) => (
                  <div
                    key={m.name}
                    className="h-9 px-2.5 flex items-center justify-center bg-white rounded-lg border border-slate-200/30 shadow-xs hover:shadow-md transition-all"
                  >
                    <Image
                      src={m.url}
                      alt={m.name}
                      width={40}
                      height={22}
                      className="h-5 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Zigzag divider */}
        <div className="my-6 h-4 bg-[url('/assets/footer/zigzag.svg')] bg-repeat-x bg-contain opacity-80" />

        {/* Social Icons */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 pt-2">
          <span role="img" aria-label={t("footer.socialAria.facebook")} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm cursor-default"><FaFacebookF className="w-5 h-5"/></span>
          <span role="img" aria-label={t("footer.socialAria.instagram")} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm cursor-default"><FaInstagram className="w-5 h-5"/></span>
          <span role="img" aria-label={t("footer.socialAria.tiktok")} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm cursor-default"><FaTiktok className="w-5 h-5"/></span>
          <span role="img" aria-label={t("footer.socialAria.youtube")} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm cursor-default"><FaYoutube className="w-5 h-5"/></span>
          <span role="img" aria-label={t("footer.socialAria.linkedin")} className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm cursor-default"><FaLinkedinIn className="w-5 h-5"/></span>
        </div>

        {/* Trustpilot Horizontal Bar */}
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-wrap items-center justify-center gap-2 py-2 text-xs sm:text-sm text-slate-300 font-medium hover:text-white transition-colors group"
        >
          {title && (
            <span className="font-bold text-white text-sm sm:text-base group-hover:underline">
              {title}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.455a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.455a1 1 0 00-1.175 0l-3.37 2.455c-.784.57-1.838-.197-1.539-1.118l1.285-3.957a1 1 0 00-.363-1.118L2.07 9.384c-.784-.57-.38-1.81.588-1.81h4.163a1 1 0 00.951-.69l1.286-3.957z"/>
              </svg>
            ))}
          </div>
          <span className="font-bold text-slate-100 text-sm sm:text-base">
            {rating} • {reviewCount}
          </span>
          {ratingText && (
            <span className="text-slate-300 text-sm sm:text-base">
              {ratingText}
            </span>
          )}
          <Image src="/assets/footer/trustpilot-logo.svg" alt={t("footer.trustpilotAlt")} width={75} height={18} className="h-4 w-auto" />
        </a>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-slate-800 text-slate-400 text-[11px] leading-relaxed text-center space-y-1">
          <span className="block">{t("footer.tagline")}</span>
          <span className="block text-slate-500">{t("footer.copyright")}</span>
        </div>

      </div>
    </footer>
  );
}
