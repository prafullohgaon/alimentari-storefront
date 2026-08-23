// src/lib/cms.ts
import { shopifyFetch } from "./shopify";

export type StorefrontLocale = "it" | "en";

export function toShopifyLanguage(locale?: StorefrontLocale): { language: "IT" | "EN"; country: "IT" | "US" } {
  if (locale === "en") return { language: "EN", country: "US" };
  return { language: "IT", country: "IT" };
}

export interface ShopifyMenuItem {
  id: string;
  title: string;
  url: string | null;
  handle: string;
  items: ShopifyMenuItem[];
}

export interface ShopifyMenuResult {
  id: string;
  title: string;
  items: ShopifyMenuItem[];
}

// Utility to dynamically parse handles from Shopify Navigation URLs
export function extractHandleFromUrl(url: string | null): string {
  if (!url) return "";
  try {
    // Check if it's a relative path or an absolute URL
    const cleanUrl = url.startsWith("/") ? `https://localhost${url}` : url;
    const urlObj = new URL(cleanUrl);
    // 1. Handle query param: ?dept=handle
    const deptParam = urlObj.searchParams.get("dept");
    if (deptParam) return deptParam;

    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    // 2. Handle Shopify collection URL structure: /collections/handle
    const collectionsIndex = pathParts.indexOf("collections");
    if (collectionsIndex !== -1 && pathParts[collectionsIndex + 1]) {
      return pathParts[collectionsIndex + 1];
    }

    // 3. Fallback to last segment of pathname
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1];
    }
  } catch (err) {
    console.error("Failed to parse menu handle from URL:", url, err);
  }
  // Final fallback: return slugified title
  return "";
}

export interface RawMenuItem {
  id?: string;
  title?: string;
  url?: string | null;
  items?: RawMenuItem[];
}

