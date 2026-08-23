export interface CartStorageProvider {
  // Guest Storage (ID only)
  getGuestCartId(): string | null;
  saveGuestCartId(cartId: string): void;
  clearGuestCartId(): void;

  // Customer Storage (ID only)
  getCustomerCartId(userId: string): string | null;
  saveCustomerCartId(userId: string, cartId: string): void;
  clearCustomerCartId(userId: string): void;

  // Checkout Intent Storage
  getPendingCheckoutIntent(): boolean;
  setPendingCheckoutIntent(intent: boolean): void;
  clearPendingCheckoutIntent(): void;
}

function getCallerStack(): string {
  try {
    const err = new Error();
    const stackLines = err.stack?.split("\n") || [];
    const callerLine = stackLines.slice(2).find((line) => !line.includes("cart-storage.ts")) || stackLines[3] || "unknown";
    return callerLine.trim();
  } catch {
    return "unknown";
  }
}

export class LocalStorageProvider implements CartStorageProvider {
  getGuestCartId(): string | null {
    if (typeof window === "undefined") return null;
    const key = "alimentari_guest_cart_id";
    const cartId = localStorage.getItem(key);
    if (process.env.NODE_ENV === "development") {
      console.log(`[STORAGE DIAGNOSTIC] [${new Date().toISOString()}] getGuestCartId`, {
        key,
        cartId,
        caller: getCallerStack(),
      });
    }
    return cartId;
  }

  saveGuestCartId(cartId: string): void {
    if (typeof window === "undefined" || !cartId) return;
    localStorage.setItem("alimentari_guest_cart_id", cartId);
    if (process.env.NODE_ENV === "development") {
      console.log(`[STORAGE DIAGNOSTIC] [${new Date().toISOString()}] saveGuestCartId`, { cartId });
    }
  }

  clearGuestCartId(): void {
    if (typeof window === "undefined") return;
    const key = "alimentari_guest_cart_id";
    const oldCartId = this.getGuestCartId();
    localStorage.removeItem(key);
    localStorage.removeItem("alimentari_guest_cart");
    if (process.env.NODE_ENV === "development") {
      console.log(`[STORAGE DIAGNOSTIC] [${new Date().toISOString()}] clearGuestCartId`, {
        key,
        cartId: oldCartId,
        caller: getCallerStack(),
      });
    }
  }

  getCustomerCartId(userId: string): string | null {
    if (typeof window === "undefined" || !userId) return null;
    const key = `alimentari_customer_cart_id_${userId}`;
    const cartId = localStorage.getItem(key);
    if (process.env.NODE_ENV === "development") {
      console.log(`[STORAGE DIAGNOSTIC] [${new Date().toISOString()}] getCustomerCartId`, {
        userId,
        key,
        cartId,
        caller: getCallerStack(),
      });
    }
    return cartId;
  }

  saveCustomerCartId(userId: string, cartId: string): void {
    if (typeof window === "undefined" || !userId || !cartId) return;
    localStorage.setItem(`alimentari_customer_cart_id_${userId}`, cartId);
    if (process.env.NODE_ENV === "development") {
      console.log(`[STORAGE DIAGNOSTIC] [${new Date().toISOString()}] saveCustomerCartId`, { userId, cartId });
    }
  }

  clearCustomerCartId(userId: string): void {
    if (typeof window === "undefined") return;
    const key = `alimentari_customer_cart_id_${userId}`;
    const oldCartId = this.getCustomerCartId(userId);
    localStorage.removeItem(key);
    localStorage.removeItem(`alimentari_customer_cart_${userId}`);
    if (process.env.NODE_ENV === "development") {
      console.log(`[STORAGE DIAGNOSTIC] [${new Date().toISOString()}] clearCustomerCartId`, {
        userId,
        key,
        cartId: oldCartId,
        caller: getCallerStack(),
      });
    }
  }

  getPendingCheckoutIntent(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("alimentari_pending_checkout") === "true";
  }

  setPendingCheckoutIntent(intent: boolean): void {
    if (typeof window === "undefined") return;
    if (intent) {
      localStorage.setItem("alimentari_pending_checkout", "true");
    } else {
      localStorage.removeItem("alimentari_pending_checkout");
    }
  }

  clearPendingCheckoutIntent(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("alimentari_pending_checkout");
  }
}

// Global active cart storage provider abstraction
export const cartStorage: CartStorageProvider = new LocalStorageProvider();
