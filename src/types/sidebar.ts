// src/types/sidebar.ts
export interface SidebarNode {
  id: string;
  name: string;
  handle: string;
  level: number;
  expanded?: boolean;
  count: number;
  isShopifyCount?: boolean;
  children: SidebarNode[];
}

export interface SidebarData {
  sidebar: {
    title: string;
    departments: SidebarNode[];
    featured: unknown[];
    brands: unknown[];
    price: {
      enabled: boolean;
      min: number;
      max: number;
    };
    giftCard: {
      enabled: boolean;
    };
    saveFood: {
      enabled: boolean;
    };
  };
}
