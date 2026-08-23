import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedListItem {
  productId: string;
  quantity: number;
}

export interface SavedGroceryList {
  id: string;
  name: string;
  items: SavedListItem[];
  createdAt: string;
  updatedAt: string;
}

interface SavedListsState {
  listsByCustomer: Record<string, SavedGroceryList[]>;

  createList: (customerKey: string, name: string) => string;
  renameList: (customerKey: string, listId: string, newName: string) => boolean;
  deleteList: (customerKey: string, listId: string) => boolean;
  addProductToList: (customerKey: string, listId: string, productId: string, quantity?: number) => void;
  removeProductFromList: (customerKey: string, listId: string, productId: string) => void;
  updateItemQuantity: (customerKey: string, listId: string, productId: string, quantity: number) => void;
  getCustomerLists: (customerKey?: string | null) => SavedGroceryList[];
}

export const useSavedListsStore = create<SavedListsState>()(
  persist(
    (set, get) => ({
      listsByCustomer: {},

      createList: (customerKey, name) => {
        if (!customerKey) return "";
        const normalizedKey = customerKey.toLowerCase().trim();
        const cleanName = name.trim();
        if (!cleanName) return "";

        const newListId = `list-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const now = new Date().toISOString();

        const newList: SavedGroceryList = {
          id: newListId,
          name: cleanName,
          items: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          const currentLists = state.listsByCustomer[normalizedKey] || [];
          return {
            listsByCustomer: {
              ...state.listsByCustomer,
              [normalizedKey]: [newList, ...currentLists],
            },
          };
        });

        return newListId;
      },

      renameList: (customerKey, listId, newName) => {
        if (!customerKey || !listId) return false;
        const normalizedKey = customerKey.toLowerCase().trim();
        const cleanName = newName.trim();
        if (!cleanName) return false;

        let success = false;
        set((state) => {
          const currentLists = state.listsByCustomer[normalizedKey] || [];
          const updatedLists = currentLists.map((list) => {
            if (list.id === listId) {
              success = true;
              return {
                ...list,
                name: cleanName,
                updatedAt: new Date().toISOString(),
              };
            }
            return list;
          });

          return {
            listsByCustomer: {
              ...state.listsByCustomer,
              [normalizedKey]: updatedLists,
            },
          };
        });

        return success;
      },

      deleteList: (customerKey, listId) => {
        if (!customerKey || !listId) return false;
        const normalizedKey = customerKey.toLowerCase().trim();

        let success = false;
        set((state) => {
          const currentLists = state.listsByCustomer[normalizedKey] || [];
          const filtered = currentLists.filter((list) => {
            if (list.id === listId) {
              success = true;
              return false;
            }
            return true;
          });

          return {
            listsByCustomer: {
              ...state.listsByCustomer,
              [normalizedKey]: filtered,
            },
          };
        });

        return success;
      },

      addProductToList: (customerKey, listId, productId, quantity = 1) => {
        if (!customerKey || !listId || !productId) return;
        const normalizedKey = customerKey.toLowerCase().trim();
        const qtyToAdd = Math.max(1, quantity);

        set((state) => {
          const currentLists = state.listsByCustomer[normalizedKey] || [];
          const updatedLists = currentLists.map((list) => {
            if (list.id === listId) {
              const existingItemIndex = list.items.findIndex((it) => it.productId === productId);
              let newItems: SavedListItem[];

              if (existingItemIndex >= 0) {
                // Update existing product quantity (prevent duplicates)
                newItems = list.items.map((it, idx) => {
                  if (idx === existingItemIndex) {
                    return { ...it, quantity: it.quantity + qtyToAdd };
                  }
                  return it;
                });
              } else {
                // Append new product item
                newItems = [...list.items, { productId, quantity: qtyToAdd }];
              }

              return {
                ...list,
                items: newItems,
                updatedAt: new Date().toISOString(),
              };
            }
            return list;
          });

          return {
            listsByCustomer: {
              ...state.listsByCustomer,
              [normalizedKey]: updatedLists,
            },
          };
        });
      },

      removeProductFromList: (customerKey, listId, productId) => {
        if (!customerKey || !listId || !productId) return;
        const normalizedKey = customerKey.toLowerCase().trim();

        set((state) => {
          const currentLists = state.listsByCustomer[normalizedKey] || [];
          const updatedLists = currentLists.map((list) => {
            if (list.id === listId) {
              return {
                ...list,
                items: list.items.filter((it) => it.productId !== productId),
                updatedAt: new Date().toISOString(),
              };
            }
            return list;
          });

          return {
            listsByCustomer: {
              ...state.listsByCustomer,
              [normalizedKey]: updatedLists,
            },
          };
        });
      },

      updateItemQuantity: (customerKey, listId, productId, quantity) => {
        if (!customerKey || !listId || !productId) return;
        const normalizedKey = customerKey.toLowerCase().trim();

        if (quantity <= 0) {
          get().removeProductFromList(customerKey, listId, productId);
          return;
        }

        set((state) => {
          const currentLists = state.listsByCustomer[normalizedKey] || [];
          const updatedLists = currentLists.map((list) => {
            if (list.id === listId) {
              return {
                ...list,
                items: list.items.map((it) => {
                  if (it.productId === productId) {
                    return { ...it, quantity };
                  }
                  return it;
                }),
                updatedAt: new Date().toISOString(),
              };
            }
            return list;
          });

          return {
            listsByCustomer: {
              ...state.listsByCustomer,
              [normalizedKey]: updatedLists,
            },
          };
        });
      },

      getCustomerLists: (customerKey) => {
        if (!customerKey) return [];
        const normalizedKey = customerKey.toLowerCase().trim();
        return get().listsByCustomer[normalizedKey] || [];
      },
    }),
    {
      name: "alimentari_saved_grocery_lists",
    }
  )
);
