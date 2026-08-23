import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { CookieClient } from "@/components/grocery/cookie-client";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value === "en" ? "en" : "it";
  const title = "Cookie Policy";
  const description = locale === "en"
    ? "Learn about the cookies and tracking technologies used on Alimentari."
    : "Scopri i cookie e le tecnologie di tracciamento utilizzate su Alimentari.";

  return {
    title,
    description,
  };
}

export default function CookiePolicyPage() {
  return <CookieClient />;
}
