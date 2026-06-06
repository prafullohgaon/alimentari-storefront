"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";

export default function ShippingPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = "Spedizioni | Alimentari";
  }, []);
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            Spedizioni e Consegna Refrigerata
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            Ultimo aggiornamento: 24 Maggio 2026
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>
            Su **Alimentari**, la qualità dei prodotti e la sicurezza dei cibi che porti in tavola sono la nostra priorità assoluta. Per questo motivo, abbiamo sviluppato un protocollo di spedizione rigoroso basato sulla **conservazione termica attiva e passiva** per preservare intatta la catena del freddo.
          </p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">1. La Catena del Freddo Garantita</h2>
            <p>
              Tutti i prodotti freschi o deperibili (formaggi freschi, mozzarella di bufala DOP, salumi affettati artigianali) vengono prelevati direttamente dalle nostre celle frigorifere a temperatura controllata e imballati in speciali **box termoisolanti contenenti gel refrigerante alimentare eutettico**, in grado di mantenere una temperatura compresa tra 0°C e +4°C per oltre 72 ore continuative.
            </p>
            <p>
              In questo modo, la merce viaggia al riparo da shock termici ed sbalzi di temperatura esterni, indipendentemente dalle condizioni meteorologiche esterne.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">2. Costi di Spedizione</h2>
            <p>Offriamo tariffe trasparenti calibrate sulla tipologia di imballaggio termico necessario:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Spedizione Standard Termica:</strong> Spedizione in box termici refrigerati per ordini inferiori a €50,00. Tariffa fissa di **€6,90**.
              </li>
              <li>
                <strong>Spedizione Gratuita:</strong> Per tutti gli ordini superiori a **€50,00**, il confezionamento salvafreschezza e la spedizione refrigerata sono **completamente gratuiti**.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">3. Tempi di Consegna e Calendario Spedizioni</h2>
            <p>
              Per garantire che la spesa non rimanga ferma nei magazzini logistici durante il fine settimana, spediamo esclusivamente nei giorni di **Lunedì, Martedì e Mercoledì**.
            </p>
            <p>
              Gli ordini ricevuti dal Giovedì alla Domenica vengono elaborati e affidati al corriere il Lunedì successivo. La consegna avviene solitamente in **24/48 ore** lavorative dall&apos;affidamento (72 ore per le isole e le località remote).
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">4. Ricevimento della Spesa</h2>
            <p>
              I prodotti freschi viaggiano refrigerati, ma una volta consegnati al tuo domicilio devono essere **immediatamente riposti in frigorifero** a una temperatura compresa tra 0°C e +4°C.
            </p>
            <p>
              Ti invitiamo a pianificare la consegna assicurandoti che sia presente qualcuno al momento del recapito. Alimentari S.r.l. non si assume responsabilità per il deterioramento di cibi freschi dovuto a ripetute mancate consegne o assenza del destinatario.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
