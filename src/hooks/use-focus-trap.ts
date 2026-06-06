import { useEffect, useRef } from "react";

interface FocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
}

export function useFocusTrap({ active, onEscape }: FocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Save previous active element for focus restoration
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    // Attempt to focus the first interactive element inside container
    const focusFirst = () => {
      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    // A tiny delay to allow animations/transitions to finish rendering the DOM
    const timer = setTimeout(focusFirst, 80);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const currentFocusables = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      );

      if (currentFocusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = currentFocusables[0];
      const lastElement = currentFocusables[currentFocusables.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab (backward)
        if (activeElement === firstElement || !container.contains(activeElement)) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab (forward)
        if (activeElement === lastElement || !container.contains(activeElement)) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previous active element
      if (previousActiveElementRef.current) {
        setTimeout(() => {
          previousActiveElementRef.current?.focus();
        }, 50);
      }
    };
  }, [active, onEscape]);

  return containerRef;
}
