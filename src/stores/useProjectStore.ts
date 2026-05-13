import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProjectVO, PhaseNode, ProjectMember, GanttData } from '@/services/project.service';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getPhaseTree,
  getMembers,
  addMember,
  removeMember,
  getGanttData,
} from '@/services/project.service';

interface ProjectState {
  // Data
  projects: ProjectVO[];
  selectedProject: ProjectVO | null;
  phaseTree: PhaseNode[];
  members: ProjectMember[];
  ganttData: GanttData | null;
  expandedKeys: string[];

  // UI
  loading: boolean;
  error: string | null;

  // Sync actions
  setProjects: (projects: ProjectVO[]) => void;
  setSelectedProject: (project: ProjectVO | null) => void;
  setExpandedKeys: (keys: string[]) => void;
  toggleExpand: (key: string) => void;

  // Async actions
  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: number) => Promise<void>;
  createProject: (data: Record<string, any>) => Promise<ProjectVO>;
  updateProject: (id: number, data: Record<string, any>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  fetchPhaseTree: (id: number) => Promise<void>;
  fetchMembers: (id: number) => Promise<void>;
  addMember: (id: number, data: { userId: number; projectRole?: string }) => Promise<void>;
  removeMember: (id: number, userId: number) => Promise<void>;
  fetchGanttData: (id: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      // Initial state
      projects: [],
      selectedProject: null,
      phaseTree: [],
      members: [],
      ganttData: null,
      expandedKeys: [],
      loading: false,
      error: null,

      // Sync actions
      setProjects: (projects) => set({ projects }),
      setSelectedProject: (project) => set({ selectedProject: project }),
      setExpandedKeys: (keys) => set({ expandedKeys: keys }),
      toggleExpand: (key) =>
        set((state) => {
          const idx = state.expandedKeys.indexOf(key);
          if (idx > -1) {
            return { expandedKeys: state.expandedKeys.filter((k) => k !== key) };
          }
          return { expandedKeys: [...state.expandedKeys, key] };
        }),

      // Async actions
      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const res = await getProjects();
          // res.data is the tree ProjectVO[]
          set({ projects: res.data, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch projects', loading: false });
        }
      },

      fetchProjectById: async (id) => {
        set({ loading: true, error: null });
        try {
          const res = await getProjectById(id);
          set({ selectedProject: res.data, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch project', loading: false });
        }
      },

      createProject: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await createProject(data);
          const newProject = res.data;
          set((state) => ({
            projects: [...state.projects, newProject],
            loading: false,
          }));
          return newProject;
        } catch (err: any) {
          set({ error: err?.message || 'Failed to create project', loading: false });
          throw err;
        }
      },

      updateProject: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const res = await updateProject(id, data);
          const updated = res.data;
          set((state) => {
            // Helper to recursively update the project in the tree
            const updateInTree = (nodes: ProjectVO[]): ProjectVO[] =>
              nodes.map((node) => {
                if (node.id === id) return { ...node, ...updated };
                if (node.children?.length) return { ...node, children: updateInTree(node.children) };
                return node;
              });
            const projects = updateInTree(state.projects);
            const selectedProject = state.selectedProject?.id === id ? updated : state.selectedProject;
            return { projects, selectedProject, loading: false };
          });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to update project', loading: false });
          throw err;
        }
      },

      deleteProject: async (id) => {
        set({ loading: true, error: null });
        try {
          await deleteProject(id);
          set((state) => {
            // Recursively remove the project from the tree
            const removeFromTree = (nodes: ProjectVO[]): ProjectVO[] =>
              nodes
                .filter((node) => node.id !== id)
                .map((node) => {
                  if (node.children?.length) return { ...node, children: removeFromTree(node.children) };
                  return node;
                });
            const projects = removeFromTree(state.projects);
            const selectedProject = state.selectedProject?.id === id ? null : state.selectedProject;
            return { projects, selectedProject, loading: false };
          });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to delete project', loading: false });
          throw err;
        }
      },

      fetchPhaseTree: async (id) => {
        set({ loading: true, error: null });
        try {
          const res = await getPhaseTree(id);
          set({ phaseTree: res.data, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch phase tree', loading: false });
        }
      },

      fetchMembers: async (id) => {
        set({ loading: true, error: null });
        try {
          const res = await getMembers(id);
          set({ members: res.data, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch members', loading: false });
        }
      },

      addMember: async (id, data) => {
        set({ loading: true, error: null });
        try {
          await addMember(id, data);
          // Backend returns void, re-fetch members to get the updated list
          const membersRes = await getMembers(id);
          set({ members: membersRes.data, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to add member', loading: false });
          throw err;
        }
      },

      removeMember: async (id, userId) => {
        set({ loading: true, error: null });
        try {
          await removeMember(id, userId);
          set((state) => ({
            members: state.members.filter((m) => m.userId !== userId),
            loading: false,
          }));
        } catch (err: any) {
          set({ error: err?.message || 'Failed to remove member', loading: false });
          throw err;
        }
      },

      fetchGanttData: async (id) => {
        set({ loading: true, error: null });
        try {
          const res = await getGanttData(id);
          set({ ganttData: res.data, loading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch gantt data', loading: false });
        }
      },
    }),
    { name: 'project' }
  )
);
