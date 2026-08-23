import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { RefundsClient } from "@/components/grocery/refunds-client";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value === "en" ? "en" : "it";
  const title = locale === "en" ? "Returns & Refunds" : "Resi & Rimborsi";
  const description = locale === "en"
    ? "Learn about our Return Policy, Freshness Guarantee, and claim procedures for food products."
    : "Scopri la nostra Politica di Resi, Garanzia Freschezza e procedure per prodotti alimentari.";

  return {
    title,
    description,
  };
}

export default function RefundsPage() {
  return <RefundsClient />;
}
