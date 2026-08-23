import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept any password reset URL (/account/reset/...) and forward to /accedi/reset
  if (pathname.startsWith("/account/reset")) {
    const parts = pathname.replace(/^\/account\/reset\/?/, "");
    const target = new URL("/accedi/reset", request.url);
    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "alimentari-store-lshog1qx.myshopify.com";
    if (parts) {
      target.searchParams.set(
        "reset_url",
        `https://${domain}/account/reset/${parts}`
      );
    }
    return NextResponse.redirect(target);
  }

  // Cryptographically verify NextAuth JWT token signature and expiration
  const token = await getToken({ req: request, secret });

  // Protect /account and all sub-routes (/account/*)
  if (pathname.startsWith("/account")) {
    if (!token) {
      const loginUrl = new URL("/accedi", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from /accedi
  if (pathname === "/accedi") {
    if (token) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/accedi"],
};
