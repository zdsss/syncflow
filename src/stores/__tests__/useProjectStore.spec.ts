import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../useProjectStore';
import { ProjectPhase, ProjectStatus, type Project } from '@/types';

const mockProject: Project = {
  id: 'p1',
  name: 'Project Alpha',
  category: 'development',
  phase: ProjectPhase.DEVELOPMENT,
  status: ProjectStatus.IN_PROGRESS,
  leaderId: 'user1',
  startDate: '2024-01-01',
  endDate: '2024-06-01',
  completion: 50,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      selectedProjectId: null,
      expandedKeys: [],
      loading: false,
    });
  });

  it('has correct initial state', () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.selectedProjectId).toBeNull();
    expect(state.expandedKeys).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('setProjects updates projects array', () => {
    useProjectStore.getState().setProjects([mockProject]);
    expect(useProjectStore.getState().projects).toEqual([mockProject]);
  });

  it('selectProject updates selectedProjectId', () => {
    useProjectStore.getState().selectProject('p1');
    expect(useProjectStore.getState().selectedProjectId).toBe('p1');
  });

  it('selectProject accepts null to deselect', () => {
    useProjectStore.setState({ selectedProjectId: 'p1' });
    useProjectStore.getState().selectProject(null);
    expect(useProjectStore.getState().selectedProjectId).toBeNull();
  });

  it('toggleExpand adds key if not present', () => {
    useProjectStore.getState().toggleExpand('key1');
    expect(useProjectStore.getState().expandedKeys).toEqual(['key1']);
  });

  it('toggleExpand removes key if present', () => {
    useProjectStore.setState({ expandedKeys: ['key1', 'key2'] });
    useProjectStore.getState().toggleExpand('key1');
    expect(useProjectStore.getState().expandedKeys).toEqual(['key2']);
  });

  it('setLoading updates loading flag', () => {
    useProjectStore.getState().setLoading(true);
    expect(useProjectStore.getState().loading).toBe(true);
    useProjectStore.getState().setLoading(false);
    expect(useProjectStore.getState().loading).toBe(false);
  });
});
