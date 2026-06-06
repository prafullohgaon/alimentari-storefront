"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = "Privacy Policy | Alimentari";
  }, []);
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B]">
      <DesktopNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />
      <MobileNavbar onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")} />

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-10">
        <header className="space-y-4 border-b border-[#EFECE6] pb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1C3B2B]">
            Informativa sulla Privacy
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-mono">
            Ultimo aggiornamento: 24 Maggio 2026
          </p>
        </header>

        <section className="space-y-6 text-sm text-foreground/80 leading-relaxed font-semibold">
          <p>
            Benvenuto su **Alimentari** (di seguito &quot;il Sito&quot;). La privacy dei nostri visitatori è di fondamentale importanza per noi. Questa Informativa sulla Privacy descrive come raccogliamo, utilizziamo, trattiamo e proteggiamo i tuoi dati personali in conformità al **Regolamento Generale sulla Protezione dei Dati dell&apos;Unione Europea (GDPR - Regolamento UE 2016/679)**.
          </p>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">1. Titolare del Trattamento</h2>
            <p>
              Il Titolare del Trattamento dei dati personali raccolti tramite il Sito è:<br />
              <strong>Alimentari S.r.l.</strong><br />
              Via Montenapoleone 8, 20121 Milano, Italia<br />
              Email di contatto: <code className="bg-card px-1.5 py-0.5 rounded text-xs font-mono">privacy@alimentari.it</code>
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">2. Dati Raccolti e Finalità</h2>
            <p>Raccogliamo e trattiamo esclusivamente i dati strettamente necessari all&apos;erogazione del nostro servizio di spesa gastronomica di lusso:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Dati d&apos;acquisto e spedizione:</strong> Nome, cognome, indirizzo email, indirizzo di consegna fisica, numero di telefono e dettagli di fatturazione. Finalità: adempimento del contratto di compravendita, organizzazione della catena del freddo refrigerata e spedizione.
              </li>
              <li>
                <strong>Dati dell&apos;account cliente:</strong> Email e credenziali di accesso crittografate. Finalità: gestione del profilo personale, storico ordini e pianificazione delle consegne in abbonamento.
              </li>
              <li>
                <strong>Dati tecnici e di navigazione:</strong> Indirizzo IP, dati del browser e cookies tecnici. Finalità: funzionamento sicuro del Sito, prevenzione delle frodi e corretto mantenimento della sessione del carrello.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">3. Base Giuridica del Trattamento</h2>
            <p>Trattiamo i tuoi dati personali basandoci sulle seguenti condizioni di liceità:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Esecuzione di un contratto:</strong> Per elaborare e consegnare la tua spesa.</li>
              <li><strong>Adempimento di obblighi di legge:</strong> Obblighi fiscali, contabili e normativi relativi alle vendite commerciali.</li>
              <li><strong>Legittimo interesse:</strong> Per garantire la sicurezza informatica del Sito e monitorare le prestazioni tecniche.</li>
              <li><strong>Consenso dell&apos;interessato:</strong> Per l&apos;attivazione di eventuali cookie analitici non essenziali.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">4. Conservazione dei Dati</h2>
            <p>
              I dati personali vengono conservati per il tempo strettamente necessario a conseguire gli scopi per cui sono stati raccolti, inclusa la gestione di resi freschi o contestazioni, e per adempiere a requisiti contabili e tributari di legge (di norma 10 anni per i dati relativi alle transazioni commerciali).
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">5. Diritti dell&apos;Interessato (GDPR)</h2>
            <p>Ai sensi del GDPR, hai il diritto di esercitare in qualsiasi momento i seguenti diritti:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Diritto di **accesso** ai tuoi dati personali in nostro possesso.</li>
              <li>Diritto di **rettifica** o aggiornamento di informazioni imprecise o incomplete.</li>
              <li>Diritto alla **cancellazione** (&quot;diritto all&apos;oblio&quot;) qualora i dati non siano più necessari.</li>
              <li>Diritto di **limitazione** del trattamento in casi specifici.</li>
              <li>Diritto alla **portabilità** dei tuoi dati in formato strutturato di uso comune.</li>
              <li>Diritto di **opposizione** al trattamento per motivi legittimi o scopi pubblicitari.</li>
            </ul>
            <p className="mt-2">
              Per esercitare questi diritti, puoi inviare una richiesta scritta a <code className="bg-card px-1.5 py-0.5 rounded text-xs font-mono">privacy@alimentari.it</code>. Risponderemo entro 30 giorni.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">6. Sicurezza del Trattamento</h2>
            <p>
              Tutte le comunicazioni tra il tuo browser e i nostri server sono protette da crittografia SSL/TLS. I dati relativi ai pagamenti con carta di credito non risiedono mai sui nostri server e sono gestiti in modo cifrato e sicuro direttamente dai gateway di pagamento certificati PCI-DSS.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
