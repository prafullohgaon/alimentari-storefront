// src/lib/navigation.ts
import { sidebarData } from "@/data/sidebar";
import { SidebarNode } from "@/types/sidebar";

export interface NavLinkItem {
  name: string;
  handle: string;
}

export interface NavColumn {
  heading: string;
  links: NavLinkItem[];
}

export interface NavCategory {
  id: string;
  name: string;
  handle: string;
  promoImageUrl: string;
  columns: NavColumn[];
}

export const getNavMenu = (): Record<string, NavCategory> => {
  const menu: Record<string, NavCategory> = {};

  sidebarData.sidebar.departments.forEach((dept: SidebarNode) => {
    const columns: NavColumn[] = (dept.children || []).map((child: SidebarNode) => ({
      heading: child.name,
      links: (child.children || []).map((subChild: SidebarNode) => ({
        name: subChild.name,
        handle: subChild.handle
      }))
    }));

    menu[dept.handle] = {
      id: dept.id,
      name: dept.name,
      handle: dept.handle,
      promoImageUrl: "/vico_newsletter_box.png",
      columns
    };
  });

  return menu;
};

export const NAV_MENU: Record<string, NavCategory> = getNavMenu();
