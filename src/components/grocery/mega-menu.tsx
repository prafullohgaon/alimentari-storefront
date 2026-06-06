"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, Leaf, Gift, Wine } from "lucide-react";
import { cn } from "@/lib/utils";

interface MegaMenuProps {
  onCategorySelect: (catId: string) => void;
  className?: string;
}

const DEPARTMENTS = [
  {
    id: "dispensa",
    name: "La Dispensa",
    thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop",
    items: ["Olio Extra Vergine", "Aceto Balsamico di Modena", "Pasta di Gragnano", "Conserve", "Spezie & Aromi"]
  },
  {
    id: "organic",
    name: "Biologico Certificato",
    thumbnail: "https://images.unsplash.com/photo-1590502593747-42a996133562?q=80&w=150&auto=format&fit=crop",
    items: ["Farine di Grani Antichi", "Miele Artigianale", "Confetture Bio", "Cereali Integrali", "Legumi Secchi"]
  },
  {
    id: "panetteria",
    name: "Panetteria Fresca",
    thumbnail: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?q=80&w=150&auto=format&fit=crop",
    items: ["Pane a Lievitazione Naturale", "Focaccia Barese DOP", "Pasticceria Artigianale", "Grissini Torinesi"]
  },
  {
    id: "enoteca",
    name: "Enoteca Selezionata",
    thumbnail: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=150&auto=format&fit=crop",
    items: ["Vini Rossi DOCG", "Bollicine Classiche", "Vini Bianchi", "Liquori & Amari Artigianali"]
  },
  {
    id: "casa & persona",
    name: "Cura Casa & Persona",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=150&auto=format&fit=crop",
    items: ["Detersivi Ecologici", "Saponi Bio Artigianali", "Accessori Vetro", "Candele Olio Essenziale"]
  },
  {
    id: "offerte",
    name: "Offerte Volantino",
    thumbnail: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=150&auto=format&fit=crop",
    items: ["Mozzarella Bufala DOP (-25%)", "Trancio Parmigiano (Special Price)", "Liguori Pasta (3+1)"]
  }
];

const FEATURED_BRANDS = [
  "Pastificio Liguori",
  "Antico Frantoio",
  "Consorzio Parmigiano",
  "Salumificio Devodier",
  "Bellavista Enoteca"
];

export function MegaMenu({ onCategorySelect, className }: MegaMenuProps) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "w-full bg-[#FAF7F2] border-b border-[#EFECE6] overflow-hidden select-none",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Columns 1-3: Departments Categories Grid (High-density browsing layout) */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
          {DEPARTMENTS.map((dept) => (
            <div key={dept.id} className="space-y-4 group">
              
              {/* Category group header with interactive thumbnail */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image
                    src={dept.thumbnail}
                    alt={dept.name}
                    fill
                    sizes="40px"
                    className="object-cover rounded-lg border border-[#EFECE6] group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop";
                      e.currentTarget.srcset = "";
                    }}
                  />
                </div>
                <h4
                  onClick={() => onCategorySelect(dept.id)}
                  className="font-serif text-base font-bold text-[#1C3B2B] hover:text-[#C9623B] cursor-pointer tracking-tight transition-colors duration-150"
                >
                  {dept.name}
                </h4>
              </div>

              {/* Sub-item list */}
              <ul className="space-y-1.5 pl-13">
                {dept.items.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => onCategorySelect(dept.id)}
                      className="text-xs text-muted-foreground hover:text-[#1C3B2B] font-semibold transition-colors duration-150 py-0.5 text-left block"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Column 4: Highly engaging Promotional block sidebar (Conversion-focused cards) */}
        <div className="border-l border-[#EFECE6] pl-8 flex flex-col justify-between space-y-6 h-full">
          
          {/* Card A: Truffle promotion */}
          <div className="bg-[#E2EAE5] rounded-xl p-4 border border-[#EFECE6] relative overflow-hidden flex flex-col justify-between h-[155px]">
            <div className="space-y-1 z-10 relative">
              <span className="text-[9px] font-bold text-[#C9623B] uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> Specialità Autunnale
              </span>
              <h5 className="font-serif text-base font-bold text-[#181816] leading-snug">
                Tartufo Bianco D&apos;Alba
              </h5>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Fresco di raccolta, spedito in vetro termico per preservarne l&apos;aroma.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between z-10 relative select-none">
              <span className="text-xs font-bold text-[#1C3B2B]">€49.00 / 50g</span>
              <button
                onClick={() => {
                  alert("Tartufo aggiunto al carrello!");
                  router.push("/carrello");
                }}
                className="h-8 px-3 bg-[#1C3B2B] hover:bg-[#1C3B2B]/90 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
              >
                Ordina Ora
              </button>
            </div>

            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-2 translate-x-2 text-[#1C3B2B]">
              <Leaf className="w-20 h-20" />
            </div>
          </div>

          {/* Card B: Gift Card promotion (Apple-level luxury card aesthetic) */}
          <div className="bg-gradient-to-br from-[#1C3B2B] to-[#181816] rounded-xl p-4 relative overflow-hidden flex flex-col justify-between h-[120px] text-white shadow-lg">
            <div className="z-10 relative space-y-0.5">
              <span className="text-[9px] font-bold text-[#FAF7F2] uppercase tracking-widest flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-[#C9623B]" /> Regala Alimentari
              </span>
              <h5 className="font-serif text-sm font-bold leading-snug">
                Digital Gift Card
              </h5>
              <p className="text-[10px] text-white/70 leading-normal">
                Regala la vera spesa gastronomica italiana artigianale.
              </p>
            </div>

            <button
              onClick={() => alert("Gift Card Selezionata! Tagli disponibili da €25 a €200.")}
              className="z-10 relative h-7 w-max px-3 bg-[#C9623B] hover:bg-[#C9623B]/90 text-white text-[10px] font-bold rounded-md flex items-center gap-1 self-end transition-all active:scale-95"
            >
              <span>Acquista</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <div className="absolute left-[-20px] bottom-[-20px] opacity-15 pointer-events-none text-white transform -rotate-12">
              <Wine className="w-20 h-20" />
            </div>
          </div>

          {/* Premium brand logs listing */}
          <div className="space-y-2 select-none">
            <h5 className="text-[9px] font-bold text-[#1C3B2B] uppercase tracking-widest pl-0.5">
              Marchi in Evidenza
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {FEATURED_BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="bg-white border border-[#EFECE6] text-[10px] font-bold text-muted-foreground px-2 py-0.5 rounded cursor-pointer hover:border-[#1C3B2B] hover:text-[#1C3B2B] transition-colors"
                  onClick={() => onCategorySelect("dispensa")}
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Mega Menu Quality Strip Ribbon */}
      <div className="bg-[#1C3B2B] text-[#FAF7F2] py-3.5 px-6 select-none border-t border-[#FAF7F2]/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#E2EAE5]" />
            <span>Spesa Refrigerata 100% Garantita (+4°C costanti) in tutta Italia.</span>
          </div>
          <a
            href="/reparto"
            className="flex items-center gap-1 hover:text-white font-bold underline"
          >
            Sfoglia Tutti i Reparti <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>
        </div>
      </div>

    </div>
  );
}
