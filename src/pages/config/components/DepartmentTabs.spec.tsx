import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import DepartmentTabs from './DepartmentTabs';

const mockSelectDepartment = vi.fn();
const mockSetDepartments = vi.fn();
const mockSetRoles = vi.fn();
const mockSetLoading = vi.fn();

let mockSelectedDepartmentId = 'd1';
let mockDepartments = [
  { id: 'd1', name: '公司管理层' },
  { id: 'd2', name: '设计部' },
  { id: 'd3', name: '产品部' },
  { id: 'd4', name: '研发部' },
  { id: 'd5', name: '测试部' },
];

vi.mock('@/stores/useConfigStore', () => ({
  useConfigStore: () => ({
    selectedDepartmentId: mockSelectedDepartmentId,
    selectDepartment: mockSelectDepartment,
    setDepartments: mockSetDepartments,
    setRoles: mockSetRoles,
    setLoading: mockSetLoading,
    departments: mockDepartments,
  }),
}));

const mockGetDepartments = vi.fn().mockResolvedValue({
  code: 200,
  data: [
    { id: 'd1', name: '公司管理层' },
    { id: 'd4', name: '研发部' },
  ],
});
const mockGetRoles = vi.fn().mockResolvedValue({ code: 200, data: [] });
const mockCreateDepartment = vi.fn().mockResolvedValue({ code: 200, data: { id: 'd-new', name: '新部门' } });
const mockUpdateDepartment = vi.fn().mockResolvedValue({ code: 200, data: { id: 'd1', name: '更新名称' } });
const mockRemoveDepartment = vi.fn().mockResolvedValue({ code: 200, message: 'ok' });

vi.mock('@/services/config.service', () => ({
  getDepartments: (...args: any[]) => mockGetDepartments(...args),
  getRoles: (...args: any[]) => mockGetRoles(...args),
  createDepartment: (...args: any[]) => mockCreateDepartment(...args),
  updateDepartment: (...args: any[]) => mockUpdateDepartment(...args),
  removeDepartment: (...args: any[]) => mockRemoveDepartment(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

/** Helper: find the primary action button inside an open Ant Design modal */
function getModalOkButton() {
  // Ant Design renders Modal into a portal with class .ant-modal-wrap
  const modalWrap = document.querySelector('.ant-modal-wrap');
  if (!modalWrap) return null;
  return modalWrap.querySelector('.ant-btn-primary') as HTMLButtonElement | null;
}

describe('DepartmentTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedDepartmentId = 'd1';
    mockDepartments = [
      { id: 'd1', name: '公司管理层' },
      { id: 'd2', name: '设计部' },
      { id: 'd3', name: '产品部' },
      { id: 'd4', name: '研发部' },
      { id: 'd5', name: '测试部' },
    ];
  });

  it('renders department tabs', () => {
    renderWithAntd(<DepartmentTabs />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('shows tab labels', () => {
    renderWithAntd(<DepartmentTabs />);
    expect(screen.getByText('公司管理层')).toBeInTheDocument();
    expect(screen.getByText('设计部')).toBeInTheDocument();
    expect(screen.getByText('产品部')).toBeInTheDocument();
    expect(screen.getByText('研发部')).toBeInTheDocument();
    expect(screen.getByText('测试部')).toBeInTheDocument();
  });

  it('shows active tab based on selectedDepartmentId', () => {
    renderWithAntd(<DepartmentTabs />);
    const activeTab = screen.getByText('公司管理层').closest('[role="tab"]');
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls selectDepartment when clicking another tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DepartmentTabs />);
    await user.click(screen.getByText('研发部'));
    expect(mockSelectDepartment).toHaveBeenCalledWith('d4');
  });

  it('renders 5 department tabs', () => {
    renderWithAntd(<DepartmentTabs />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });

  // --- Department CRUD tests ---

  it('shows an add department button', () => {
    renderWithAntd(<DepartmentTabs />);
    expect(screen.getByLabelText('添加部门')).toBeInTheDocument();
  });

  it('opens add department modal when clicking add button', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DepartmentTabs />);
    await user.click(screen.getByLabelText('添加部门'));
    expect(await screen.findByText('新增部门')).toBeInTheDocument();
  });

  it('submits createDepartment when adding a new department', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DepartmentTabs />);
    await user.click(screen.getByLabelText('添加部门'));
    // Wait for modal to appear
    await screen.findByText('新增部门');
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '新部门');
    const okBtn = getModalOkButton();
    expect(okBtn).toBeTruthy();
    await user.click(okBtn!);
    await waitFor(() => {
      expect(mockCreateDepartment).toHaveBeenCalledWith({ name: '新部门' });
    });
  });

  it('shows edit and delete action buttons on each tab', () => {
    renderWithAntd(<DepartmentTabs />);
    const editButtons = screen.getAllByLabelText('编辑部门');
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
    const deleteButtons = screen.getAllByLabelText('删除部门');
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('opens edit modal when clicking edit on a tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DepartmentTabs />);
    const editButtons = screen.getAllByLabelText('编辑部门');
    await user.click(editButtons[0]);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('公司管理层');
  });

  it('submits updateDepartment when editing a department', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DepartmentTabs />);
    const editButtons = screen.getAllByLabelText('编辑部门');
    await user.click(editButtons[0]);
    await screen.findByRole('dialog');
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '管理层');
    const okBtn = getModalOkButton();
    expect(okBtn).toBeTruthy();
    await user.click(okBtn!);
    await waitFor(() => {
      expect(mockUpdateDepartment).toHaveBeenCalledWith('d1', { name: '管理层' });
    });
  });

  it('shows delete confirmation when clicking delete on a tab', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DepartmentTabs />);
    const deleteButtons = screen.getAllByLabelText('删除部门');
    await user.click(deleteButtons[0]);
    expect(await screen.findByText(/确定要删除/)).toBeInTheDocument();
  });

  it('calls removeDepartment after confirming delete', async () => {
    const user = userEvent.setup();
    renderWithAntd(<DepartmentTabs />);
    const deleteButtons = screen.getAllByLabelText('删除部门');
    await user.click(deleteButtons[0]);
    const popconfirm = await screen.findByText(/确定要删除/);
    const confirmBtn = popconfirm.closest('.ant-popover')!.querySelector('.ant-btn-primary') as HTMLButtonElement;
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(mockRemoveDepartment).toHaveBeenCalledWith('d1');
    });
  });
});
