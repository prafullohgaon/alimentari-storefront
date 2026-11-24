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
    "name": "081 Food & Beverage",
    "url": BASE_URL,
    "description": "081 Food & Beverage — Eccellenze Napoletane. Authentic Neapolitan and Italian products sourced directly from artisans.",
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
    "name": "081 Food & Beverage",
    "url": BASE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/assets/brand/081-logo-horizontal.png`,
      "width": 760,
      "height": 180
    },
    "description": "081 Food & Beverage — Eccellenze Napoletane. Authentic Neapolitan and Italian gourmet products.",
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
    "sameAs": []
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}/#webpage`,
    "url": BASE_URL,
    "name": "081 Food & Beverage — Eccellenze Napoletane | Spesa Italiana Online",
    "isPartOf": { "@id": `${BASE_URL}/#website` },
    "about": { "@id": `${BASE_URL}/#organization` },
    "description": "081 Food & Beverage — Eccellenze Napoletane. Acquista prodotti alimentari napoletani e italiani premium online.",
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
