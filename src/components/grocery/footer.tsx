// src/components/grocery/footer.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaTiktok,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";

export function Footer() {
  const shippingCarriers = [
    { name: "UPS", url: "/assets/footer/ups.png" },
    { name: "FERCAM", url: "/assets/footer/fercam.png" },
    { name: "DHL", url: "/assets/footer/dhl.png" },
    { name: "GLS", url: "/assets/footer/gls.png" },
  ];

  const paymentMethodsRow1 = [
    { name: "VISA", url: "/assets/footer/visa.png" },
    { name: "Mastercard", url: "/assets/footer/mastercard.png" },
    { name: "PayPal", url: "/assets/footer/paypal.svg" },
    { name: "ApplePay", url: "/assets/footer/apple-pay.svg" },
  ];

  const paymentMethodsRow2 = [
    { name: "GooglePay", url: "/assets/footer/google-pay.svg" },
    { name: "SEPA", url: "/assets/footer/sepa.svg" },
    { name: "Amex", url: "/assets/footer/amex.svg" },
    { name: "Scalapay", url: "/assets/footer/scalapay.svg" },
  ];

  return (
    <footer className="font-sans text-white bg-[#111827]">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="w-[320px] space-y-4">
            <Image src="/assets/footer/alimentari-logo.svg" alt="Alimentari" width={300} height={80} />
            <p className="text-xl font-bold">L'Italia a casa tua</p>
            <Image src="/assets/footer/award-badge.svg" alt="Award Badge" width={120} height={120} />
          </div>

          {/* Support */}
          <div className="space-y-2">
            <h5 className="text-sm font-bold uppercase tracking-widest mb-3">Assistenza e Supporto</h5>
            <ul className="space-y-1 text-sm">
              <li><Link href="/shipping" className="hover:text-primary">Contattaci</Link></li>
              <li><Link href="/shipping" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="/account" className="hover:text-primary">Ordini</Link></li>
              <li><Link href="/refunds" className="hover:text-primary">Resi</Link></li>
              <li><Link href="/refunds" className="hover:text-primary">Rimborsi</Link></li>
              <li><Link href="/shipping" className="hover:text-primary">Spedizioni</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-primary">Cookie Law</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <h5 className="text-sm font-bold uppercase tracking-widest mb-3">Informazioni Aziendali</h5>
            <ul className="space-y-1 text-sm">
              <li><Link href="/reparto" className="hover:text-primary">Chi Siamo</Link></li>
              <li><Link href="/reparto" className="hover:text-primary">Recensioni</Link></li>
              <li><Link href="/account" className="hover:text-primary">Account</Link></li>
              <li><Link href="/reparto" className="hover:text-primary">Wishlist</Link></li>
              <li><Link href="/reparto" className="hover:text-primary">Produttori</Link></li>
              <li><Link href="/reparto" className="hover:text-primary">Gift Card</Link></li>
              <li><Link href="/reparto" className="hover:text-primary">Blog</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Termini e Condizioni</Link></li>
            </ul>
          </div>

          {/* Shipping & Payment */}
          <div className="space-y-4">
            <h5 className="text-sm font-bold uppercase tracking-widest mb-3">Spediamo con</h5>
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {shippingCarriers.map((c) => (
                <div key={c.name} className="flex items-center justify-center bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <Image src={c.url} alt={c.name} width={50} height={50} />
                </div>
              ))}
            </div>
            <h5 className="text-sm font-bold uppercase tracking-widest mb-3">Metodi di Pagamento</h5>
            <div className="grid grid-cols-4 gap-3">
              {paymentMethodsRow1.map((m) => (
                <div key={m.name} className="flex items-center justify-center bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <Image src={m.url} alt={m.name} width={48} height={48} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {paymentMethodsRow2.map((m) => (
                <div key={m.name} className="flex items-center justify-center bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <Image src={m.url} alt={m.name} width={48} height={48} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zigzag divider (above social icons) */}
        <div className="my-6 h-6 bg-[url('/assets/footer/zigzag.svg')] bg-repeat-x bg-contain"></div>

        {/* Social Icons */}
        <div className="flex justify-center space-x-4 mt-8">
          <a href="#" aria-label="Facebook" className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-green-500 hover:bg-white/90"><FaFacebookF className="w-6 h-6"/></a>
          <a href="#" aria-label="Instagram" className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-green-500 hover:bg-white/90"><FaInstagram className="w-6 h-6"/></a>
          <a href="#" aria-label="TikTok" className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-green-500 hover:bg-white/90"><FaTiktok className="w-6 h-6"/></a>
          <a href="#" aria-label="YouTube" className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-green-500 hover:bg-white/90"><FaYoutube className="w-6 h-6"/></a>
          <a href="#" aria-label="LinkedIn" className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-green-500 hover:bg-white/90"><FaLinkedinIn className="w-6 h-6"/></a>
        </div>

        {/* Trustpilot – horizontal */}
        <div className="flex items-center justify-center space-x-2 py-4 text-sm">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.455a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.455a1 1 0 00-1.175 0l-3.37 2.455c-.784.57-1.838-.197-1.539-1.118l1.285-3.957a1 0 00-.363-1.118L2.07 9.384c-.784-.57-.38-1.81.588-1.81h4.163a1 0 00.951-.69l1.286-3.957z"/>
            </svg>
          ))}
          <span className="font-semibold text-lg">4.8/5 • 1,248 recensioni</span>
          <Image src="/assets/footer/trustpilot-logo.svg" alt="Trustpilot" width={80} height={20} className="mt-0" />
        </div>

        {/* Copyright */}
        <div className="bg-[#0d1117] text-white text-xs text-center py-2 mt-4 border-t border-gray-600">
          <span className="block">Alimentari® – Premium Italian Food Delivered Across Europe</span>
          <span className="block">© 2026 Alimentari – All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

