import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import dayjs from 'dayjs';

export type DashboardViewMode = 'schedule' | 'kanban' | 'department';

interface DashboardState {
  viewMode: DashboardViewMode;
  dateRange: [string, string] | null;
  companyFilter: string;
  progressFilter: string;
  setViewMode: (mode: DashboardViewMode) => void;
  setDateRange: (range: [string, string] | null) => void;
  setCompanyFilter: (filter: string) => void;
  setProgressFilter: (filter: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      viewMode: 'schedule',
      dateRange: [
        dayjs().startOf('month').format('YYYY-MM-DD'),
        dayjs().add(11, 'month').endOf('month').format('YYYY-MM-DD'),
      ],
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
