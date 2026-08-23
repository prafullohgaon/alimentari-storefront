import { create } from "zustand";
import { Locale } from "@/lib/dictionary";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  initLocale: () => void;
}

export function getInitialLocaleFromCookie(): Locale {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )alimentari_locale=([^;]*)/);
    if (match && (match[1] === "it" || match[1] === "en")) {
      return match[1] as Locale;
    }
  }
  return "it";
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "it",
  setLocale: (locale: Locale) => {
    if (typeof document !== "undefined") {
      const current = getInitialLocaleFromCookie();
      document.cookie = `alimentari_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = locale;
      if (current !== locale) {
        window.location.reload();
      }
    }
    set({ locale });
  },
  initLocale: () => {
    if (typeof document !== "undefined") {
      const cookieLocale = getInitialLocaleFromCookie();
      set({ locale: cookieLocale });
    }
  },
}));
