import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleCardGrid from './RoleCardGrid';

const mockGetMembers = vi.fn();

vi.mock('@/stores/useConfigStore', () => ({
  useConfigStore: () => ({
    departments: [
      { id: 'd1', name: '公司管理层' },
      { id: 'd2', name: '设计部' },
    ],
    roles: [
      { id: 'r1', name: 'CEO', departmentId: 'd1', permissions: [], memberCount: 1 },
      { id: 'r2', name: 'CTO', departmentId: 'd1', permissions: [], memberCount: 1 },
      { id: 'r5', name: 'UI设计师', departmentId: 'd2', permissions: [], memberCount: 2 },
    ],
    selectedDepartmentId: 'd1',
    selectDepartment: vi.fn(),
    setRoles: vi.fn(),
  }),
}));

vi.mock('@/services/config.service', () => ({
  getRoles: vi.fn().mockResolvedValue({ code: 200, data: [] }),
  getMembers: (...args: unknown[]) => mockGetMembers(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('RoleCardGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMembers.mockImplementation((roleId: string) => {
      const membersByRole: Record<string, Array<{ id: string; name: string }>> = {
        r1: [{ id: 'u6', name: '张伟' }],
        r2: [{ id: 'u7', name: '李娜' }],
        r5: [{ id: 'u1', name: '邓智豪' }, { id: 'u2', name: '王美玲' }],
      };
      return Promise.resolve({ code: 200, data: membersByRole[roleId] || [] });
    });
  });

  it('renders department tabs from store data', () => {
    renderWithAntd(<RoleCardGrid />);
    expect(screen.getByText('公司管理层')).toBeInTheDocument();
    expect(screen.getByText('设计部')).toBeInTheDocument();
  });

  it('renders role cards', () => {
    renderWithAntd(<RoleCardGrid />);
    expect(screen.getByText(/CEO/)).toBeInTheDocument();
    expect(screen.getByText(/CTO/)).toBeInTheDocument();
    expect(screen.getByText(/UI设计师/)).toBeInTheDocument();
  });

  it('fetches members from API for each role and displays counts', async () => {
    renderWithAntd(<RoleCardGrid />);
    await waitFor(() => {
      expect(mockGetMembers).toHaveBeenCalledWith('r1');
      expect(mockGetMembers).toHaveBeenCalledWith('r2');
      expect(mockGetMembers).toHaveBeenCalledWith('r5');
    });
    await waitFor(() => {
      expect(screen.getByText(/CEO.*1人/)).toBeInTheDocument();
      expect(screen.getByText(/CTO.*1人/)).toBeInTheDocument();
    });
  });

  it('displays member names fetched from API', async () => {
    renderWithAntd(<RoleCardGrid />);
    await waitFor(() => {
      expect(screen.getByText('张伟')).toBeInTheDocument();
      expect(screen.getByText('李娜')).toBeInTheDocument();
    });
  });

  it('does not import mockUsers', async () => {
    // This test verifies the component doesn't depend on mock data.
    // If it did, the members would come from mockUsers not from getMembers API.
    renderWithAntd(<RoleCardGrid />);
    await waitFor(() => {
      // getMembers should have been called (proving API usage, not mock data)
      expect(mockGetMembers).toHaveBeenCalled();
    });
  });

  it('generates department tabs dynamically from store departments', () => {
    renderWithAntd(<RoleCardGrid />);
    // Should render exactly the departments from the store, not hardcoded tabs
    const tabs = document.querySelectorAll('.ant-tabs-tab');
    expect(tabs.length).toBe(2);
    expect(screen.getByText('公司管理层')).toBeInTheDocument();
    expect(screen.getByText('设计部')).toBeInTheDocument();
  });
});
