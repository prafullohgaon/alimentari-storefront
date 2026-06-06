"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, ShieldAlert, CreditCard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore, selectCartSubtotal } from "@/store/cart";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";

export default function CheckoutDemoPage() {
  const router = useRouter();
  
  const cart = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore(selectCartSubtotal);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form inputs
  const [fullName, setFullName] = useState("Giovanni Rossi");
  const [address, setAddress] = useState("Via della Spiga 12");
  const [city, setCity] = useState("Milano");
  const [zip, setZip] = useState("20121");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");

  // Empty cart redirection protection
  useEffect(() => {
    if (cart.length === 0 && !isCompleted) {
      router.push("/carrello");
    }
  }, [cart, isCompleted, router]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      setIsCompleted(true);
      clearCart(); // Clear active cart state
    }, 1500);
  };

  const deliveryFee = subtotal >= 50 ? 0 : 5.9;
  const finalTotal = subtotal + deliveryFee;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <DesktopNavbar onCategorySelect={() => {}} />
        <MobileNavbar onCategorySelect={() => {}} />
        
        <main className="flex-grow flex items-center justify-center p-6 md:p-10 select-none">
          <div className="bg-card border border-border/80 rounded-2xl p-8 max-w-md w-full shadow-premium text-center space-y-6 animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Ordine Ricevuto!
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                Grazie per aver acquistato su Alimentari. Il tuo ordine demo è stato elaborato con successo.
              </p>
            </div>
            
            <div className="bg-[#FAF7F2] border border-[#EFECE6] rounded-xl p-4 text-left space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-muted-foreground">
                <span>Spedito a:</span>
                <span className="text-foreground">{fullName}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Indirizzo:</span>
                <span className="text-foreground">{address}, {city}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Metodo di Pagamento:</span>
                <span className="text-foreground">Carta di Credito (Demo)</span>
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-left flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-accent-foreground leading-normal">
                Nota: Questo ordine è puramente simulato ai fini della dimostrazione. Nessun addebito reale è stato effettuato sul tuo conto.
              </p>
            </div>

            <Button
              onClick={() => router.push("/")}
              variant="primary"
              className="w-full h-11 text-xs font-bold shadow-sm"
            >
              Torna alla Home
            </Button>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans">
      <DesktopNavbar onCategorySelect={() => {}} />
      <MobileNavbar onCategorySelect={() => {}} />
      
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">
        {/* Back Link */}
        <button
          onClick={() => router.push("/carrello")}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Torna al Carrello
        </button>

        {/* Demo environment alert ribbon */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex gap-3 items-start select-none">
          <ShieldAlert className="w-5 h-5 text-accent flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="text-xs font-extrabold text-accent-foreground uppercase tracking-wider">
              Ambiente di Demo / Demo Environment
            </h4>
            <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 leading-relaxed">
              Questo checkout simula l&apos;esperienza reale del cliente senza connettersi ad una piattaforma Shopify attiva. Nessuna transazione reale verrà inoltrata o addebitata.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Billing Form Column */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
            {/* Shipping Info Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-soft space-y-4">
              <h3 className="font-serif text-lg font-bold text-foreground border-b border-border/50 pb-2">
                Dettagli di Consegna
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome Completo</label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Indirizzo di Consegna</label>
                  <Input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Città</label>
                    <Input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-10 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CAP</label>
                    <Input
                      required
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="h-10 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info Card */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-soft space-y-4">
              <h3 className="font-serif text-lg font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Metodo di Pagamento (Simulato)
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Numero di Carta</label>
                  <Input
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="h-10 text-xs font-semibold"
                  />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground italic">
                  * Qualsiasi informazione inserita in questo modulo rimarrà locale e non verrà registrata.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full h-12 text-sm font-bold shadow-soft flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
                  Elaborazione Ordine...
                </>
              ) : (
                <>
                  Effettua Ordine Demo (€{finalTotal.toFixed(2)})
                </>
              )}
            </Button>
          </form>

          {/* Cart Summary Column */}
          <aside className="space-y-6">
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-soft space-y-4 select-none">
              <h3 className="font-serif text-lg font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-primary" /> Riepilogo Spesa
              </h3>
              
              <div className="divide-y divide-border/60 max-h-[250px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex justify-between gap-3 text-xs font-semibold">
                    <span className="text-muted-foreground truncate max-w-[150px]">
                      {item.product.name} <strong className="text-foreground ml-1">x{item.quantity}</strong>
                    </span>
                    <span className="text-foreground flex-shrink-0">
                      €{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-xs font-semibold">
                <div className="flex justify-between text-muted-foreground">
                  <span>Imponibile</span>
                  <span className="text-foreground">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Spedizione</span>
                  <span className="text-foreground">
                    {deliveryFee === 0 ? <strong className="text-success">Gratis</strong> : `€${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border/60 pt-3">
                  <span>Totale</span>
                  <span className="text-[#C9623B] text-base">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
