"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { customerResetByUrl } from "@/lib/shopify";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/hooks/use-translation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, setLocale, dict } = useTranslation();

  // Extract reset_url or alternative query parameters
  const rawResetUrl =
    searchParams.get("reset_url") ||
    searchParams.get("resetUrl") ||
    searchParams.get("url");
  const paramId = searchParams.get("id");
  const paramToken = searchParams.get("token");

  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "alimentari-store-lshog1qx.myshopify.com";
  let resetUrl = "";

  if (rawResetUrl) {
    const decoded = decodeURIComponent(rawResetUrl);
    // Standardize domain for Shopify Storefront API
    if (decoded.includes("/account/reset/")) {
      const pathSuffix = decoded.substring(decoded.indexOf("/account/reset/"));
      resetUrl = `https://${shopifyDomain}${pathSuffix}`;
    } else {
      resetUrl = decoded;
    }
  } else if (paramId && paramToken) {
    resetUrl = `https://${shopifyDomain}/account/reset/${paramId}/${paramToken}`;
  }

  // Form States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resetUrl) {
      setError(dict.auth.errors.invalidResetLink);
      return;
    }

    if (password.length < 8) {
      setError(dict.auth.errors.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(dict.auth.errors.passwordsMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const res = await customerResetByUrl(resetUrl, password);

      if (res.error || !res.customer) {
        setError(res.error || dict.auth.errors.resetLinkExpired);
        return;
      }

      setSuccess(true);

      // Auto-authenticate customer into NextAuth & Auth Store
      if (res.token) {
        useAuthStore.getState().login(res.token);
      }

      if (res.email) {
        const authRes = await signIn("credentials", {
          email: res.email,
          password: password,
          redirect: false,
        });

        setTimeout(() => {
          if (authRes?.ok) {
            router.push("/account");
            router.refresh();
          } else {
            router.push("/accedi");
          }
        }, 1500);
      } else {
        setTimeout(() => {
          router.push("/accedi");
        }, 2000);
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError(dict.auth.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans select-none justify-between">
      {/* Header Language selection row */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-card select-none">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            A
          </div>
          <span className="font-serif text-lg font-bold text-foreground">Alimentari</span>
        </div>

        {/* Language Switcher */}
        <div className="flex gap-1.5 border border-border rounded-lg p-0.5 bg-muted/10 font-bold text-xs select-none">
          <button
            onClick={() => setLocale("it")}
            className={cn("px-2.5 py-1 rounded", locale === "it" ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
          >
            IT
          </button>
          <button
            onClick={() => setLocale("en")}
            className={cn("px-2.5 py-1 rounded", locale === "en" ? "bg-white text-primary shadow-sm" : "text-muted-foreground")}
          >
            EN
          </button>
        </div>
      </header>

      {/* Main Form Card */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-premium relative overflow-hidden transition-all duration-300">
          <button
            onClick={() => router.push("/accedi")}
            className="absolute left-6 top-6 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {dict.auth.backToLogin}
          </button>

          <div className="text-center space-y-2 mb-6 pt-4">
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {dict.auth.newPasswordTitle}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              {dict.auth.newPasswordSubtitle}
            </p>
          </div>

          {!resetUrl && !error && (
            <div className="p-4 mb-4 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {dict.auth.errors.invalidResetLink}
              </span>
            </div>
          )}

          {success ? (
            <div className="space-y-6 text-center py-6 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-2 select-text">
                <h4 className="font-serif text-lg font-bold text-foreground">
                  {dict.auth.success.passwordUpdatedTitle}
                </h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {dict.auth.success.passwordUpdatedDesc}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {/* New Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
                  {dict.auth.password}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 text-muted-foreground" />}
                    iconPosition="left"
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/10 z-10"
                    aria-label={dict.auth.togglePasswordAria}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
                  {dict.auth.confirmPassword}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 text-muted-foreground" />}
                    iconPosition="left"
                    className="pr-11"
                    required
                  />
                </div>
              </div>

              {/* Error warning bar */}
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm font-bold shadow-soft mt-2"
                isLoading={isLoading}
                disabled={!resetUrl}
              >
                {dict.account.changePasswordBtn}
              </Button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-border/60 bg-card select-none text-center flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-muted-foreground">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <span>© 2026 Alimentari S.r.l. - Tutti i diritti riservati.</span>
        </div>
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary stroke-[2.5]" /> Secure SSL Encryption
        </span>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
