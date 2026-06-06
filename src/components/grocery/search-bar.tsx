"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
  placeholder?: string;
}

const POPULAR_SUGGESTIONS = [
  "Olio Extra Vergine",
  "Pasta Rustichella",
  "Pomodorini San Marzano",
  "Pecorino Romano DOP",
  "Prosciutto di Parma",
];

export function SearchBar({ onSearch, className, placeholder = "Cerca specialità italiane..." }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full z-30", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-muted-foreground stroke-[2.5] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className={cn(
            "w-full h-11 bg-card text-foreground border border-border/80 rounded-xl pl-11 pr-10 text-base transition-all duration-200 outline-none placeholder:text-muted/70 shadow-soft",
            "focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-premium"
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/15 active:scale-90 text-muted-foreground transition-all"
            aria-label="Cancella ricerca"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Instant Suggestions Overlay */}
      {isFocused && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-card border border-border rounded-xl shadow-elevation overflow-hidden animate-fadeIn select-none">
          <div className="p-3 bg-muted/5 border-b border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-primary" />
              Ricerche Frequenti
            </span>
          </div>
          <div className="flex flex-col py-1.5">
            {POPULAR_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-muted/10 active:bg-muted/20 text-foreground transition-colors flex items-center gap-2.5"
              >
                <Search className="w-3.5 h-3.5 text-muted-foreground stroke-[2]" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
