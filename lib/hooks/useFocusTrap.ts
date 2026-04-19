import { useEffect, useRef, useCallback } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside a container while it's mounted.
 * Also closes on Escape key.
 *
 * Usage:
 *   const trapRef = useFocusTrap(onClose);
 *   return <div ref={trapRef}>...</div>;
 */
export function useFocusTrap(onClose?: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Remember what was focused before the modal opened
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus the first focusable element inside the trap
    const container = ref.current;
    if (!container) return;

    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusables.length > 0) {
      // Small delay so the modal animation finishes before focus shift
      requestAnimationFrame(() => focusables[0].focus());
    }

    return () => {
      // Restore focus when modal closes
      previousFocus.current?.focus();
    };
  }, []);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes the modal
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      // Tab key traps focus inside the container
      if (e.key === "Tab") {
        const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return ref;
}
