"use client";

import React, { useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";

function CartAuthSync() {
  const { data: session, status } = useSession();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isOffline = typeof window !== "undefined" && !window.navigator.onLine;

    if (status === "unauthenticated") {
      if (!isOffline && useAuthStore.getState().token) {
        useAuthStore.getState().logout();
      }
      if (syncedUserIdRef.current !== null) {
        if (isOffline) {
          return;
        }
        syncedUserIdRef.current = null;
        useCartStore.getState().switchToGuestMode();
      }
      return;
    }

    if (status === "authenticated" && session?.accessToken) {
      if (useAuthStore.getState().token !== session.accessToken) {
        useAuthStore.getState().login(session.accessToken);
      }
    }

    if (status === "authenticated" && session?.accessToken && session.user?.id) {
      const currentUserId = session.user.id;

      if (syncedUserIdRef.current !== currentUserId) {
        syncedUserIdRef.current = currentUserId;
        useCartStore
          .getState()
          .mergeGuestCart(
            session.accessToken,
            session.user.email || undefined,
            currentUserId
          )
          .catch((err) => {
            console.error("[AuthProvider] Error merging guest cart:", err);
          });
      }
    }
  }, [status, session]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartAuthSync />
      {children}
    </SessionProvider>
  );
}
