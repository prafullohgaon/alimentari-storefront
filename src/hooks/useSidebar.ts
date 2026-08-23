import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SidebarNode, SidebarData } from "../types/sidebar";
import { sidebarData } from "../data/sidebar";

export interface UseSidebarReturn {
  expandedIds: Set<string>;
  toggleNode: (id: string) => void;
  activeHandle: string | null;
  setActiveHandle: (handle: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredTree: SidebarNode[];
  breadcrumbs: SidebarNode[];
}

export const useSidebar = (input?: SidebarNode[] | SidebarData): UseSidebarReturn => {
  const searchParams = useSearchParams();

  const departments: SidebarNode[] = useMemo(() => {
    if (!input) return sidebarData.sidebar.departments;
    if (Array.isArray(input)) return input;
    return input.sidebar?.departments || sidebarData.sidebar.departments;
  }, [input]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const findNode = useCallback(
    (handle: string, nodes: SidebarNode[]): SidebarNode | null => {
      for (const node of nodes) {
        if (node.handle === handle) return node;
        const child = findNode(handle, node.children);
        if (child) return child;
      }
      return null;
    },
    []
  );

  const collectAncestors = useCallback(
    (target: SidebarNode, nodes: SidebarNode[], acc: SidebarNode[] = []): SidebarNode[] => {
      for (const node of nodes) {
        if (node.id === target.id) {
          return [...acc, node];
        }
        const deeper = collectAncestors(target, node.children, [...acc, node]);
        if (deeper.length) return deeper;
      }
      return [];
    },
    []
  );

  // Expand based on URL on mount / when query changes, or auto-expand top-level parent nodes by default
  useEffect(() => {
    const dept = searchParams.get("dept");
    if (dept) {
      const node = findNode(dept, departments);
      if (node) {
        setActiveHandle(node.handle);
        const ancestors = collectAncestors(node, departments);
        setExpandedIds((prev) => {
          const copy = new Set(prev);
          ancestors.forEach((a) => copy.add(a.id));
          return copy;
        });
        return;
      }
    }

    // Auto-expand level 0 parent nodes with children by default on initial load
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev;
      const initial = new Set<string>();
      departments.forEach((dep) => {
        if (dep.children && dep.children.length > 0) {
          initial.add(dep.id);
        }
      });
      return initial;
    });
  }, [searchParams, departments, findNode, collectAncestors]);

  const toggleNode = useCallback((id: string) => {
    setExpandedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }, []);

  // Search handling – simple filter which also expands matches
  const matches = useCallback((node: SidebarNode, q: string) => {
    return node.name.toLowerCase().includes(q.toLowerCase());
  }, []);

  const filterTree = useCallback(
    (nodes: SidebarNode[], q: string): SidebarNode[] => {
      if (!q) return nodes;
      const result: SidebarNode[] = [];
      for (const node of nodes) {
        const children = filterTree(node.children, q);
        const self = matches(node, q);
        if (self || children.length) {
          result.push({ ...node, children });
        }
      }
      return result;
    },
    [matches]
  );

  const filteredTree = useMemo(() => filterTree(departments, searchQuery), [departments, searchQuery, filterTree]);

  const breadcrumbs = useMemo(() => {
    if (!activeHandle) return [];
    const node = findNode(activeHandle, departments);
    if (!node) return [];
    return collectAncestors(node, departments);
  }, [activeHandle, departments, findNode, collectAncestors]);

  return {
    expandedIds,
    toggleNode,
    activeHandle,
    setActiveHandle,
    searchQuery,
    setSearchQuery,
    filteredTree,
    breadcrumbs,
  };
};
