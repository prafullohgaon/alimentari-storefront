"use client";

import React, { useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";

function CartAuthSync() {
  const { data: session, status } = useSession();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isOffline = typeof window !== "undefined" && !window.navigator.onLine;

    if (status === "unauthenticated") {
      if (syncedUserIdRef.current !== null) {
        if (isOffline) {
          if (process.env.NODE_ENV === "development") {
            console.log("[AUTH DIAGNOSTIC] Offline status detected; skipping switchToGuestMode trigger.");
          }
          return;
        }
        if (process.env.NODE_ENV === "development") {
          const timestamp = new Date().toISOString();
          console.log(`[AUTH DIAGNOSTIC] [${timestamp}] Unauthenticated detected -> Calling switchToGuestMode`);
        }
        syncedUserIdRef.current = null;
        useCartStore.getState().switchToGuestMode();
      }
      return;
    }

    if (status === "authenticated" && session?.accessToken && session.user?.id) {
      const currentUserId = session.user.id;
      const flowId = `CartFlow #${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = new Date().toISOString();

      if (syncedUserIdRef.current !== currentUserId) {
        syncedUserIdRef.current = currentUserId;
        if (process.env.NODE_ENV === "development") {
          console.log(`[AUTH DIAGNOSTIC] [${timestamp}] [${flowId}] START Auth Sync Cycle for User: ${currentUserId}`);
        }
        useCartStore
          .getState()
          .mergeGuestCart(
            session.accessToken,
            session.user.email || undefined,
            currentUserId
          )
          .then(() => {
            if (process.env.NODE_ENV === "development") {
              console.log(`[AUTH DIAGNOSTIC] [${new Date().toISOString()}] [${flowId}] FINISHED mergeGuestCart`);
            }
          })
          .catch((err) => {
            console.error(`[AUTH DIAGNOSTIC] [${new Date().toISOString()}] [${flowId}] ERROR mergeGuestCart:`, err);
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