// Recursive parser to build menu structure with dynamic handles
function parseMenuItems(items: RawMenuItem[], parentHandle: string = ""): ShopifyMenuItem[] {
  return items.map((item) => {
    const rawUrl = item.url || null;
    let handle = extractHandleFromUrl(rawUrl);
    // If handle extraction returned empty OR matches parent handle, fallback to clean slug from item's own title
    if ((!handle || (parentHandle && handle === parentHandle)) && item.title) {
      handle = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    return {
      id: item.id || `menu-item-${Math.random()}`,
      title: item.title || "",
      url: rawUrl,
      handle,
      items: item.items ? parseMenuItems(item.items, handle) : [],
    };
  });
}

/**
 * Fetch a Shopify Navigation Menu by its handle (e.g., "main-menu")
 */
export async function getStorefrontMenu(menuHandle: string): Promise<ShopifyMenuResult | null> {
  const query = `
    query GetStorefrontMenu($handle: String!) {
      menu(handle: $handle) {
        id
        title
        items {
          id
          title
          url
          items {
            id
            title
            url
            items {
              id
              title
              url
            }
          }
        }
      }
    }
  `;

  try {
    const res = await shopifyFetch<{ menu: { id: string; title: string; items: RawMenuItem[] } }>(query, { handle: menuHandle });
    if (res?.data?.menu) {
      const rawMenu = res.data.menu;
      return {
        id: rawMenu.id,
        title: rawMenu.title,
        items: parseMenuItems(rawMenu.items || []),
      };
    }
  } catch (err) {
    console.error(`Failed to fetch menu ${menuHandle} from Shopify:`, err);
  }

  return null;
}

import { SidebarNode } from "@/types/sidebar";

export function convertMenuItemsToSidebarNodes(items: ShopifyMenuItem[], level = 0): SidebarNode[] {
  return items.map((item) => ({
    id: item.id,
    name: item.title,
    handle: item.handle,
    level,
    count: 0,
    children: item.items ? convertMenuItemsToSidebarNodes(item.items, level + 1) : [],
  }));
}

import { sidebarData } from "@/data/sidebar";

export async function getUnifiedStorefrontNavigation(): Promise<SidebarNode[]> {
  // 1. Try dedicated reparti or categories menu from Shopify Admin
  const departmentMenu = (await getStorefrontMenu("reparti-menu")) || (await getStorefrontMenu("categories-menu"));
  if (departmentMenu && departmentMenu.items && departmentMenu.items.length > 0) {
    return convertMenuItemsToSidebarNodes(departmentMenu.items, 0);
  }

  // 2. Try main-menu from Shopify Admin and extract ONLY the Catalog category branch
  const mainMenu = await getStorefrontMenu("main-menu");
  if (mainMenu && mainMenu.items && mainMenu.items.length > 0) {
    // Find Catalog parent item in main-menu
    const catalogItem = mainMenu.items.find((item) => {
      const titleLower = item.title.toLowerCase();
      const handleLower = item.handle.toLowerCase();
      return (
        titleLower === "catalog" ||
        handleLower === "all" ||
        handleLower === "catalog" ||
        titleLower === "categories" ||
        titleLower === "reparti" ||
        titleLower === "tutti i reparti" ||
        titleLower === "all departments"
      );
    });

    // Extract ONLY Catalog.items for /reparto sidebar category branch
    if (catalogItem && catalogItem.items && catalogItem.items.length > 0) {
      return convertMenuItemsToSidebarNodes(catalogItem.items, 0);
    }

    // Filter out top-level non-category utility page links if Catalog has no sub-items
    const categoryBranch = mainMenu.items.filter((item) => {
      const titleLower = item.title.toLowerCase();
      const handleLower = item.handle.toLowerCase();
      return (
        !["home", "contact", "contatti", "offers", "offerte", "about", "chi-siamo"].includes(titleLower) &&
        !["home", "contact", "contatti", "offers", "offerte", "about", "chi-siamo"].includes(handleLower)
      );
    });

    if (categoryBranch.length > 0) {
      return convertMenuItemsToSidebarNodes(categoryBranch, 0);
    }
  }

  // 3. Emergency fallback to static sidebar structure if no Shopify menu items exist
  return sidebarData.sidebar.departments;
}

export const getStorefrontSidebarTree = getUnifiedStorefrontNavigation;

// ─── Homepage Hero Slide Metaobject Integration ──────────────────────────────

export interface HomepageHeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  buttonText: string;
  buttonLink: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

interface RawMetafieldReference {
  image?: {
    url: string;
    altText?: string | null;
  } | null;
}

interface RawMetafieldField {
  key: string;
  value: string;
  reference?: RawMetafieldReference | null;
}

interface RawMetaobjectNode {
  id: string;
  fields: RawMetafieldField[];
}

interface StorefrontHeroSlidesQueryResponse {
  metaobjects: {
    edges: Array<{
      node: RawMetaobjectNode;
    }>;
  };
}

const GET_HOMEPAGE_HERO_SLIDES_QUERY = `
  query GetHomepageHeroSlides($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    metaobjects(type: "homepage_hero_slide", first: 20) {
      edges {
        node {
          id
          fields {
            key
            value
            reference {
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetches, filters, schedules, and sorts homepage_hero_slide Metaobjects from Shopify Storefront API.
 */
export async function getHomepageHeroSlides(locale: StorefrontLocale = "it"): Promise<HomepageHeroSlide[]> {
  try {
    const { country, language } = toShopifyLanguage(locale);
    const res = await shopifyFetch<StorefrontHeroSlidesQueryResponse>(
      GET_HOMEPAGE_HERO_SLIDES_QUERY,
      { country, language },
      { cache: "no-store" }
    );


    const edges = res?.data?.metaobjects?.edges || [];
    if (edges.length === 0) return [];

    const now = new Date();

    const slides: HomepageHeroSlide[] = edges
      .map(({ node }) => {
        const fieldMap = new Map<string, { value: string; reference?: RawMetafieldReference | null }>();
        node.fields.forEach((f) => fieldMap.set(f.key, f));

        const title = fieldMap.get("title")?.value || "";
        const subtitle = fieldMap.get("subtitle")?.value || undefined;
        const badgeText = fieldMap.get("badge_text")?.value || undefined;
        const buttonText = fieldMap.get("button_text")?.value || "";
        const buttonLink = fieldMap.get("button_link")?.value || "";
        const sortOrder = Number(fieldMap.get("sort_order")?.value) || 0;
        const isActive = fieldMap.get("is_active")?.value === "true";
        const startDate = fieldMap.get("start_date")?.value || undefined;
        const endDate = fieldMap.get("end_date")?.value || undefined;


        // Image URL resolution from file_reference
        const desktopImageRef = fieldMap.get("desktop_image")?.reference;
        const desktopImageUrl = desktopImageRef?.image?.url || "";

        const mobileImageRef = fieldMap.get("mobile_image")?.reference;
        const mobileImageUrl = mobileImageRef?.image?.url || undefined;

        return {
          id: node.id,
          title,
          subtitle,
          badgeText,
          desktopImageUrl,
          mobileImageUrl,
          buttonText,
          buttonLink,
          sortOrder,
          isActive,
          startDate,
          endDate,
        };
      })
      .filter((slide) => {
        // Must be active and have a valid title, buttonText, buttonLink, and desktopImageUrl
        if (!slide.isActive || !slide.title || !slide.desktopImageUrl || !slide.buttonText || !slide.buttonLink) {
          return false;
        }

        // Campaign scheduling check
        if (slide.startDate && new Date(slide.startDate) > now) return false;
        if (slide.endDate && new Date(slide.endDate) < now) return false;

        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return slides;
  } catch (error) {
    console.error("[CMS] Error fetching homepage hero slides from Shopify:", error);
    return [];
  }
}

// ─── Homepage Announcement Bar Metaobject Integration ───────────────────────

export interface HomepageAnnouncement {
  id: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
  icon?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
}

interface StorefrontAnnouncementQueryResponse {
  metaobjects: {
    edges: Array<{
      node: {
        id: string;
        fields: Array<{
          key: string;
          value: string;
        }>;
      };
    }>;
  };
}

const GET_HOMEPAGE_ANNOUNCEMENT_QUERY = `
  query GetHomepageAnnouncement($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    metaobjects(type: "homepage_announcement", first: 20) {
      edges {
        node {
          id
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

/**
 * Fetches, filters, schedules, and sorts homepage_announcement Metaobjects from Shopify Storefront API.
 * Returns the first active announcement within date window sorted by sort_order ascending, or null.
 */
export async function getHomepageAnnouncement(locale: StorefrontLocale = "it"): Promise<HomepageAnnouncement | null> {
  try {
    const { country, language } = toShopifyLanguage(locale);
    const res = await shopifyFetch<StorefrontAnnouncementQueryResponse>(
      GET_HOMEPAGE_ANNOUNCEMENT_QUERY,
      { country, language },
      { cache: "no-store" }
    );

    const edges = res?.data?.metaobjects?.edges || [];
    if (edges.length === 0) return null;

    const now = new Date();

    const announcements: HomepageAnnouncement[] = edges
      .map(({ node }) => {
        const fieldMap = new Map<string, string>();
        node.fields.forEach((f) => fieldMap.set(f.key, f.value));

        const message = fieldMap.get("message") || "";
        const linkText = fieldMap.get("link_text") || undefined;
        const linkUrl = fieldMap.get("link_url") || undefined;
        const icon = fieldMap.get("icon") || undefined;
        const isActive = fieldMap.get("is_active") === "true";
        const startDate = fieldMap.get("start_date") || undefined;
        const endDate = fieldMap.get("end_date") || undefined;
        const sortOrder = Number(fieldMap.get("sort_order")) || 0;

        return {
          id: node.id,
          message,
          linkText,
          linkUrl,
          icon,
          isActive,
          startDate,
          endDate,
          sortOrder,
        };
      })
      .filter((ann) => {
        if (!ann.isActive || !ann.message) return false;
        if (ann.startDate && new Date(ann.startDate) > now) return false;
        if (ann.endDate && new Date(ann.endDate) < now) return false;
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return announcements[0] || null;
  } catch (error) {
    console.error("[CMS] Error fetching homepage announcement from Shopify:", error);
    return null;
  }
}

// ─── Contact / Help Settings Metaobject Integration ──────────────────────────

export interface HomepageContactSettings {
  id: string;
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonUrl: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  isActive: boolean;
  heroEyebrow?: string;
  heroDescription?: string;
  hoursLabel?: string;
  hoursDetail?: string;
  locationLabel?: string;
  locationAddress?: string;
}

interface StorefrontContactSettingsQueryResponse {
  metaobjects: {
    edges: Array<{
      node: {
        id: string;
        fields: Array<{
          key: string;
          value: string;
        }>;
      };
    }>;
  };
}

const GET_CONTACT_SETTINGS_QUERY = `
  query GetContactSettings($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    metaobjects(type: "contact_settings", first: 10) {
      edges {
        node {
          id
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

/**
 * Fetches and returns active contact_settings from Shopify Storefront API.
 */
export async function getContactSettings(locale: StorefrontLocale = "it"): Promise<HomepageContactSettings | null> {
  try {
    const { country, language } = toShopifyLanguage(locale);
    const res = await shopifyFetch<StorefrontContactSettingsQueryResponse>(
      GET_CONTACT_SETTINGS_QUERY,
      { country, language },
      { cache: "no-store" }
    );

    const edges = res?.data?.metaobjects?.edges || [];
    if (edges.length === 0) return null;

    const validEntries: HomepageContactSettings[] = edges
      .map(({ node }) => {
        const fieldMap = new Map<string, string>();
        node.fields.forEach((f) => fieldMap.set(f.key, f.value));

        const title = fieldMap.get("title") || "";
        const subtitle = fieldMap.get("subtitle") || undefined;
        const buttonText = fieldMap.get("button_text") || "";
        const buttonUrl = fieldMap.get("button_url") || "";
        const phone = fieldMap.get("phone") || undefined;
        const email = fieldMap.get("email") || undefined;
        const whatsapp = fieldMap.get("whatsapp") || undefined;
        const isActive = fieldMap.get("is_active") === "true";

        const heroEyebrow = fieldMap.get("hero_eyebrow") || undefined;
        const heroDescription = fieldMap.get("hero_description") || undefined;
        const hoursLabel = fieldMap.get("hours_label") || undefined;
        const hoursDetail = fieldMap.get("hours_detail") || undefined;
        const locationLabel = fieldMap.get("location_label") || undefined;
        const locationAddress = fieldMap.get("location_address") || undefined;

        return {
          id: node.id,
          title,
          subtitle,
          buttonText,
          buttonUrl,
          phone,
          email,
          whatsapp,
          isActive,
          heroEyebrow,
          heroDescription,
          hoursLabel,
          hoursDetail,
          locationLabel,
          locationAddress,
        };
      })
      .filter((entry) => entry.isActive && entry.title && entry.buttonText && entry.buttonUrl);

    return validEntries[0] || null;
  } catch (error) {
    console.error("[CMS] Error fetching contact settings from Shopify:", error);
    return null;
  }
}

// ─── Trustpilot Review Strip Metaobject Integration ─────────────────────────

export interface TrustpilotSettings {
  id: string;
  title: string;
  rating: string;
  reviewCount: string;
  ratingText?: string;
  profileUrl?: string;
  isActive: boolean;
}

interface StorefrontTrustpilotSettingsQueryResponse {
  metaobjects: {
    edges: Array<{
      node: {
        id: string;
        fields: Array<{
          key: string;
          value: string;
        }>;
      };
    }>;
  };
}

const GET_TRUSTPILOT_SETTINGS_QUERY = `
  query GetTrustpilotSettings($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    metaobjects(type: "trustpilot_settings", first: 10) {
      edges {
        node {
          id
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

/**
 * Fetches and returns active trustpilot_settings from Shopify Storefront API.
 */
export async function getTrustpilotSettings(locale: StorefrontLocale = "it"): Promise<TrustpilotSettings | null> {
  try {
    const { country, language } = toShopifyLanguage(locale);
    const res = await shopifyFetch<StorefrontTrustpilotSettingsQueryResponse>(
      GET_TRUSTPILOT_SETTINGS_QUERY,
      { country, language },
      { cache: "no-store" }
    );

    const edges = res?.data?.metaobjects?.edges || [];
    if (edges.length === 0) return null;

    const validEntries: TrustpilotSettings[] = edges
      .map(({ node }) => {
        const fieldMap = new Map<string, string>();
        node.fields.forEach((f) => fieldMap.set(f.key, f.value));

        const title = fieldMap.get("title") || "";
        const rating = fieldMap.get("rating") || "";
        const reviewCount = fieldMap.get("review_count") || "";
        const ratingText = fieldMap.get("rating_text") || undefined;
        const profileUrl = fieldMap.get("profile_url") || undefined;
        const isActive = fieldMap.get("is_active") === "true";

        return {
          id: node.id,
          title,
          rating,
          reviewCount,
          ratingText,
          profileUrl,
          isActive,
        };
      })
      .filter((entry) => entry.isActive && entry.title && entry.rating && entry.reviewCount);

    return validEntries[0] || null;
  } catch (error) {
    console.error("[CMS] Error fetching trustpilot settings from Shopify:", error);
    return null;
  }
}

// ─── Homepage Tagline Metaobject Integration ────────────────────────────────

export interface HomepageTagline {
  id: string;
  title: string;
  subtitle?: string;
  linkText?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

interface StorefrontHomepageTaglineQueryResponse {
  metaobjects: {
    edges: Array<{
      node: {
        id: string;
        fields: Array<{
          key: string;
          value: string;
        }>;
      };
    }>;
  };
}

const GET_HOMEPAGE_TAGLINE_QUERY = `
  query GetHomepageTagline($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    metaobjects(type: "homepage_tagline", first: 10) {
      edges {
        node {
          id
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

/**
 * Fetches and returns active homepage_tagline from Shopify Storefront API.
 */
export async function getHomepageTagline(locale: StorefrontLocale = "it"): Promise<HomepageTagline | null> {
  try {
    const { country, language } = toShopifyLanguage(locale);
    const res = await shopifyFetch<StorefrontHomepageTaglineQueryResponse>(
      GET_HOMEPAGE_TAGLINE_QUERY,
      { country, language },
      { cache: "no-store" }
    );

    const edges = res?.data?.metaobjects?.edges || [];
    if (edges.length === 0) return null;

    const validEntries: HomepageTagline[] = edges
      .map(({ node }) => {
        const fieldMap = new Map<string, string>();
        node.fields.forEach((f) => fieldMap.set(f.key, f.value));

        const title = fieldMap.get("title") || "";
        const subtitle = fieldMap.get("subtitle") || undefined;
        const linkText = fieldMap.get("link_text") || undefined;
        const linkUrl = fieldMap.get("link_url") || undefined;
        const isActive = fieldMap.get("is_active") === "true";
        const sortOrderStr = fieldMap.get("sort_order") || "0";
        const sortOrder = parseInt(sortOrderStr, 10) || 0;

        return {
          id: node.id,
          title,
          subtitle,
          linkText,
          linkUrl,
          isActive,
          sortOrder,
        };
      })
      .filter((entry) => entry.isActive && entry.title)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return validEntries[0] || null;
  } catch (error) {
    console.error("[CMS] Error fetching homepage tagline from Shopify:", error);
    return null;
  }
}
