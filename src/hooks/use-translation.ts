import { useLocaleStore } from "@/store/locale";
import { DICTIONARY } from "@/lib/dictionary";
import { useEffect } from "react";

export function useTranslation() {
  const storeLocale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const locale = storeLocale;
  const dict = DICTIONARY[locale];

  // Log locale changes for debugging
  useEffect(() => {
    console.log("[useTranslation] Current locale:", locale);
  }, [locale]);

  // Helper function to resolve dot-notated paths, e.g., t("auth.login")
  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = dict;
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return path; // fallback to path string if not found
      }
    }
    if (typeof value === "string") {
      if (params) {
        let result = value;
        for (const [param, val] of Object.entries(params)) {
          result = result.replace(`{${param}}`, String(val));
        }
        return result;
      }
      return value;
    }
    return path;
  };

  // Temporary mounted flag to avoid undefined reference
  const mounted = true;

  return { locale, t, dict, setLocale, isHydrated: mounted };
}
