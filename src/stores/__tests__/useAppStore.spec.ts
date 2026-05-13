import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      locale: 'zh',
    });
  });

  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.locale).toBe('zh');
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
