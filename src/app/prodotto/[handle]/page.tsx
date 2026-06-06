import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle, getProducts, getProductHandle } from "@/lib/shopify";
import { ProductDetailView } from "@/components/grocery/product-detail-view";

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

// 1. Dynamic generateMetadata (SEO, Canonical, OpenGraph)
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  
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
      locale: "it_IT",
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
  const products = await getProducts(24);
  return products.map((product) => ({
    handle: getProductHandle(product),
  }));
}

// 3. Server Page Component
export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
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
      <ProductDetailView product={product} />
    </>
  );
}
