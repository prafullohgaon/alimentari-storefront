"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";

export default function TermsPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = "Termini e Condizioni | Alimentari";
  }, []);
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            Termini e Condizioni di Vendita
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            Ultimo aggiornamento: 24 Maggio 2026
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>
            Le presenti Condizioni Generali di Vendita disciplinano l&apos;offerta e la vendita di prodotti enogastronomici sul sito web **Alimentari** (di seguito &quot;il Sito&quot;), di proprietà di **Alimentari S.r.l.**, con sede legale in Milano, Via Montenapoleone 8.
          </p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">1. Oggetto del Servizio</h2>
            <p>
              Alimentari S.r.l. offre un servizio di vendita a distanza di prodotti alimentari italiani d&apos;eccellenza, con particolare riguardo a prodotti a denominazione di origine protetta (D.O.P. e I.G.P.) e freschi. I contratti di compravendita si intendono conclusi direttamente tra Alimentari S.r.l. e il cliente finale (&quot;Consumatore&quot;).
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">2. Prezzi e Disponibilità</h2>
            <p>
              Tutti i prezzi dei prodotti indicati sul Sito sono comprensivi di IVA italiana vigente e sono espressi in Euro (€). I prezzi non includono le spese di spedizione refrigerata, che vengono dettagliatamente calcolate nel riassunto del carrello prima della conferma dell&apos;ordine.
            </p>
            <p>
              Trattandosi di specialità alimentari artigianali a produzione limitata (es. Tartufo d&apos;Alba o formaggi stagionati), la disponibilità dei prodotti è soggetta a variazioni stagionali o limiti di stock. In caso di indisponibilità sopravvenuta, il cliente verrà tempestivamente informato e rimborsato integralmente dell&apos;importo pagato.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">3. Conclusione del Contratto e Pagamenti</h2>
            <p>
              L&apos;ordine inviato dal cliente costituisce una proposta d&apos;acquisto. Il contratto si intende concluso solo nel momento in cui Alimentari S.r.l. invia la conferma d&apos;ordine via email.
            </p>
            <p>Accettiamo pagamenti sicuri tramite i circuiti indicati al momento dell&apos;acquisto. Tutte le transazioni sono crittografate tramite protocolli SSL protetti ed elaborati in conformità agli standard internazionali di sicurezza PCI-DSS.</p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">4. Consegna e Catena del Freddo</h2>
            <p>
              La spedizione dei prodotti freschi o deperibili (quali formaggi e salumi DOP) avviene esclusivamente tramite corrieri refrigerati autorizzati o imballaggi isotermici attivi, per preservare la catena del freddo e le proprietà organolettiche degli alimenti dal confezionamento fino alla consegna a domicilio.
            </p>
            <p>
              Il cliente è tenuto a rendersi reperibile nella fascia oraria selezionata per evitare ritardi nella consegna di alimenti freschi.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">5. Diritto di Recesso ed Esclusioni</h2>
            <p>
              Ai sensi dell&apos;**Articolo 59 del Codice del Consumo italiano (D.Lgs. 206/2005)**, il diritto di recesso di 14 giorni per i contratti a distanza **è escluso** per la fornitura di:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Beni che rischiano di deteriorarsi o scadere rapidamente (inclusi tutti i prodotti freschi o refrigerati).</li>
              <li>Beni sigillati che non si prestano ad essere restituiti per motivi igienici o connessi alla protezione della salute e sono stati aperti dopo la consegna.</li>
            </ul>
            <p>
              Per i soli prodotti non deperibili (es. ceramiche decorative, confezioni regalo vuote, aceti lungamente invecchiati sigillati), il recesso è consentito entro 14 giorni dalla consegna.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">6. Foro Competente e Legge Applicabile</h2>
            <p>
              Le presenti Condizioni Generali sono regolate dalla legge italiana. Qualsiasi controversia relativa all&apos;interpretazione, esecuzione o risoluzione del contratto sarà devoluta alla competenza esclusiva del Tribunale di Milano, Italia, salvo i casi in cui la legge imponga la competenza del foro di residenza del consumatore.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
