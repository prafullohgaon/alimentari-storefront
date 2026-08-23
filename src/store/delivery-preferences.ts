import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DeliveryPreferencesData {
  preferredWindow: string;
  gateInstructions: string;
  updatedAt: string;
}

interface DeliveryPreferencesState {
  preferencesByCustomer: Record<string, DeliveryPreferencesData>;
  setCustomerPreferences: (
    customerKey: string,
    prefs: { preferredWindow: string; gateInstructions: string }
  ) => void;
  getCustomerPreferences: (customerKey?: string | null) => DeliveryPreferencesData | null;
  clearCustomerPreferences: (customerKey: string) => void;
}

export const useDeliveryPreferencesStore = create<DeliveryPreferencesState>()(
  persist(
    (set, get) => ({
      preferencesByCustomer: {},

      setCustomerPreferences: (customerKey, prefs) => {
        if (!customerKey) return;
        const normalizedKey = customerKey.toLowerCase().trim();
        set((state) => ({
          preferencesByCustomer: {
            ...state.preferencesByCustomer,
            [normalizedKey]: {
              preferredWindow: prefs.preferredWindow,
              gateInstructions: prefs.gateInstructions,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      getCustomerPreferences: (customerKey) => {
        if (!customerKey) return null;
        const normalizedKey = customerKey.toLowerCase().trim();
        return get().preferencesByCustomer[normalizedKey] || null;
      },

      clearCustomerPreferences: (customerKey) => {
        if (!customerKey) return;
        const normalizedKey = customerKey.toLowerCase().trim();
        set((state) => {
          const next = { ...state.preferencesByCustomer };
          delete next[normalizedKey];
          return { preferencesByCustomer: next };
        });
      },
    }),
    {
      name: "alimentari_delivery_preferences",
    }
  )
);
