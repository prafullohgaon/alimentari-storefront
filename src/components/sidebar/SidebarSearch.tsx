// src/components/sidebar/SidebarSearch.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface Props {
  query: string;
  setQuery: (q: string) => void;
}

export const SidebarSearch: React.FC<Props> = React.memo(({ query, setQuery }) => {
  const { t } = useTranslation();
  const [local, setLocal] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => setQuery(local), 200);
    return () => clearTimeout(handler);
  }, [local, setQuery]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocal("");
    setQuery("");
  }, [setQuery]);

  return (
    <div className="sidebar-search relative my-2">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={t("reparto.searchPlaceholder")}
          value={local}
          onChange={onChange}
          aria-label={t("reparto.searchCategoriesAria")}
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400 text-slate-800 transition-all"
        />
        {local && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={t("searchOverlay.clearInputAria")}
            className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});

SidebarSearch.displayName = "SidebarSearch";
