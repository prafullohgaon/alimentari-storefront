"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/60 select-none py-12 mt-12 text-center md:text-left">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              A
            </div>
            <h2 className="font-serif text-lg font-bold">Alimentari</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Il modern delicatessen italiano. Progettato con layout minimalista svedese e precisione sintonizzata per integrazioni headless Shopify.
          </p>
        </div>

        {/* Departments Column */}
        <div>
          <h5 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">Dipartimenti</h5>
          <ul className="text-xs text-muted-foreground space-y-2 font-semibold">
            <li>
              <Link href="/reparto?dept=dispensa" className="hover:text-primary transition-colors">
                La Dispensa di Casa
              </Link>
            </li>
            <li>
              <Link href="/reparto?dept=latticini%20%26%20salumi" className="hover:text-primary transition-colors">
                Salumeria e Formaggi
              </Link>
            </li>
            <li>
              <Link href="/reparto?dept=panetteria" className="hover:text-primary transition-colors">
                Focacce e Pane Caldo
              </Link>
            </li>
            <li>
              <Link href="/reparto?dept=enoteca" className="hover:text-primary transition-colors">
                Vini e Bollicine
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance Column */}
        <div>
          <h5 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">Garanzie & Note</h5>
          <ul className="text-xs text-muted-foreground space-y-2 font-semibold">
            <li>
              <Link href="/shipping" className="hover:text-primary transition-colors">
                Spedizioni Cold-Chain
              </Link>
            </li>
            <li>
              <Link href="/refunds" className="hover:text-primary transition-colors">
                Politica Resi & Freschezza
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy Policy (GDPR)
              </Link>
            </li>
            <li>
              <Link href="/cookie-policy" className="hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Termini e Condizioni
              </Link>
            </li>
          </ul>
        </div>

        {/* Headquarters Column */}
        <div>
          <h5 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">Sede Sociale</h5>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Alimentari S.r.l. <br />
            Via Montenapoleone 8, <br />
            20121 Milano, Italia <br />
            Tel: +39 02 123 456
          </p>
        </div>
      </div>

      {/* Baseline Copyright and Quick compliance list */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 mt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-muted-foreground">
        <div>
          © 2026 Alimentari S.r.l. - Sede Legale: Milano, Via Montenapoleone 8. Tutti i diritti riservati.
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/cookie-policy" className="hover:text-primary transition-colors">Cookies</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-primary transition-colors">Condizioni</Link>
          <span>•</span>
          <Link href="/shipping" className="hover:text-primary transition-colors">Spedizioni</Link>
          <span>•</span>
          <Link href="/refunds" className="hover:text-primary transition-colors">Resi</Link>
        </div>
      </div>
    </footer>
  );
}
