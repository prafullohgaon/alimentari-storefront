"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";

export default function CookiePolicyPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = "Cookie Policy | Alimentari";
  }, []);
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            Informativa sui Cookie
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            Ultimo aggiornamento: 24 Maggio 2026
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>
            Questa Informativa sui Cookie descrive in modo trasparente quali cookie e tecnologie di tracciamento simili sono utilizzati su **Alimentari** (di seguito &quot;il Sito&quot;), le finalità per cui sono utilizzati e come puoi gestirli.
          </p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">1. Cosa sono i Cookie</h2>
            <p>
              I cookie sono piccoli file di testo che i siti web visitati inviano e registrano sul tuo computer o dispositivo mobile, per essere poi ritrasmessi agli stessi siti alla visita successiva. Grazie ai cookie, il sito ricorda le tue azioni e preferenze (come, ad esempio, i dati di login, la lingua prescelta, le impostazioni del carrello) in modo che non debbano essere indicate nuovamente quando ritorni sul sito o navighi da una pagina all&apos;altra.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">2. Tipologie di Cookie Utilizzati</h2>
            <p>Utilizziamo cookie appartenenti a due categorie principali per garantire sia la funzionalità tecnica che la misurazione delle conversioni:</p>
            
            <div className="space-y-3 pl-4 border-l-2 border-[#1C3B2B]/20">
              <p>
                <strong>A. Cookie Tecnici Strettamente Necessari (Sempre Attivi)</strong><br />
                Questi cookie sono indispensabili per il corretto funzionamento del Sito. Consentono la navigazione, la memorizzazione sicura degli articoli nel carrello persistente (Zustand locale), la gestione della lingua italiana o inglese e l&apos;accesso sicuro al portale dell&apos;account cliente. Senza questi cookie, il Sito non potrebbe funzionare correttamente.
              </p>
              <p>
                <strong>B. Cookie Analitici e di Prestazione (Opzionali)</strong><br />
                Raccolgono informazioni in forma aggregata e anonima su come i visitatori interagiscono con il Sito, ad esempio quali sono le pagine più visitate, le ricerche gastronomiche frequenti ed eventuali errori di caricamento. Questi cookie sono attivati solo previo consenso del visitatore.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">3. Elenco delle Tecnologie e Scadenze</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#EFECE6] text-xs text-left">
                <thead>
                  <tr className="bg-card font-serif border-b border-[#EFECE6]">
                    <th className="p-2 border-r border-[#EFECE6]">Identificatore</th>
                    <th className="p-2 border-r border-[#EFECE6]">Fornitore</th>
                    <th className="p-2 border-r border-[#EFECE6]">Scopo</th>
                    <th className="p-2">Scadenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]/50">
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_cart</td>
                    <td className="p-2 border-r border-[#EFECE6]">Alimentari (Sessione)</td>
                    <td className="p-2 border-r border-[#EFECE6]">Persistenza del carrello di spesa e delle quantità.</td>
                    <td className="p-2">30 Giorni</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_wishlist</td>
                    <td className="p-2 border-r border-[#EFECE6]">Alimentari (Sessione)</td>
                    <td className="p-2 border-r border-[#EFECE6]">Salvataggio dell&apos;elenco dei prodotti preferiti (wishlist).</td>
                    <td className="p-2">30 Giorni</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_customer_token</td>
                    <td className="p-2 border-r border-[#EFECE6]">Alimentari / Shopify</td>
                    <td className="p-2 border-r border-[#EFECE6]">JWT di autorizzazione per l&apos;area riservata account cliente.</td>
                    <td className="p-2">14 Giorni</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-[#EFECE6] font-mono">alimentari_cookies_consent</td>
                    <td className="p-2 border-r border-[#EFECE6]">Alimentari</td>
                    <td className="p-2 border-r border-[#EFECE6]">Memorizzazione delle preferenze dell&apos;utente sull&apos;uso dei cookie.</td>
                    <td className="p-2">365 Giorni</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">4. Come Gestire o Revocare il Consenso</h2>
            <p>
              Puoi modificare o revocare le tue preferenze sui cookie in qualsiasi momento direttamente tramite il banner di consenso visualizzato sul Sito, oppure configurando le impostazioni del tuo browser per bloccare o cancellare i cookie accumulati.
            </p>
            <p>
              Tieni presente che disabilitando completamente i cookie tecnici nel browser, alcune aree del nostro Sito (come l&apos;aggiunta degli articoli al carrello e l&apos;accesso all&apos;account cliente) cesseranno di essere utilizzabili.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
