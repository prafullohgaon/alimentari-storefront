import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { ShippingClient } from "@/components/grocery/shipping-client";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value === "en" ? "en" : "it";
  const title = locale === "en" ? "Shipping Information" : "Spedizioni";
  const description = locale === "en"
    ? "Learn about our refrigerated shipping, thermal packaging, and cold chain delivery protocol."
    : "Scopri le nostre modalità di spedizione refrigerata, imballaggi termici e gestione della catena del freddo.";

  return {
    title,
    description,
  };
}

export default function ShippingPage() {
  return <ShippingClient />;
}
