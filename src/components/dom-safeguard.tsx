"use client";

import { useEffect } from "react";

export function DomSafeguard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Patch Node.prototype.removeChild to prevent browser extension DOM mutations from breaking React reconciler
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("DomSafeguard: Suppressed invalid removeChild call on node:", child, "Parent:", this);
        }
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    // Patch Node.prototype.insertBefore to prevent browser extension insertion errors
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("DomSafeguard: Suppressed invalid insertBefore call on node:", referenceNode, "Parent:", this);
        }
        return newNode;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };
  }, []);

  return null;
}
