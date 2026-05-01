import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type DashboardViewMode = 'schedule' | 'kanban';

interface DashboardState {
  viewMode: DashboardViewMode;
  dateRange: [string, string];
  companyFilter: string;
  progressFilter: string;
  setViewMode: (mode: DashboardViewMode) => void;
  setDateRange: (range: [string, string]) => void;
  setCompanyFilter: (filter: string) => void;
  setProgressFilter: (filter: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      viewMode: 'schedule',
      dateRange: ['', ''],
      companyFilter: 'all',
      progressFilter: 'all',
      setViewMode: (mode) => set({ viewMode: mode }),
      setDateRange: (range) => set({ dateRange: range }),
      setCompanyFilter: (filter) => set({ companyFilter: filter }),
      setProgressFilter: (filter) => set({ progressFilter: filter }),
    }),
    { name: 'dashboard' }
  )
);
