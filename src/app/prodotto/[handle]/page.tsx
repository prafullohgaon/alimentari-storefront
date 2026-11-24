import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  getProductByHandle,
  getProductSeoMetadata,
  getProductRecommendations,
  getCollectionProducts,
  buildProductJsonLd,
} from "@/lib/shopify";
import { ProductDetailView } from "@/components/grocery/product-detail-view";
import { Product } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

// 1. Dynamic generateMetadata (SEO, Canonical, OpenGraph)
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value || "it";
  const productMeta =
    (await getProductSeoMetadata(handle, locale)) ||
    (await getProductByHandle(handle, locale));

  if (!productMeta) {
    return {
      title: "Prodotto non trovato | 081 Food & Beverage",
      description: "Il prodotto cercato non è disponibile nel nostro catalogo.",
    };
  }

  const title = `${productMeta.name} | 081 Food & Beverage`;
  const description =
    productMeta.description ||
    `Acquista ${productMeta.name} su 081 Food & Beverage — Eccellenze Napoletane. Gastronomia d'eccellenza, filiera corta italiana e consegna refrigerata certificata.`;
  const productUrl = `https://alimentari.it/prodotto/${handle}`;

  return {
    title,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: "081 Food & Beverage",
      images: [
        {
          url: productMeta.imageUrl,
          width: 800,
          height: 800,
          alt: productMeta.name,
        },
      ],
      locale: locale === "en" ? "en_US" : "it_IT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [productMeta.imageUrl],
    },
  };
}

// 2. Server Page Component
export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value || "it";

  console.log("[ProductPage] Requested handle:", handle, "locale:", locale);
  const product = await getProductByHandle(handle, locale);

  if (!product) {
    console.log("[ProductPage] Product is null for handle:", handle, "-> Calling notFound()");
    notFound();
  }

  console.log("[ProductPage] Rendering Product ID:", product.id, "Title:", product.name);

  // Fetch recommendations on the server
  let relatedProducts: Product[] = [];
  try {
    relatedProducts = await getProductRecommendations(product.id, locale);
  } catch (err) {
    console.error("Recommendations query failed on server:", err);
  }

  // Fallback to same collection products if recommendations is empty
  if (!relatedProducts || relatedProducts.length === 0) {
    try {
      const collectionHandle = product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await getCollectionProducts(collectionHandle, 5, undefined, undefined, undefined, locale);
      relatedProducts = res.products.filter((p: Product) => p.id !== product.id).slice(0, 4);
    } catch (err) {
      console.error("Collection fallback failed on server:", err);
    }
  }

  // Embed JSON-LD structured data for Google Search Snippets using the default available variant
  const jsonLd = buildProductJsonLd(product, handle);

  return (
    <>
      {/* JSON-LD Script tag for Google Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </>
  );
}
