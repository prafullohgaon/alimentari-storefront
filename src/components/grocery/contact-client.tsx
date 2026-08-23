"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { DesktopNavbar } from "@/components/grocery/desktop-navbar";
import { MobileNavbar } from "@/components/grocery/mobile-navbar";
import { Footer } from "@/components/grocery/footer";
import { HomepageContactSettings } from "@/lib/cms";
import { useTranslation } from "@/hooks/use-translation";

interface ContactClientProps {
  contactSettings?: HomepageContactSettings | null;
}

interface FormData {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  oggetto: string;
  messaggio: string;
  privacyConsent: boolean;
  website: string; // Honeypot field
}

interface FormErrors {
  nome?: string;
  cognome?: string;
  email?: string;
  oggetto?: string;
  messaggio?: string;
  privacyConsent?: string;
}

export function ContactClient({ contactSettings }: ContactClientProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<FormData>({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    oggetto: "",
    messaggio: "",
    privacyConsent: false,
    website: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverErrorMessage, setServerErrorMessage] = useState("");

  // Helper to safely format WhatsApp URL
  const formatWhatsAppUrl = (phoneStr?: string): string => {
    if (!phoneStr) return "";
    const digitsOnly = phoneStr.replace(/\D/g, "");
    if (!digitsOnly) return "";
    return `https://wa.me/${digitsOnly}`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = t("contactPage.errFirstName");
    }
    if (!formData.cognome.trim()) {
      newErrors.cognome = t("contactPage.errLastName");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("contactPage.errEmailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = t("contactPage.errEmailInvalid");
      }
    }
    if (!formData.oggetto.trim()) {
      newErrors.oggetto = t("contactPage.errSubject");
    }
    if (!formData.messaggio.trim()) {
      newErrors.messaggio = t("contactPage.errMessage");
    }
    if (!formData.privacyConsent) {
      newErrors.privacyConsent = t("contactPage.errPrivacy");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitStatus("error");
        setServerErrorMessage(result.error || t("contactPage.errorFallback"));
      } else {
        setSubmitStatus("success");
      }
    } catch (err) {
      console.error("Form submission network error:", err);
      setSubmitStatus("error");
      setServerErrorMessage(t("contactPage.errorNetwork"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      if (checked && errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const whatsappUrl = formatWhatsAppUrl(contactSettings?.whatsapp || contactSettings?.phone);

  const heroEyebrow = contactSettings?.heroEyebrow;
  const heroDescription = contactSettings?.heroDescription;
  const hoursLabel = contactSettings?.hoursLabel;
  const hoursDetail = contactSettings?.hoursDetail;
  const locationLabel = contactSettings?.locationLabel;
  const locationAddress = contactSettings?.locationAddress;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C3B2B] flex flex-col font-sans">
      <DesktopNavbar
        onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")}
        contactSettings={contactSettings}
      />
      <MobileNavbar
        onCategorySelect={(catId) => router.push(catId ? `/reparto?dept=${catId}` : "/reparto")}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* Breadcrumb & Navigation */}
        <nav aria-label={t("nav.breadcrumbAria")} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-emerald-800 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("contactPage.breadcrumbHome")}
          </Link>
          <span>/</span>
          <span className="text-emerald-950 font-bold">{t("contactPage.breadcrumbContact")}</span>
        </nav>

        {/* Page Hero Header */}
        <header className="bg-white rounded-2xl p-6 md:p-10 border border-[#EFECE6] shadow-sm space-y-3">
          {heroEyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold font-mono tracking-wider uppercase">
              {heroEyebrow}
            </div>
          )}
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight text-[#1C3B2B]">
            {t("contactPage.pageTitle")}
          </h1>
          {heroDescription && (
            <p className="text-slate-600 text-sm md:text-base max-w-2xl leading-relaxed whitespace-pre-line">
              {heroDescription}
            </p>
          )}
        </header>

        {/* Main Content: Two-column layout on Desktop, Single-column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Information Cards (Shopify-driven) */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#EFECE6] shadow-sm space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1C3B2B]">
                  {contactSettings?.title}
                </h2>
                {contactSettings?.subtitle && (
                  <p className="text-xs text-slate-500 mt-1">
                    {contactSettings.subtitle}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-2">
                {/* Phone */}
                {contactSettings?.phone && (
                  <a
                    href={`tel:${contactSettings.phone}`}
                    className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        {t("contactPage.phoneLabel")}
                      </span>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {contactSettings.phone}
                      </span>
                    </div>
                  </a>
                )}

                {/* Email */}
                {contactSettings?.email && (
                  <a
                    href={`mailto:${contactSettings.email}`}
                    className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        {t("contactPage.emailLabel")}
                      </span>
                      <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors break-all">
                        {contactSettings.email}
                      </span>
                    </div>
                  </a>
                )}

                {/* WhatsApp */}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-3.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/70 border border-emerald-200/60 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                        {t("contactPage.whatsappLabel")}
                      </span>
                      <span className="text-sm font-bold text-emerald-950 group-hover:underline">
                        {t("contactPage.whatsappCta")}
                      </span>
                    </div>
                  </a>
                )}

                {/* Store Address & Hours */}
                {hoursLabel && (
                  <div className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <span className="font-bold text-slate-900 block uppercase tracking-wider">
                        {hoursLabel}
                      </span>
                      {hoursDetail && <p className="font-medium text-slate-700 whitespace-pre-line">{hoursDetail}</p>}
                    </div>
                  </div>
                )}

                {locationLabel && (
                  <div className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <span className="font-bold text-slate-900 block uppercase tracking-wider">
                        {locationLabel}
                      </span>
                      {locationAddress && <p className="font-medium text-slate-700 whitespace-pre-line">{locationAddress}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right Column: Customer Enquiry Form */}
          <section className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#EFECE6] shadow-sm">
              {submitStatus === "success" ? (
                /* SUCCESS STATE CARD */
                <div className="text-center py-8 px-4 space-y-6 animate-fadeIn" role="status">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-serif text-2xl font-bold text-[#1C3B2B]">
                      {t("contactPage.successTitle")}
                    </h2>
                    <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                      {t("contactPage.successMessage")}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-md active:scale-95"
                    >
                      {t("contactPage.successHomeCta")}
                    </Link>
                  </div>
                </div>
              ) : (
                /* ENQUIRY FORM */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#1C3B2B]">
                      {t("contactPage.formHeading")}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("contactPage.formDescription")}
                    </p>
                  </div>

                  {/* ERROR BANNER */}
                  {submitStatus === "error" && (
                    <div
                      role="alert"
                      className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-start gap-3 animate-fadeIn"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{t("contactPage.errorBannerTitle")}</p>
                        <p className="text-xs text-red-700 mt-0.5">
                          {serverErrorMessage || t("contactPage.errorFallback")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Honeypot field for spam bots (Hidden from real users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Non compilare questo campo</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Grid: Nome & Cognome */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="nome" className="block text-xs font-bold text-slate-800">
                        {t("contactPage.firstNameLabel")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                          errors.nome
                            ? "border-red-400 focus:ring-red-300 bg-red-50/30"
                            : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                        }`}
                        placeholder={t("contactPage.firstNamePlaceholder")}
                      />
                      {errors.nome && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1" role="alert">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.nome}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="cognome" className="block text-xs font-bold text-slate-800">
                        {t("contactPage.lastNameLabel")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="cognome"
                        name="cognome"
                        value={formData.cognome}
                        onChange={handleChange}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                          errors.cognome
                            ? "border-red-400 focus:ring-red-300 bg-red-50/30"
                            : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                        }`}
                        placeholder={t("contactPage.lastNamePlaceholder")}
                      />
                      {errors.cognome && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1" role="alert">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.cognome}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Grid: Email & Telefono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="block text-xs font-bold text-slate-800">
                        {t("contactPage.emailFieldLabel")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                          errors.email
                            ? "border-red-400 focus:ring-red-300 bg-red-50/30"
                            : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                        }`}
                        placeholder={t("contactPage.emailPlaceholder")}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1" role="alert">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="telefono" className="block text-xs font-bold text-slate-800">
                        {t("contactPage.phoneFieldLabel")} <span className="text-slate-400 font-normal">{t("contactPage.optionalText")}</span>
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 transition-all focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        placeholder={t("contactPage.phonePlaceholder")}
                      />
                    </div>
                  </div>

                  {/* Oggetto */}
                  <div className="space-y-1.5">
                    <label htmlFor="oggetto" className="block text-xs font-bold text-slate-800">
                      {t("contactPage.subjectLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="oggetto"
                      name="oggetto"
                      value={formData.oggetto}
                      onChange={handleChange}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 ${
                        errors.oggetto
                          ? "border-red-400 focus:ring-red-300 bg-red-50/30"
                          : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                      }`}
                      placeholder={t("contactPage.subjectPlaceholder")}
                    />
                    {errors.oggetto && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.oggetto}
                      </p>
                    )}
                  </div>

                  {/* Messaggio */}
                  <div className="space-y-1.5">
                    <label htmlFor="messaggio" className="block text-xs font-bold text-slate-800">
                      {t("contactPage.messageLabel")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="messaggio"
                      name="messaggio"
                      rows={5}
                      value={formData.messaggio}
                      onChange={handleChange}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 resize-y ${
                        errors.messaggio
                          ? "border-red-400 focus:ring-red-300 bg-red-50/30"
                          : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                      }`}
                      placeholder={t("contactPage.messagePlaceholder")}
                    />
                    {errors.messaggio && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.messaggio}
                      </p>
                    )}
                  </div>

                  {/* Privacy Policy Consent Checkbox */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="privacyConsent"
                        name="privacyConsent"
                        checked={formData.privacyConsent}
                        onChange={handleChange}
                        required
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                      />
                      <label htmlFor="privacyConsent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                        {t("contactPage.privacyPrefix")}
                        <Link
                          href="/privacy-policy"
                          target="_blank"
                          className="font-bold text-emerald-800 underline hover:text-emerald-950"
                        >
                          {t("contactPage.privacyLink")}
                        </Link>
                        {t("contactPage.privacySuffix")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                    </div>
                    {errors.privacyConsent && (
                      <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1" role="alert">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.privacyConsent}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-sm tracking-wide transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t("contactPage.submittingButton")}</span>
                        </>
                      ) : (
                        <span>{t("contactPage.submitButton")}</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
