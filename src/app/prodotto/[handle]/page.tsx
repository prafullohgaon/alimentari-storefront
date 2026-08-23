import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle, getProducts, getProductHandle, getProductRecommendations, getCollectionProducts } from "@/lib/shopify";
import { ProductDetailView } from "@/components/grocery/product-detail-view";

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

import { cookies } from "next/headers";

// 1. Dynamic generateMetadata (SEO, Canonical, OpenGraph)
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value || "it";
  const product = await getProductByHandle(handle, locale);
  
  if (!product) {
    return {
      title: "Prodotto non trovato | Alimentari",
      description: "Il prodotto cercato non è disponibile nel nostro catalogo.",
    };
  }

  const title = `${product.name} | Alimentari Gastronomia`;
  const description = product.description || `Acquista ${product.name} su Alimentari. Gastronomia d'eccellenza, filiera corta italiana e consegna refrigerata certificata.`;
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
      siteName: "Alimentari",
      images: [
        {
          url: product.imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      locale: locale === "en" ? "en_US" : "it_IT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.imageUrl],
    },
  };
}

// 2. generateStaticParams for pre-rendering (SSG)
export async function generateStaticParams() {
  const products = await getProducts(50, "it");
  return products.map((product) => ({
    handle: getProductHandle(product),
  }));
}

import { Product } from "@/lib/data";

// 3. Server Page Component
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

  // Embed JSON-LD structured data for Google Search Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl,
    "description": product.description || `Acquista ${product.name} su Alimentari. Gastronomia d'eccellenza italiana.`,
    "sku": product.sku || `AL-${product.id}`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Alimentari"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://alimentari.it/prodotto/${handle}`,
      "priceCurrency": "EUR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

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
