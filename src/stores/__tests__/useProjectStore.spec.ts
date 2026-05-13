import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '../useProjectStore';
import type { ProjectVO } from '@/services/project.service';

vi.mock('@/services/project.service', () => ({
  getProjects: vi.fn(),
  getProjectById: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getPhaseTree: vi.fn(),
  getMembers: vi.fn(),
  addMember: vi.fn(),
  removeMember: vi.fn(),
  getGanttData: vi.fn(),
}));

import { getProjects, getProjectById } from '@/services/project.service';

const mockGetProjects = vi.mocked(getProjects);
const mockGetProjectById = vi.mocked(getProjectById);

const mockProject: ProjectVO = {
  id: 1,
  name: 'Project Alpha',
  status: 2,
  ownerId: 1,
  progress: 50,
  plannedStart: '2024-01-01',
  plannedEnd: '2024-06-01',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const mockProject2: ProjectVO = {
  id: 2,
  name: 'Project Beta',
  status: 1,
  ownerId: 2,
  progress: 10,
  plannedStart: '2024-03-01',
  plannedEnd: '2024-09-01',
  createdAt: '2024-02-01',
  updatedAt: '2024-02-01',
};

describe('useProjectStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectStore.setState({
      projects: [],
      selectedProject: null,
      phaseTree: [],
      members: [],
      ganttData: null,
      expandedKeys: [],
      loading: false,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.selectedProject).toBeNull();
    expect(state.expandedKeys).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('setProjects updates projects array', () => {
    useProjectStore.getState().setProjects([mockProject]);
    expect(useProjectStore.getState().projects).toEqual([mockProject]);
  });

  it('setSelectedProject updates selectedProject', () => {
    useProjectStore.getState().setSelectedProject(mockProject);
    expect(useProjectStore.getState().selectedProject).toEqual(mockProject);
  });

  it('setSelectedProject accepts null to deselect', () => {
    useProjectStore.setState({ selectedProject: mockProject });
    useProjectStore.getState().setSelectedProject(null);
    expect(useProjectStore.getState().selectedProject).toBeNull();
  });

  it('toggleExpand adds key if not present', () => {
    useProjectStore.getState().toggleExpand(1);
    expect(useProjectStore.getState().expandedKeys).toEqual([1]);
  });

  it('toggleExpand removes key if present', () => {
    useProjectStore.setState({ expandedKeys: [1, 2] });
    useProjectStore.getState().toggleExpand(1);
    expect(useProjectStore.getState().expandedKeys).toEqual([2]);
  });

  // --- Async action tests ---

  describe('fetchProjects', () => {
    it('sets loading=true while fetching', async () => {
      mockGetProjects.mockResolvedValue({ code: 200, data: [mockProject] } as any);

      const promise = useProjectStore.getState().fetchProjects();
      expect(useProjectStore.getState().loading).toBe(true);

      await promise;
    });

    it('sets projects on successful fetch', async () => {
      mockGetProjects.mockResolvedValue({ code: 200, data: [mockProject, mockProject2] } as any);

      await useProjectStore.getState().fetchProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([mockProject, mockProject2]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error and loading=false on failure', async () => {
      mockGetProjects.mockRejectedValue(new Error('Network error'));

      await useProjectStore.getState().fetchProjects();

      const state = useProjectStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.projects).toEqual([]);
    });

    it('sets default error message when error has no message', async () => {
      mockGetProjects.mockRejectedValue('some error');

      await useProjectStore.getState().fetchProjects();

      expect(useProjectStore.getState().error).toBe('Failed to fetch projects');
    });
  });

  describe('fetchProjectById', () => {
    it('sets loading=true while fetching', async () => {
      mockGetProjectById.mockResolvedValue({ code: 200, data: mockProject } as any);

      const promise = useProjectStore.getState().fetchProjectById(1);
      expect(useProjectStore.getState().loading).toBe(true);

      await promise;
    });

    it('sets selectedProject on successful fetch', async () => {
      mockGetProjectById.mockResolvedValue({ code: 200, data: mockProject } as any);

      await useProjectStore.getState().fetchProjectById(1);

      const state = useProjectStore.getState();
      expect(state.selectedProject).toEqual(mockProject);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error and loading=false on failure', async () => {
      mockGetProjectById.mockRejectedValue(new Error('Not found'));

      await useProjectStore.getState().fetchProjectById(999);

      const state = useProjectStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Not found');
    });

    it('sets default error message when error has no message', async () => {
      mockGetProjectById.mockRejectedValue('some error');

      await useProjectStore.getState().fetchProjectById(999);

      expect(useProjectStore.getState().error).toBe('Failed to fetch project');
    });
  });
});
