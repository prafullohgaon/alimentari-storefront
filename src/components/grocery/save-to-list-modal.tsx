"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, ListPlus } from "lucide-react";
import { Product } from "@/lib/data";
import { useSavedListsStore } from "@/store/saved-lists";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SaveToListModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SaveToListModal({ product, isOpen, onClose }: SaveToListModalProps) {
  const { locale } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const customerKey = profile?.email || useAuthStore.getState().token || "";

  const getCustomerLists = useSavedListsStore((state) => state.getCustomerLists);
  const createList = useSavedListsStore((state) => state.createList);
  const addProductToList = useSavedListsStore((state) => state.addProductToList);

  const lists = customerKey ? getCustomerLists(customerKey) : [];

  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [addedListIds, setAddedListIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleAddToList = (listId: string) => {
    if (!customerKey) {
      setErrorMsg(
        locale === "it"
          ? "Effettua l'accesso per salvare i prodotti nelle tue liste."
          : "Please log in to save products to your lists."
      );
      return;
    }
    addProductToList(customerKey, listId, product.id, 1);
    setAddedListIds((prev) => [...prev, listId]);
    setTimeout(() => {
      setAddedListIds((prev) => prev.filter((id) => id !== listId));
    }, 2500);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerKey) {
      setErrorMsg(
        locale === "it"
          ? "Effettua l'accesso per salvare i prodotti nelle tue liste."
          : "Please log in to save products to your lists."
      );
      return;
    }
    const cleanName = newListName.trim();
    if (!cleanName) return;

    const newId = createList(customerKey, cleanName);
    if (newId) {
      addProductToList(customerKey, newId, product.id, 1);
      setAddedListIds((prev) => [...prev, newId]);
      setNewListName("");
      setShowCreateInput(false);
      setTimeout(() => {
        setAddedListIds((prev) => prev.filter((id) => id !== newId));
      }, 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/45 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-elevation space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <ListPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-foreground leading-snug">
                  {locale === "it" ? "Salva nella Lista Spesa" : "Save to Grocery List"}
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                  {product.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/20 hover:bg-muted/40 flex items-center justify-center text-foreground font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* List Selector */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {lists.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                {locale === "it" ? "Nessuna lista salvata. Creane una nuova!" : "No saved lists found. Create a new one!"}
              </div>
            ) : (
              lists.map((list) => {
                const isAdded = addedListIds.includes(list.id);
                const isInList = list.items.some((it) => it.productId === product.id);

                return (
                  <div
                    key={list.id}
                    className="p-3 border border-border/70 rounded-xl bg-card hover:bg-muted/10 flex items-center justify-between transition-all"
                  >
                    <div>
                      <h4 className="font-serif font-bold text-sm text-foreground">
                        {list.name}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {list.items.length} {locale === "it" ? "prodotti" : "items"}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleAddToList(list.id)}
                      variant={isAdded || isInList ? "outline" : "primary"}
                      size="sm"
                      className={cn(
                        "h-8 text-xs font-bold transition-all",
                        isAdded ? "border-success text-success bg-success/5" : ""
                      )}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {locale === "it" ? "Aggiunto" : "Added"}
                        </>
                      ) : isInList ? (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          {locale === "it" ? "+1 Q.tà" : "+1 Qty"}
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          {locale === "it" ? "Aggiungi" : "Add"}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Create New List Form / Button */}
          {showCreateInput ? (
            <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-2 border-t border-border/60">
              <Input
                type="text"
                placeholder={locale === "it" ? "Nome nuova lista..." : "New list name..."}
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
                className="h-9 text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateInput(false)}
                  className="h-8 text-xs font-semibold"
                >
                  {locale === "it" ? "Annulla" : "Cancel"}
                </Button>
                <Button type="submit" variant="primary" size="sm" className="h-8 text-xs font-bold">
                  {locale === "it" ? "Crea & Salva" : "Create & Save"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="pt-2 border-t border-border/60 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowCreateInput(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {locale === "it" ? "Crea nuova lista" : "Create new list"}
              </button>
              <Button onClick={onClose} variant="outline" size="sm" className="h-8 text-xs font-semibold">
                {locale === "it" ? "Chiudi" : "Close"}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
