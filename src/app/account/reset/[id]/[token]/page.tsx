import { redirect } from "next/navigation";

export default async function AccountResetRedirectPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "alimentari-store-lshog1qx.myshopify.com";
  const shopifyResetUrl = `https://${domain}/account/reset/${id}/${token}`;
  redirect(`/accedi/reset?reset_url=${encodeURIComponent(shopifyResetUrl)}`);
}
