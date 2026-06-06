import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://alimentari.it";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",    // Prevent indexing customer reservated fields
        "/checkout",   // Block shopping checkout funnel paths
        "/carrello",   // Block empty or temporary cart paths
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
