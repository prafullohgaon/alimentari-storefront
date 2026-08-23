/**
 * HomeSeo — Server Component
 * Renders homepage-specific JSON-LD structured data (WebPage + BreadcrumbList).
 * WebSite and Organization schemas live in layout.tsx (sitewide).
 * This component is imported in layout.tsx and rendered for all routes,
 * but the schemas it outputs are semantically accurate for the homepage.
 */

export function HomeSeo() {
  const BASE_URL = "https://alimentari.it";

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    "name": "Alimentari",
    "url": BASE_URL,
    "description": "Premium Italian Grocery Delivery — Authentic products sourced directly from Italian artisans, delivered across Europe.",
    "inLanguage": ["it", "en"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/reparto?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    "name": "Alimentari",
    "url": BASE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/logo.png`,
      "width": 200,
      "height": 60
    },
    "description": "Premium Italian Grocery Delivery — Authentic products sourced directly from Italian artisans.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IT",
      "addressLocality": "Milano",
      "postalCode": "20121"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Italian", "English"]
      }
    ],
    "sameAs": [
      "https://www.instagram.com/alimentari",
      "https://www.facebook.com/alimentari",
      "https://www.tiktok.com/@alimentari"
    ]
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/#webpage`,
    "url": BASE_URL,
    "name": "Alimentari — Spesa Italiana Online | Premium Italian Grocery Delivery",
    "isPartOf": { "@id": `${BASE_URL}/#website` },
    "about": { "@id": `${BASE_URL}/#organization` },
    "description": "Acquista prodotti alimentari italiani premium online. Formaggi DOP, salumi IGP, pasta artigianale, vini e molto altro. Consegna refrigerata in tutta Europa.",
    "inLanguage": ["it", "en"],
    "breadcrumb": { "@id": `${BASE_URL}/#breadcrumb` }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${BASE_URL}/#breadcrumb`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": BASE_URL
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
