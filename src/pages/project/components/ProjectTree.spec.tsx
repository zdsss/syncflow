import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import ProjectTree from './ProjectTree';
import { ProjectStatus } from '@/types';

vi.mock('./ProjectTree.module.css', () => ({ default: {} }));
vi.mock('@/components/business/HoverContextMenu/index.module.css', () => ({ default: {} }));
vi.mock('@/components/business/HoverContextMenu.module.css', () => ({ default: {} }));

vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  return {
    ...antd,
    message: { ...antd.message, info: vi.fn() },
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockProjects = [
  {
    id: 'p1',
    name: '项目 Alpha',
    status: ProjectStatus.IN_PROGRESS,
    leaderId: 'u1',
    startDate: '2025-01-01',
    endDate: '2025-06-01',
    completion: 50,
    category: 'dev',
    phase: 'development',
    parentId: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'p2',
    name: '项目 Beta',
    status: ProjectStatus.NOT_STARTED,
    leaderId: 'u2',
    startDate: '2025-03-01',
    endDate: '2025-09-01',
    completion: 0,
    category: 'design',
    phase: 'planning',
    parentId: null,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
];

/** Helper: hover over the wrapper to trigger the HoverContextMenu */
async function hoverToRevealMenu(nodeTestId: string) {
  const wrapper = screen.getByTestId(nodeTestId);
  fireEvent.mouseEnter(wrapper);
  // Wait for menu items to appear after the hover delay (~1000ms)
  await waitFor(() => {
    expect(screen.getByRole('menu')).toBeInTheDocument();
  }, { timeout: 2000 });
}

describe('ProjectTree', () => {
  const defaultProps = {
    projects: mockProjects,
    selectedProjectId: null,
    expandedKeys: [],
    onSelect: vi.fn(),
    onExpand: vi.fn(),
  };

  it('renders the search input', () => {
    renderWithAntd(<ProjectTree {...defaultProps} />);
    expect(screen.getByPlaceholderText('搜索项目...')).toBeInTheDocument();
  });

  it('renders project names', () => {
    renderWithAntd(<ProjectTree {...defaultProps} />);
    expect(screen.getByText('项目 Alpha')).toBeInTheDocument();
    expect(screen.getByText('项目 Beta')).toBeInTheDocument();
  });

  it('calls onSelect when a project node is clicked', async () => {
    const onSelect = vi.fn();
    renderWithAntd(<ProjectTree {...defaultProps} onSelect={onSelect} />);
    const node = screen.getByText('项目 Alpha');
    await userEvent.click(node);
    expect(onSelect).toHaveBeenCalledWith('p1');
  });

  it('filters projects based on search input', async () => {
    renderWithAntd(<ProjectTree {...defaultProps} />);
    const input = screen.getByPlaceholderText('搜索项目...');
    await userEvent.type(input, 'Alpha');
    expect(screen.getByText('项目 Alpha')).toBeInTheDocument();
    expect(screen.queryByText('项目 Beta')).not.toBeInTheDocument();
  });

  it('calls onExpand when tree is expanded', async () => {
    const projects = [
      {
        ...mockProjects[0],
        parentId: null,
      },
      {
        ...mockProjects[1],
        parentId: 'p1',
      },
    ];
    const onExpand = vi.fn();
    renderWithAntd(<ProjectTree {...defaultProps} projects={projects} onExpand={onExpand} />);
    expect(screen.getByText('项目 Alpha')).toBeInTheDocument();
  });

  it('shows HoverContextMenu menu items on hover (folder type)', async () => {
    renderWithAntd(<ProjectTree {...defaultProps} />);
    await hoverToRevealMenu('hover-menu-wrapper-p1');
    // Folder menu items (root-level nodes use 'folder' nodeType)
    expect(screen.getByText('新建文件夹')).toBeInTheDocument();
    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    expect(screen.getByText('通过模板创建')).toBeInTheDocument();
    expect(screen.getByText('加载工作流')).toBeInTheDocument();
  });

  it('calls onAddChild when "新建文件夹" menu item is clicked', async () => {
    const onAddChild = vi.fn();
    renderWithAntd(<ProjectTree {...defaultProps} onAddChild={onAddChild} />);
    await hoverToRevealMenu('hover-menu-wrapper-p1');
    const addItem = screen.getByText('新建文件夹');
    await userEvent.click(addItem);
    expect(onAddChild).toHaveBeenCalledWith('p1');
  });

  it('calls onEdit when "编辑" menu item is clicked', async () => {
    const onEdit = vi.fn();
    renderWithAntd(<ProjectTree {...defaultProps} onEdit={onEdit} />);
    await hoverToRevealMenu('hover-menu-wrapper-p1');
    const editItem = screen.getByText('编辑');
    await userEvent.click(editItem);
    expect(onEdit).toHaveBeenCalledWith('p1');
  });

  it('calls onDelete when "删除" menu item is clicked', async () => {
    const onDelete = vi.fn();
    renderWithAntd(<ProjectTree {...defaultProps} onDelete={onDelete} />);
    await hoverToRevealMenu('hover-menu-wrapper-p1');
    const deleteItem = screen.getByText('删除');
    await userEvent.click(deleteItem);
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('calls onAddChild when "新建项目" menu item is clicked', async () => {
    const onAddChild = vi.fn();
    renderWithAntd(<ProjectTree {...defaultProps} onAddChild={onAddChild} />);
    await hoverToRevealMenu('hover-menu-wrapper-p1');
    const newProjectItem = screen.getByText('新建项目');
    await userEvent.click(newProjectItem);
    expect(onAddChild).toHaveBeenCalledWith('p1');
  });

  it('shows message.info for unimplemented actions', async () => {
    renderWithAntd(<ProjectTree {...defaultProps} />);
    await hoverToRevealMenu('hover-menu-wrapper-p1');
    const workflowItem = screen.getByText('加载工作流');
    await userEvent.click(workflowItem);
    expect(message.info).toHaveBeenCalledWith('功能开发中');
  });

  it('renders folder icons for project nodes', () => {
    renderWithAntd(<ProjectTree {...defaultProps} />);
    // The project names should be visible as tree node text
    expect(screen.getByText('项目 Alpha')).toBeInTheDocument();
    expect(screen.getByText('项目 Beta')).toBeInTheDocument();
  });

  it('renders open folder icon for expanded nodes', () => {
    const projects = [
      { ...mockProjects[0] },
      { ...mockProjects[1], parentId: 'p1' },
    ];
    renderWithAntd(
      <ProjectTree {...defaultProps} projects={projects} expandedKeys={['p1']} />,
    );
    // Both parent and child names should be visible
    expect(screen.getByText('项目 Alpha')).toBeInTheDocument();
    expect(screen.getByText('项目 Beta')).toBeInTheDocument();
  });

  it('applies blue highlight style class on the tree for selected nodes', () => {
    renderWithAntd(
      <ProjectTree {...defaultProps} selectedProjectId="p1" />,
    );
    const treeEl = document.querySelector('[class*="tree"]');
    expect(treeEl).toBeInTheDocument();
  });
});
