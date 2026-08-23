import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { PrivacyClient } from "@/components/grocery/privacy-client";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("alimentari_locale")?.value === "en" ? "en" : "it";
  const title = "Privacy Policy";
  const description = locale === "en"
    ? "Learn how Alimentari collects, uses, and protects your personal data under GDPR."
    : "Scopri come Alimentari raccoglie, utilizza e protegge i tuoi dati personali in conformità al GDPR.";

  return {
    title,
    description,
  };
}

export default function PrivacyPolicyPage() {
  return <PrivacyClient />;
}
