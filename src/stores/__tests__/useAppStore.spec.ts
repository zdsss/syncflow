import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      sidebarCollapsed: false,
      locale: 'zh',
    });
  });

  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.locale).toBe('zh');
  });

  it('toggleSidebar toggles sidebarCollapsed', () => {
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(true);

    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setLocale sets locale to en', () => {
    useAppStore.getState().setLocale('en');
    expect(useAppStore.getState().locale).toBe('en');
  });

  it('setLocale sets locale to zh', () => {
    useAppStore.setState({ locale: 'en' });
    useAppStore.getState().setLocale('zh');
    expect(useAppStore.getState().locale).toBe('zh');
  });
});
