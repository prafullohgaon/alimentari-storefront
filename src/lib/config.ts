/**
 * Returns the environment-aware site URL.
 * Prefers NEXTAUTH_URL, NEXT_PUBLIC_SITE_URL, or VERCEL_URL.
 * Falls back to https://alimentari-storefront.vercel.app in production or localhost in development.
 */
export function getSiteUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "production"
    ? "https://alimentari-storefront.vercel.app"
    : "http://localhost:3000";
}
