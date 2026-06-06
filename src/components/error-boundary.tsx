"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import { logException } from "@/lib/error-monitoring";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture and dispatch exception details to the telemetry service
    logException(error, { componentStack: errorInfo.componentStack });
  }

  private handleReset = () => {
    try {
      // Clear persistent stores to clean corrupted local states causing the crash
      localStorage.removeItem("alimentari_cart");
      localStorage.removeItem("alimentari_wishlist");
      localStorage.removeItem("alimentari_customer_token");
    } catch (e) {
      console.error("Local storage reset failed:", e);
    }
    // Refresh page and redirect home safely
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B] flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-white border border-[#EFECE6] rounded-2xl p-8 text-center shadow-premium space-y-6">
            <div className="w-14 h-14 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1C3B2B]">
                Qualcosa è andato storto
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto font-semibold">
                Si è verificato un errore tecnico imprevisto. Abbiamo registrato l&apos;accaduto per risolverlo tempestivamente.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={this.handleReset}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Ripristina e Torna alla Home
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full h-11 bg-transparent hover:bg-muted/10 border border-border/80 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4 text-muted-foreground" />
                Vai alla Home
              </button>
            </div>

            <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest pt-2 border-t border-border/30">
              Alimentari Sicurezza Attiva
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
