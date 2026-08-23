// src/components/sidebar/RecursiveSidebarItem.tsx
import React, { useCallback, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { SidebarNode } from "../../types/sidebar";
import { SidebarItem } from "./SidebarItem";
import { cn } from "@/lib/utils";

interface Props {
  node: SidebarNode;
  expandedIds: Set<string>;
  toggleNode: (id: string) => void;
  activeHandle: string | null;
  setActiveHandle: (handle: string) => void;
  searchQuery?: string;
}

export const RecursiveSidebarItem: React.FC<Props> = React.memo(
  ({ node, expandedIds, toggleNode, activeHandle, setActiveHandle, searchQuery }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isActive = activeHandle === node.handle;
    const itemRef = useRef<HTMLDivElement>(null);

    // Scroll active item into view on mount or when handle changes
    useEffect(() => {
      if (isActive && itemRef.current) {
        itemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [isActive]);

    const handleChevronClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (hasChildren) {
          toggleNode(node.id);
        }
      },
      [hasChildren, node.id, toggleNode]
    );

    const handleSelect = useCallback(() => {
      if (hasChildren && !isExpanded) {
        toggleNode(node.id);
      }
      setActiveHandle(node.handle);
    }, [hasChildren, isExpanded, node.id, node.handle, toggleNode, setActiveHandle]);

    return (
      <div ref={itemRef} className="select-none">
        <div
          style={{ paddingLeft: `${node.level * 0.75}rem` }}
          className="group flex items-center gap-1 my-0.5 rounded-md hover:bg-slate-50 transition-colors"
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={handleChevronClick}
              aria-label={isExpanded ? "Collapse category" : "Expand category"}
              className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all shrink-0 cursor-pointer"
            >
              <ChevronRight
                className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-90")}
              />
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <SidebarItem
            node={node}
            isActive={isActive}
            searchQuery={searchQuery}
            onSelect={handleSelect}
          />
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-slate-100 ml-3.5 pl-0.5 space-y-0.5 transition-all">
            {node.children.map((child) => (
              <RecursiveSidebarItem
                key={child.id}
                node={child}
                expandedIds={expandedIds}
                toggleNode={toggleNode}
                activeHandle={activeHandle}
                setActiveHandle={setActiveHandle}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

RecursiveSidebarItem.displayName = "RecursiveSidebarItem";
