import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => {
  const fns = {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  };
  return { default: fns, request: fns };
});

import api from '../api';
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
} from '../project.service';

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProjects calls GET /projects', async () => {
    await getProjects();
    expect(api.get).toHaveBeenCalledWith('/projects');
  });

  it('getProjectById calls GET /projects/:id with numeric id', async () => {
    api.get.mockResolvedValue({ id: 1, name: 'Test Project' });
    const result = await getProjectById(1);
    expect(api.get).toHaveBeenCalledWith('/projects/1');
    expect(result).toEqual({ id: 1, name: 'Test Project' });
  });

  it('createProject calls POST /projects with data', async () => {
    const data = { name: 'New Project', ownerId: 1 };
    await createProject(data);
    expect(api.post).toHaveBeenCalledWith('/projects', data);
  });

  it('updateProject calls PUT /projects/:id with data', async () => {
    const data = { name: 'Updated Project' };
    await updateProject(1, data);
    expect(api.put).toHaveBeenCalledWith('/projects/1', data);
  });

  it('deleteProject calls DELETE /projects/:id', async () => {
    await deleteProject(1);
    expect(api.delete).toHaveBeenCalledWith('/projects/1');
  });

  it('getPhaseTree calls GET /projects/:id/phases/tree', async () => {
    await getPhaseTree(1);
    expect(api.get).toHaveBeenCalledWith('/projects/1/phases/tree');
  });

  it('getMembers calls GET /projects/:id/members', async () => {
    await getMembers(1);
    expect(api.get).toHaveBeenCalledWith('/projects/1/members');
  });

  it('addMember calls POST /projects/:id/members', async () => {
    await addMember(1, { userId: 2, role: 'member' });
    expect(api.post).toHaveBeenCalledWith('/projects/1/members', { userId: 2, role: 'member' });
  });

  it('removeMember calls DELETE /projects/:id/members/:userId', async () => {
    await removeMember(1, 2);
    expect(api.delete).toHaveBeenCalledWith('/projects/1/members/2');
  });

  it('getGanttData calls GET /projects/:id/gantt', async () => {
    await getGanttData(1);
    expect(api.get).toHaveBeenCalledWith('/projects/1/gantt');
  });
});
