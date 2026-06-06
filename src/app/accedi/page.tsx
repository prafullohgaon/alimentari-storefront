"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Eye, EyeOff, User, ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerLogin, customerRegister, customerRecover } from "@/lib/shopify";

import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/hooks/use-translation";

export default function AuthPage() {
  const router = useRouter();
  const { locale, setLocale, dict: t } = useTranslation();
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Auto redirect if already authenticated
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeToken = useAuthStore.getState().token;
      if (activeToken) {
        router.push("/account");
      }
    }
  }, [router]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError(locale === "it" ? "Inserisci la tua email" : "Please enter your email");
      return;
    }
    if (view !== "forgot" && !password) {
      setError(locale === "it" ? "Inserisci la tua password" : "Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      if (view === "login") {
        const { token: fetchedToken, error: loginErr } = await customerLogin(email, password);
        if (loginErr) {
          setError(loginErr);
        } else if (fetchedToken) {
          useAuthStore.getState().login(fetchedToken);
          router.push("/account");
        } else {
          setError(locale === "it" ? "Accesso non riuscito." : "Login failed.");
        }
      } else if (view === "register") {
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0] || "Cliente";
        const lastName = nameParts.slice(1).join(" ") || "Alimentari";

        const { success, error: regErr } = await customerRegister(firstName, lastName, email, password);
        if (regErr) {
          setError(regErr);
        } else if (success) {
          const { token: autoToken } = await customerLogin(email, password);
          if (autoToken) {
            useAuthStore.getState().login(autoToken);
          }
          setIsSuccess(true);
          setTimeout(() => {
            router.push("/account");
          }, 1500);
        }
      } else if (view === "forgot") {
        const { success, error: recErr } = await customerRecover(email);
        if (recErr) {
          setError(recErr);
        } else if (success) {
          setIsSuccess(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError(locale === "it" ? "Errore di connessione." : "Network connection error.");
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

      {/* Main Authentication card */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-premium relative overflow-hidden transition-all duration-300">
          
          {/* Back trigger */}
          {view === "forgot" && (
            <button
              onClick={() => { setView("login"); setIsSuccess(false); setError(""); }}
              className="absolute left-6 top-6 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Indietro
            </button>
          )}

          {/* Card Title */}
          <div className="text-center space-y-2 mb-6 pt-4">
            <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {view === "login" && t.auth.login}
              {view === "register" && t.auth.register}
              {view === "forgot" && (locale === "it" ? "Ripristina Password" : "Reset Password")}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              {view === "login" && (locale === "it" ? "Accedi alle tue specialità preferite" : "Access your favorite specialties")}
              {view === "register" && (locale === "it" ? "Crea un profilo in pochi secondi" : "Create a profile in seconds")}
              {view === "forgot" && (locale === "it" ? "Inserisci la tua email per reimpostare la password" : "Enter your email to reset password")}
            </p>
          </div>

          {/* Success Reset layout */}
          {isSuccess ? (
            <div className="space-y-6 text-center py-6 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-2 select-text">
                <h4 className="font-serif text-lg font-bold text-foreground">{t.auth.verifyEmail}</h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {t.auth.verificationSent} <strong className="text-foreground">{email}</strong>. Clicca sul link contenuto nell&apos;email per procedere.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setView("login"); setIsSuccess(false); }}
                className="w-full h-11 font-bold text-xs"
              >
                Accedi Ora
              </Button>
            </div>
          ) : (
            /* Forms layouts */
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* Profile Name (Register view) */}
              {view === "register" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
                    {t.auth.fullName}
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Giuseppe Verdi"
                    icon={<User className="w-4 h-4 text-muted-foreground" />}
                  />
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider pl-0.5">
                  {t.auth.email}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                />
              </div>

              {/* Password Input (Excluded on forgot) */}
              {view !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline pl-0.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t.auth.password}
                    </label>
                    {view === "login" && (
                      <button
                        type="button"
                        onClick={() => { setView("forgot"); setError(""); }}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {t.auth.forgotPassword}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      icon={<Lock className="w-4 h-4 text-muted-foreground" />}
                      iconPosition="left"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/10 z-10"
                      aria-label="Mostra password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error warning bar */}
              {error && (
                <p className="text-xs text-error font-semibold pl-1 animate-fadeIn">
                  ⚠️ {error}
                </p>
              )}

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm font-bold shadow-soft mt-2"
                isLoading={isLoading}
              >
                {view === "login" && t.auth.submitLogin}
                {view === "register" && t.auth.submitRegister}
                {view === "forgot" && t.auth.resetSubmit}
              </Button>

              {/* Auth Mode Toggle Toggles */}
              <div className="text-center text-xs font-semibold text-muted-foreground pt-2 select-none">
                {view === "login" && (
                  <span>
                    {t.auth.noAccount}{" "}
                    <button
                      type="button"
                      onClick={() => { setView("register"); setError(""); }}
                      className="text-primary font-bold hover:underline"
                    >
                      {t.auth.register}
                    </button>
                  </span>
                )}
                {view === "register" && (
                  <span>
                    {t.auth.hasAccount}{" "}
                    <button
                      type="button"
                      onClick={() => { setView("login"); setError(""); }}
                      className="text-primary font-bold hover:underline"
                    >
                      {t.auth.login}
                    </button>
                  </span>
                )}
              </div>

              {/* Social Login Placeholders */}
              <div className="relative pt-4 pb-2 select-none">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/80" /></div>
                <div className="relative flex justify-center text-xs font-semibold"><span className="bg-card px-3 text-muted-foreground">{t.auth.socialPlaceholder}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3 select-none">
                <button
                  type="button"
                  onClick={() => alert("Google credentials loading...")}
                  className="h-10 border border-border hover:bg-muted/10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Apple credentials loading...")}
                  className="h-10 border border-border hover:bg-muted/10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Apple ID</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer Trust Ticker */}
      <footer className="px-6 py-5 border-t border-border/60 bg-card select-none text-center flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-muted-foreground">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <span>© 2026 Alimentari S.r.l. - Tutti i diritti riservati.</span>
          <span className="hidden sm:inline">|</span>
          <div className="flex gap-2">
            <a href="/privacy-policy" className="hover:text-primary transition-colors underline">Privacy</a>
            <span>•</span>
            <a href="/cookie-policy" className="hover:text-primary transition-colors underline">Cookies</a>
            <span>•</span>
            <a href="/terms" className="hover:text-primary transition-colors underline">Termini</a>
          </div>
        </div>
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary stroke-[2.5]" /> Secure Checkout SSL Certificato
        </span>
      </footer>
    </div>
  );
}
