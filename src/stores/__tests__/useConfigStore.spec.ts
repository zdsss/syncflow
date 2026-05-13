import { describe, it, expect, beforeEach } from 'vitest';
import { useConfigStore } from '../useConfigStore';

const mockDepartment = { id: 'dept-1', name: 'Engineering', parentId: null, sortOrder: 1 };
const mockDepartment2 = { id: 'dept-2', name: 'Design', parentId: null, sortOrder: 2 };
const mockRole = { id: 'role-1', name: 'Developer', departmentId: 'dept-1', description: 'Dev role', permissions: ['read', 'write'], memberCount: 5 };
const mockUser = { id: 'user-1', name: 'Alice', email: 'alice@example.com', phone: '123', departmentId: 'dept-1', roleIds: ['role-1'], teamIds: ['team-1'], status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2025-01-02' };
const mockUser2 = { id: 'user-2', name: 'Bob', email: 'bob@example.com', departmentId: 'dept-1', roleIds: ['role-1'], teamIds: [], status: 'inactive' as const, createdAt: '2025-02-01', updatedAt: '2025-02-02' };

describe('useConfigStore', () => {
  beforeEach(() => {
    useConfigStore.setState({
      departments: [],
      roles: [],
      members: [],
      selectedDepartmentId: null,
      selectedRoleId: null,
      loading: false,
    });
  });

  it('has correct initial state', () => {
    const state = useConfigStore.getState();
    expect(state.departments).toEqual([]);
    expect(state.roles).toEqual([]);
    expect(state.members).toEqual([]);
    expect(state.selectedDepartmentId).toBeNull();
    expect(state.selectedRoleId).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('setDepartments updates departments', () => {
    useConfigStore.getState().setDepartments([mockDepartment, mockDepartment2]);
    const state = useConfigStore.getState();
    expect(state.departments).toEqual([mockDepartment, mockDepartment2]);
    expect(state.departments).toHaveLength(2);
  });

  it('setRoles updates roles', () => {
    useConfigStore.getState().setRoles([mockRole]);
    const state = useConfigStore.getState();
    expect(state.roles).toEqual([mockRole]);
    expect(state.roles).toHaveLength(1);
  });

  it('setMembers updates members', () => {
    useConfigStore.getState().setMembers([mockUser, mockUser2]);
    const state = useConfigStore.getState();
    expect(state.members).toEqual([mockUser, mockUser2]);
    expect(state.members).toHaveLength(2);
  });

  it('selectDepartment sets selectedDepartmentId and resets selectedRoleId', () => {
    useConfigStore.getState().selectRole('role-1');
    expect(useConfigStore.getState().selectedRoleId).toBe('role-1');

    useConfigStore.getState().selectDepartment('dept-1');
    const state = useConfigStore.getState();
    expect(state.selectedDepartmentId).toBe('dept-1');
    expect(state.selectedRoleId).toBeNull();
  });

  it('selectRole sets selectedRoleId', () => {
    useConfigStore.getState().selectRole('role-1');
    expect(useConfigStore.getState().selectedRoleId).toBe('role-1');
  });

  it('selectRole with null clears selectedRoleId', () => {
    useConfigStore.getState().selectRole('role-1');
    expect(useConfigStore.getState().selectedRoleId).toBe('role-1');

    useConfigStore.getState().selectRole(null);
    expect(useConfigStore.getState().selectedRoleId).toBeNull();
  });

  it('setLoading updates loading flag', () => {
    expect(useConfigStore.getState().loading).toBe(false);

    useConfigStore.getState().setLoading(true);
    expect(useConfigStore.getState().loading).toBe(true);

    useConfigStore.getState().setLoading(false);
    expect(useConfigStore.getState().loading).toBe(false);
  });
});
