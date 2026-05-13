import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useBreakpoint, useIsMobile } from '../useMediaQuery';

function createMockMediaQuery(initialMatches: boolean) {
  let listener: ((e: MediaQueryListEvent) => void) | null = null;
  const mql = {
    matches: initialMatches,
    media: '',
    addEventListener: vi.fn((_event: string, cb: any) => { listener = cb; }),
    removeEventListener: vi.fn(),
  };
  return {
    mql,
    change: (matches: boolean) => {
      mql.matches = matches;
      listener?.({ matches } as MediaQueryListEvent);
    },
  };
}

describe('useMediaQuery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial match state', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(createMockMediaQuery(true).mql as any);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when query does not match', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(createMockMediaQuery(false).mql as any);
    const { result } = renderHook(() => useMediaQuery('(min-width: 1920px)'));
    expect(result.current).toBe(false);
  });

  it('updates when media query changes', () => {
    const mock = createMockMediaQuery(false);
    vi.spyOn(window, 'matchMedia').mockReturnValue(mock.mql as any);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
    act(() => { mock.change(true); });
    expect(result.current).toBe(true);
  });
});

describe('useBreakpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns xs for small screens', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => createMockMediaQuery(false).mql as any,
    );
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('xs');
  });

  it('returns xl for large screens', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => createMockMediaQuery(true).mql as any,
    );
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('xl');
  });
});

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for mobile screens', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => createMockMediaQuery(false).mql as any,
    );
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false for desktop screens', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => createMockMediaQuery(true).mql as any,
    );
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
