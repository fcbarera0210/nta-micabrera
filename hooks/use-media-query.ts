"use client";

import { useState, useEffect } from "react";

/**
 * Hook que evalúa una media query. En SSR y primer paint devuelve false (mobile-first).
 * A partir del primer efecto en cliente devuelve el valor real.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

const DESKTOP_QUERY = "(min-width: 768px)";

/** True cuando el viewport es md o mayor (768px+). */
export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
