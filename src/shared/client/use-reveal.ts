"use client";

import { useEffect, useRef } from "react";

/**
 * Smoothly scrolls the element carrying the returned ref into view whenever `dep` changes
 * (never on first render). Used so a step change or a success message that replaces a long form
 * doesn't leave the visitor looking at the footer.
 */
export function useRevealOnChange<T extends HTMLElement>(dep: unknown, block: ScrollLogicalPosition = "start") {
  const ref = useRef<T>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.scrollIntoView({ block, behavior: "smooth" });
  }, [dep, block]);
  return ref;
}
