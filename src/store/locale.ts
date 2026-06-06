import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Locale } from "@/lib/dictionary";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "it",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "alimentari_locale",
      skipHydration: true,
    }
  )
);
