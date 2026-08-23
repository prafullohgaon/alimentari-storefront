// src/components/sidebar/Breadcrumbs.tsx
import React from "react";
import Link from "next/link";
import { SidebarNode } from "../../types/sidebar";
import { useTranslation } from "@/hooks/use-translation";

interface Props {
  items: SidebarNode[];
}

export const Breadcrumbs: React.FC<Props> = ({ items }) => {
  const { t } = useTranslation();
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label={t("nav.breadcrumbAria")} className="sidebar-breadcrumbs my-2 text-xs text-gray-500">
      <ol className="flex flex-wrap items-center space-x-1">
        <li>
          <Link href="/reparto" className="hover:underline">
            {t("reparto.breadcrumbReparti")}
          </Link>
        </li>
        {items.map((item, index) => {
          const localizedName = t(`categories.${item.id}`);
          const displayName = (localizedName && localizedName !== `categories.${item.id}`) ? localizedName : item.name;
          return (
            <React.Fragment key={item.id}>
              <span>/</span>
              <li>
                {index === items.length - 1 ? (
                  <span className="font-semibold text-gray-800">{displayName}</span>
                ) : (
                  <Link href={`/reparto?dept=${item.handle}`} className="hover:underline">
                    {displayName}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
