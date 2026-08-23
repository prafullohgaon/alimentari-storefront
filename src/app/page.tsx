import React from "react";
import { cookies } from "next/headers";
import { getProducts } from "@/lib/shopify";
import {
  getHomepageHeroSlides,
  HomepageHeroSlide,
  getHomepageAnnouncement,
  HomepageAnnouncement,
  getContactSettings,
  HomepageContactSettings,
  getTrustpilotSettings,
  TrustpilotSettings,
  getHomepageTagline,
  HomepageTagline,
  StorefrontLocale,
} from "@/lib/cms";
import { HomeClient } from "@/components/grocery/home-client";
import { Product } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Define page size for homepage product query
const PAGE_SIZE = 48;

export default async function Home() {
  let products: Product[] = [];
  let heroSlides: HomepageHeroSlide[] = [];
  let announcement: HomepageAnnouncement | null = null;
  let contactSettings: HomepageContactSettings | null = null;
  let trustpilotSettings: TrustpilotSettings | null = null;
  let tagline: HomepageTagline | null = null;

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("alimentari_locale")?.value;
  const locale: StorefrontLocale = cookieLocale === "en" ? "en" : "it";

  try {
    const [productsRes, slidesRes, announcementRes, contactSettingsRes, trustpilotRes, taglineRes] = await Promise.all([
      getProducts(PAGE_SIZE, locale).catch(() => []),
      getHomepageHeroSlides(locale).catch(() => []),
      getHomepageAnnouncement(locale).catch(() => null),
      getContactSettings(locale).catch(() => null),
      getTrustpilotSettings(locale).catch(() => null),
      getHomepageTagline(locale).catch(() => null),
    ]);

    if (productsRes && productsRes.length > 0) {
      products = productsRes;
    }
    if (slidesRes && slidesRes.length > 0) {
      heroSlides = slidesRes;
    }
    if (announcementRes) {
      announcement = announcementRes;
    }
    if (contactSettingsRes) {
      contactSettings = contactSettingsRes;
    }
    if (trustpilotRes) {
      trustpilotSettings = trustpilotRes;
    }
    if (taglineRes) {
      tagline = taglineRes;
    }
    console.log("[PAGE] heroSlides fetched:", JSON.stringify(heroSlides, null, 2));
    console.log("[PAGE] announcement fetched:", JSON.stringify(announcement, null, 2));
    console.log("[PAGE] contactSettings fetched:", JSON.stringify(contactSettings, null, 2));
    console.log("[PAGE] trustpilotSettings fetched:", JSON.stringify(trustpilotSettings, null, 2));
    console.log("[PAGE] tagline fetched:", JSON.stringify(tagline, null, 2));
  } catch (error) {
    console.error("Shopify storefront homepage data fetch failed:", error);
  }

  return (
    <HomeClient
      initialProducts={products}
      heroSlides={heroSlides}
      announcement={announcement}
      contactSettings={contactSettings}
      trustpilotSettings={trustpilotSettings}
      tagline={tagline}
    />
  );
}
