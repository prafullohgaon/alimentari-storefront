import React, { Suspense } from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { Product } from "@/lib/data"; // type only
import { getCollectionProducts, getProductsWithPagination, searchProductsWithPagination } from "@/lib/shopify";
import { RepartoClient } from "@/components/grocery/reparto-client";
import { DICTIONARY } from "@/lib/dictionary";
import { getUnifiedStorefrontNavigation } from "@/lib/cms";
import { SidebarNode } from "@/types/sidebar";
import RepartoLoading from "./loading";

// Map sort options to Shopify keys
const getSortParams = (option: string) => {
  switch (option) {
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    case "newest":
      return { sortKey: "CREATED", reverse: false };
    case "best-selling":
      return { sortKey: "BEST_SELLING", reverse: false };
    case "title":
    case "alphabetical":
      return { sortKey: "TITLE", reverse: false };
    default:
      return { sortKey: undefined, reverse: undefined };
  }
};

interface RepartoSearchParams {
  dept?: string;
  sort?: string;
  page?: string;
  maxPrice?: string;
  minPrice?: string;
  organic?: string;
  dietary?: string;
  brands?: string;
  q?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RepartoSearchParams>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const selectedDept = resolvedParams.dept || "tutti";
  const searchQuery = resolvedParams.q || "";

  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value === "en" ? "en" : "it";
  const dict = DICTIONARY[locale] || DICTIONARY.it;

  let deptName = locale === "en" ? "All Departments" : "Tutti i Reparti";

  if (searchQuery) {
    deptName = locale === "en" ? `Search: "${searchQuery}"` : `Ricerca: "${searchQuery}"`;
  } else if (selectedDept !== "tutti") {
    const categoryKey = selectedDept.toLowerCase();
    if (dict.categories && (dict.categories as Record<string, string>)[categoryKey]) {
      deptName = (dict.categories as Record<string, string>)[categoryKey];
    } else {
      deptName = selectedDept
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  const title = locale === "en"
    ? `${deptName} | Grocery Department`
    : `${deptName} | Reparto Spesa`;

  const description = locale === "en"
    ? `Browse ${deptName} on Alimentari. Authentic Italian gourmet food, certified cold chain delivery across Europe.`
    : `Esplora la selezione di ${deptName} su Alimentari. Gastronomia d'eccellenza italiana e spedizione refrigerata.`;

  const deptUrl = selectedDept !== "tutti"
    ? `https://alimentari.it/reparto?dept=${selectedDept}`
    : "https://alimentari.it/reparto";

  return {
    title,
    description,
    alternates: {
      canonical: deptUrl,
    },
    openGraph: {
      title,
      description,
      url: deptUrl,
      siteName: "Alimentari",
      locale: locale === "en" ? "en_US" : "it_IT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

async function RepartoServerContent({ searchParams }: { searchParams: Promise<RepartoSearchParams> }) {
  const resolvedParams = await searchParams;
  const selectedDept = resolvedParams.dept || "tutti";
  const sortOption = resolvedParams.sort || "default";
  const searchQuery = resolvedParams.q || "";

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("alimentari_locale")?.value;
  const locale = cookieLocale === "en" ? "en" : "it";

  // Fetch unified storefront navigation tree on the server for instant SSR rendering
  let categoryTree: SidebarNode[] = [];
  try {
    categoryTree = await getUnifiedStorefrontNavigation();
  } catch (err) {
    console.error("Failed to load categoryTree in RepartoServerContent:", err);
  }

  // Direct handle resolution from URL parameter
  const handle = selectedDept === "tutti" ? null : selectedDept;
  const { sortKey, reverse } = getSortParams(sortOption);

  let initialProducts: Product[] = [];
  let initialPageInfo = { hasNextPage: false, endCursor: null as string | null };

  try {
    let res;
    if (searchQuery) {
      res = await searchProductsWithPagination({
        searchTerm: searchQuery,
        collectionHandle: handle,
        first: 12,
        sortKey,
        reverse,
        locale,
      });
    } else if (handle === null) {
      res = await getProductsWithPagination({ first: 12, sortKey, reverse, locale });
    } else {
      res = await getCollectionProducts(handle, 12, undefined, sortKey, reverse, locale);
    }
    if (res) {
      initialProducts = res.products;
      initialPageInfo = res.pageInfo;
    }
  } catch (error) {
    console.error("Shopify collections initial server-side query failed:", error);
  }

  return <RepartoClient initialProducts={initialProducts} initialPageInfo={initialPageInfo} categoryTree={categoryTree} />;
}

export default function RepartoPage({ searchParams }: { searchParams: Promise<RepartoSearchParams> }) {
  return (
    <Suspense fallback={<RepartoLoading />}>
      <RepartoServerContent searchParams={searchParams} />
    </Suspense>
  );
}
