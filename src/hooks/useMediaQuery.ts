import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const breakpoints = {
  xs: 0,
  sm: 768,
  md: 1024,
  lg: 1440,
  xl: 1920,
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useBreakpoint(): Breakpoint {
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);

  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${breakpoints.md}px)`);
}
