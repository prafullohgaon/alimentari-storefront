import { MetadataRoute } from "next";
import { getProducts, getProductHandle } from "@/lib/shopify";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://alimentari.it";

  // Core Static Routes
  const staticRoutes = ["", "/reparto", "/carrello", "/accedi", "/privacy-policy", "/cookie-policy", "/terms", "/shipping", "/refunds"];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => {
    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1.0 : 0.8,
    };
  });

  // Dynamic Product Pages resolved directly from the Shopify / Local database
  let dynamicProductEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts(50);
    dynamicProductEntries = products.map((product) => {
      const handle = getProductHandle(product);
      return {
        url: `${baseUrl}/prodotto/${handle}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      };
    });
  } catch (err) {
    console.error("Sitemap dynamic generation error:", err);
  }

  return [...staticEntries, ...dynamicProductEntries];
}
