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
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const BASE_URL = "https://alimentari.it";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Alimentari — Spesa Italiana Online | Premium Italian Grocery Delivery",
    template: "%s | Alimentari",
  },
  description:
    "Acquista prodotti alimentari italiani premium online. Formaggi DOP, salumi IGP, pasta artigianale, vini e molto altro. Consegna refrigerata in tutta Europa da €49.",
  keywords: [
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
  authors: [{ name: "Alimentari", url: BASE_URL }],
  creator: "Alimentari",
  publisher: "Alimentari",
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
    siteName: "Alimentari",
    title: "Alimentari — Spesa Italiana Online | Premium Italian Grocery Delivery",
    description:
      "Acquista prodotti alimentari italiani premium online. Formaggi DOP, salumi IGP, pasta artigianale, vini e molto altro. Consegna refrigerata in tutta Europa da €49.",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Alimentari — Premium Italian Grocery Delivery",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@alimentari",
    creator: "@alimentari",
    title: "Alimentari — Spesa Italiana Online | Premium Italian Grocery Delivery",
    description:
      "Acquista prodotti alimentari italiani premium online. Consegna refrigerata in tutta Europa.",
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

