import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { StoreHydration } from "@/components/store-hydration";
import { ErrorBoundary } from "@/components/error-boundary";
import { CookieBanner } from "@/components/grocery/cookie-banner";
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

export const metadata: Metadata = {
  title: "Alimentari — Premium Organic Italian Grocery Delivery",
  description: "Experience premium, organic Italian groceries sourced directly from local artisans. Built for real-world speed, absolute precision, and mobile shopping convenience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <body className="antialiased bg-background text-foreground font-sans">
        <ErrorBoundary>
          <StoreHydration />
          <CookieBanner />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

