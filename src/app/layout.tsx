import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { StoreHydration } from "@/components/store-hydration";
import { ErrorBoundary } from "@/components/error-boundary";
import { CookieBanner } from "@/components/grocery/cookie-banner";
import { AuthProvider } from "@/providers/auth-provider";
import { HomeSeo } from "@/app/home-seo";
import { DomSafeguard } from "@/components/dom-safeguard";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const BASE_URL = "https://alimentari.it";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "081 Food & Beverage — Eccellenze Napoletane | Spesa Italiana Online",
    template: "%s | 081 Food & Beverage",
  },
  description:
    "081 Food & Beverage — Eccellenze Napoletane. Acquista prodotti alimentari napoletani e italiani premium online: formaggi DOP, salumi IGP, pasta artigianale, vini e specialità gastronomiche.",
  keywords: [
    "081 Food & Beverage",
    "eccellenze napoletane",
    "spesa italiana online",
    "prodotti italiani",
    "gastronomia italiana",
    "formaggi DOP",
    "salumi IGP",
    "pasta artigianale",
    "vini italiani",
    "consegna alimentari",
    "Italian grocery delivery",
    "Italian food online",
  ],
  authors: [{ name: "081 Food & Beverage", url: BASE_URL }],
  creator: "081 Food & Beverage",
  publisher: "081 Food & Beverage",
  alternates: {
    canonical: BASE_URL,
    languages: {
      "it": `${BASE_URL}/`,
      "en": `${BASE_URL}/`,
      "x-default": `${BASE_URL}/`,
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    alternateLocale: "en_US",
    url: BASE_URL,
    siteName: "081 Food & Beverage",
    title: "081 Food & Beverage — Eccellenze Napoletane | Spesa Italiana Online",
    description:
      "081 Food & Beverage — Eccellenze Napoletane. Acquista prodotti alimentari napoletani e italiani premium online. Formaggi DOP, salumi IGP, pasta artigianale, vini e molto altro.",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "081 Food & Beverage — Eccellenze Napoletane",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "081 Food & Beverage — Eccellenze Napoletane | Spesa Italiana Online",
    description:
      "081 Food & Beverage — Eccellenze Napoletane. Acquista prodotti alimentari napoletani e italiani premium online.",
    images: [`${BASE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "alimentari-google-site-verification",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("alimentari_locale")?.value as "it" | "en") || "it";

  return (
    <html lang={locale} className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <body className="antialiased bg-background text-foreground font-sans">
        <DomSafeguard />
        <HomeSeo />
        <ErrorBoundary>
          <AuthProvider>
            <StoreHydration />
            <CookieBanner />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

