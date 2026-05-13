import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  locale: 'zh' | 'en';
  setLocale: (locale: 'zh' | 'en') => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      locale: 'zh',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'app' }
  )
);
