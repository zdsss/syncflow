import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../useDashboardStore';

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      viewMode: 'schedule',
      dateRange: ['', ''],
      companyFilter: 'all',
      progressFilter: 'all',
    });
  });

  it('has correct initial state', () => {
    const state = useDashboardStore.getState();
    expect(state.viewMode).toBe('schedule');
    expect(state.dateRange).toEqual(['', '']);
    expect(state.companyFilter).toBe('all');
    expect(state.progressFilter).toBe('all');
  });

  it('setViewMode switches to kanban', () => {
    useDashboardStore.getState().setViewMode('kanban');
    expect(useDashboardStore.getState().viewMode).toBe('kanban');
  });

  it('setViewMode switches back to schedule', () => {
    useDashboardStore.setState({ viewMode: 'kanban' });
    useDashboardStore.getState().setViewMode('schedule');
    expect(useDashboardStore.getState().viewMode).toBe('schedule');
  });

  it('setCompanyFilter updates company filter', () => {
    useDashboardStore.getState().setCompanyFilter('acme');
    expect(useDashboardStore.getState().companyFilter).toBe('acme');
  });

  it('setProgressFilter updates progress filter', () => {
    useDashboardStore.getState().setProgressFilter('on_track');
    expect(useDashboardStore.getState().progressFilter).toBe('on_track');
  });

  it('setDateRange updates date range', () => {
    useDashboardStore.getState().setDateRange(['2024-01-01', '2024-06-01']);
    expect(useDashboardStore.getState().dateRange).toEqual(['2024-01-01', '2024-06-01']);
  });

  it('setDateRange with null clears date range', () => {
    useDashboardStore.getState().setDateRange(['2024-01-01', '2024-06-01']);
    useDashboardStore.getState().setDateRange(null);
    expect(useDashboardStore.getState().dateRange).toBeNull();
  });
});
