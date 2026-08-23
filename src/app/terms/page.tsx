import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { TermsClient } from "@/components/grocery/terms-client";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value === "en" ? "en" : "it";
  const title = locale === "en" ? "Terms & Conditions" : "Termini e Condizioni";
  const description = locale === "en"
    ? "Read the General Terms and Conditions of Sale governing purchases on Alimentari."
    : "Leggi le Condizioni Generali di Vendita che disciplinano gli acquisti su Alimentari.";

  return {
    title,
    description,
  };
}

export default function TermsPage() {
  return <TermsClient />;
}
