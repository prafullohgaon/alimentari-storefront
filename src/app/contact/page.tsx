import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { getContactSettings, StorefrontLocale } from "@/lib/cms";
import { ContactClient } from "@/components/grocery/contact-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Contattaci | Alimentari Gourmet Market",
  description:
    "Mettiti in contatto con il team di Alimentari Gourmet Market per qualsiasi informazione sui prodotti tipici italiani o assistenza sugli ordini.",
};

export default async function ContactPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("alimentari_locale")?.value;
  const locale: StorefrontLocale = cookieLocale === "en" ? "en" : "it";

  let contactSettings = null;
  try {
    contactSettings = await getContactSettings(locale);
  } catch (err) {
    console.error("Failed to fetch contact settings for contact page:", err);
  }

  return <ContactClient contactSettings={contactSettings} />;
}
