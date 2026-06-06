"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";

export default function RefundsPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = "Resi & Rimborsi | Alimentari";
  }, []);
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            Politica di Resi e Garanzia Freschezza
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            Ultimo aggiornamento: 24 Maggio 2026
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>
            Vogliamo che ogni acquisto su **Alimentari** sia un&apos;esperienza gastronomica indimenticabile. Qualora insorgessero problemi con i prodotti consegnati, la nostra Politica di Resi e Rimborsi è strutturata per offrirti la massima trasparenza e tutela del consumatore.
          </p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">1. Esclusione del Recesso per Beni Deperibili</h2>
            <p>
              In ottemperanza all&apos;**Articolo 59, comma 1, lett. d) ed e) del Codice del Consumo italiano (D.Lgs. 206/2005)**, il diritto di recesso di 14 giorni per &quot;ripensamento&quot; **non si applica** alla fornitura di beni alimentari che rischiano di deteriorarsi o scadere rapidamente (quali formaggi deperibili, latticini freschi, salumi affettati ed agrumi freschi).
            </p>
            <p>
              Questa eccezione di legge è volta a garantire la sicurezza igienico-sanitaria degli alimenti ed impedire la rimessa in commercio di beni che non possono più essere garantiti sotto il profilo della catena del freddo.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">2. Garanzia di Rimborso Freschezza</h2>
            <p>
              Sebbene la legge escluda il recesso generico, Alimentari S.r.l. offre una **Garanzia Freschezza** esclusiva a protezione dei propri acquirenti. Qualora all&apos;apertura del pacco uno o più prodotti freschi dovessero risultare:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Danneggiati o con sigillo di confezionamento compromesso durante il trasporto.</li>
              <li>Presentanti evidenti alterazioni organolettiche o difetti qualitativi manifesti.</li>
              <li>Con una scadenza residua inferiore alle nostre garanzie standard (minimo 14 giorni dalla consegna per formaggi stagionati e salumi confezionati).</li>
            </ul>
            <p className="mt-2">
              Provvederemo a emettere un **rimborso immediato** sul metodo di pagamento utilizzato o a inviare un codice coupon sostitutivo.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">3. Come Aprire una Segnalazione</h2>
            <p>
              Per richiedere l&apos;applicazione della Garanzia Freschezza, ti preghiamo di inviare una segnalazione scritta entro e non oltre **24 ore dal ricevimento dell&apos;ordine** all&apos;indirizzo email: <code className="bg-card px-1.5 py-0.5 rounded text-xs font-mono">supporto@alimentari.it</code>.
            </p>
            <p>
              La tua segnalazione deve includere:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Il numero identificativo dell&apos;ordine (es. #AL-12345).</li>
              <li>Una breve descrizione dell&apos;anomalia riscontrata.</li>
              <li>Una o più fotografie chiare del prodotto difettoso e del relativo imballaggio termico.</li>
            </ul>
            <p className="mt-2">
              Il nostro servizio clienti valuterà la pratica e ti risponderà entro 24 ore dall&apos;invio dell&apos;email.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">4. Beni non Deperibili</h2>
            <p>
              Per i soli prodotti a lunga conservazione o non deperibili (es. stoviglie in ceramica, confezioni regalo vuote, accessori da cucina) non soggetti all&apos;esclusione del Codice del Consumo, il diritto di recesso standard è valido entro 14 giorni. Il prodotto deve essere restituito perfettamente sigillato, integro e nella confezione originale. Le spese di spedizione per il rientro sono a carico del cliente.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
