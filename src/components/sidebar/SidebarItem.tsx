import React, { useMemo } from "react";
import Link from "next/link";
import { SidebarNode } from "../../types/sidebar";
import { cn } from "@/lib/utils";

interface Props {
  node: SidebarNode;
  isActive: boolean;
  searchQuery?: string;
  onSelect: () => void;
}

import { useTranslation } from "@/hooks/use-translation";

export const SidebarItem: React.FC<Props> = React.memo(({ node, isActive, searchQuery, onSelect }) => {
  const { t } = useTranslation();

  const displayName = useMemo(() => {
    const translated = t(`categories.${node.id}`);
    if (translated && translated !== `categories.${node.id}`) return translated;
    return node.name;
  }, [node.id, node.name, t]);

  // Highlight matching search text
  const highlightedName = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return displayName;

    const query = searchQuery.trim().toLowerCase();
    const index = displayName.toLowerCase().indexOf(query);

    if (index === -1) return displayName;

    const before = displayName.slice(0, index);
    const match = displayName.slice(index, index + query.length);
    const after = displayName.slice(index + query.length);

    return (
      <>
        {before}
        <mark className="bg-amber-200 text-slate-900 rounded-sm px-0.5 font-bold">{match}</mark>
        {after}
      </>
    );
  }, [displayName, searchQuery]);

  return (
    <Link
      href={`/reparto?dept=${encodeURIComponent(node.handle)}`}
      onClick={onSelect}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex-grow flex items-center justify-between py-1.5 px-2 rounded-md text-xs transition-colors select-none cursor-pointer",
        isActive
          ? "bg-primary text-primary-foreground font-bold shadow-xs"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
      )}
    >
      <span className="truncate">{highlightedName}</span>
      {Boolean(node.isShopifyCount && typeof node.count === "number" && node.count > 0) && (
        <span
          className={cn(
            "ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 transition-colors",
            isActive
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
          )}
        >
          {node.count}
        </span>
      )}
    </Link>
  );
});

SidebarItem.displayName = "SidebarItem";
