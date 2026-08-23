"use client";

// src/components/sidebar/Sidebar.tsx
import React from "react";
import { useSidebar } from "../../hooks/useSidebar";
import { getStorefrontSidebarTree } from "@/lib/cms";
import { SidebarNode } from "@/types/sidebar";
import { RecursiveSidebarItem } from "./RecursiveSidebarItem";
import { SidebarSearch } from "./SidebarSearch";
import { Breadcrumbs } from "./Breadcrumbs";

import { useTranslation } from "@/hooks/use-translation";

interface SidebarProps {
  customTree?: SidebarNode[];
}

export const Sidebar: React.FC<SidebarProps> = ({ customTree }) => {
  const { t, locale } = useTranslation();
  const [dynamicTree, setDynamicTree] = React.useState<SidebarNode[]>(customTree || []);

  React.useEffect(() => {
    if (customTree && customTree.length > 0) {
      setDynamicTree(customTree);
      return;
    }

    let active = true;
    async function loadTree() {
      try {
        const tree = await getStorefrontSidebarTree();
        if (active && tree && tree.length > 0) {
          setDynamicTree(tree);
        }
      } catch (err) {
        console.error("Failed to load storefront sidebar tree:", err);
      }
    }
    loadTree();
    return () => {
      active = false;
    };
  }, [customTree, locale]);

  const treeToUse = dynamicTree;

  const {
    expandedIds,
    toggleNode,
    activeHandle,
    setActiveHandle,
    searchQuery,
    setSearchQuery,
    filteredTree,
    breadcrumbs,
  } = useSidebar(treeToUse);

  return (
    <div className="sidebar" data-testid="sidebar">
      <SidebarSearch query={searchQuery} setQuery={setSearchQuery} />
      <Breadcrumbs items={breadcrumbs} />
      <nav aria-label={t("reparto.categoryNavAria")} className="sidebar-tree">
        {filteredTree.map(node => (
          <RecursiveSidebarItem
            key={node.id}
            node={node}
            expandedIds={expandedIds}
            toggleNode={toggleNode}
            activeHandle={activeHandle}
            setActiveHandle={setActiveHandle}
            searchQuery={searchQuery}
          />
        ))}
      </nav>
    </div>
  );
};
