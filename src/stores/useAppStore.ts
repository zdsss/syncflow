import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  locale: 'zh' | 'en';
  toggleSidebar: () => void;
  setLocale: (locale: 'zh' | 'en') => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      sidebarCollapsed: false,
      locale: 'zh',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'app' }
  )
);
