import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Project } from '@/types';

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  expandedKeys: string[];
  loading: boolean;
  setProjects: (projects: Project[]) => void;
  selectProject: (id: string | null) => void;
  setExpandedKeys: (keys: string[]) => void;
  toggleExpand: (key: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set) => ({
      projects: [],
      selectedProjectId: null,
      expandedKeys: [],
      loading: false,
      setProjects: (projects) => set({ projects }),
      selectProject: (id) => set({ selectedProjectId: id }),
      setExpandedKeys: (keys) => set({ expandedKeys: keys }),
      toggleExpand: (key) =>
        set((state) => {
          const idx = state.expandedKeys.indexOf(key);
          if (idx > -1) {
            return { expandedKeys: state.expandedKeys.filter((k) => k !== key) };
          }
          return { expandedKeys: [...state.expandedKeys, key] };
        }),
      setLoading: (loading) => set({ loading }),
    }),
    { name: 'project' }
  )
);
