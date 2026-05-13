import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import ResourceList from './ResourceList';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

const mockResources = [
  { id: '1', name: '张三', type: 'human', description: '高级工程师', tags: ['前端', 'React'], status: 'available', createdAt: '2024-01-15T00:00:00Z' },
  { id: '2', name: 'CNC机床', type: 'equipment', description: '高精度数控机床', tags: ['加工'], status: 'busy', createdAt: '2024-02-20T00:00:00Z' },
  { id: '3', name: '供应商X', type: 'supplier', description: '电子元器件供应商', tags: ['电子', '元器件'], status: 'unavailable', createdAt: '2024-03-10T00:00:00Z' },
  { id: '4', name: '维护设备', type: 'equipment', description: '检测设备', tags: ['检测'], status: 'maintenance', createdAt: '2024-04-05T00:00:00Z' },
];

describe('ResourceList', () => {
  const defaultProps = {
    resources: mockResources,
    loading: false,
    onSearch: vi.fn(),
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders table with all resources', () => {
    renderWithAntd(<ResourceList {...defaultProps} />);
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('CNC机床')).toBeInTheDocument();
    expect(screen.getByText('供应商X')).toBeInTheDocument();
    expect(screen.getByText('维护设备')).toBeInTheDocument();
  });

  it('shows status tags with correct labels', () => {
    renderWithAntd(<ResourceList {...defaultProps} />);
    expect(screen.getByText('可用')).toBeInTheDocument();
    expect(screen.getByText('忙碌')).toBeInTheDocument();
    expect(screen.getByText('不可用')).toBeInTheDocument();
    expect(screen.getByText('维护中')).toBeInTheDocument();
  });

  it('shows search input', () => {
    renderWithAntd(<ResourceList {...defaultProps} />);
    expect(screen.getByPlaceholderText('搜索资源...')).toBeInTheDocument();
  });

  it('shows add button and calls onAdd when clicked', async () => {
    const onAdd = vi.fn();
    renderWithAntd(<ResourceList {...defaultProps} onAdd={onAdd} />);
    const addBtn = screen.getByText('添加资源');
    expect(addBtn).toBeInTheDocument();
    await userEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { container } = renderWithAntd(<ResourceList {...defaultProps} loading={true} />);
    expect(container.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('displays tags for resources', () => {
    renderWithAntd(<ResourceList {...defaultProps} />);
    // 前端 appears in skill filter, skill tags under name, and table tags column
    expect(screen.getAllByText('前端').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('React').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('加工')).toBeInTheDocument();
  });

  it('calls onSearch when search is submitted', async () => {
    const onSearch = vi.fn();
    renderWithAntd(<ResourceList {...defaultProps} onSearch={onSearch} />);
    const searchInput = screen.getByPlaceholderText('搜索资源...');
    await userEvent.type(searchInput, '张三');
    await userEvent.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0][0]).toBe('张三');
  });

  it('shows borrow button for available resources when onBorrow is provided', () => {
    const onBorrow = vi.fn();
    renderWithAntd(<ResourceList {...defaultProps} onBorrow={onBorrow} />);
    // Available resources should show borrow button
    const borrowButtons = screen.getAllByText('借用');
    expect(borrowButtons.length).toBeGreaterThan(0);
  });

  it('calls onBorrow when borrow button is clicked', async () => {
    const onBorrow = vi.fn();
    renderWithAntd(<ResourceList {...defaultProps} onBorrow={onBorrow} />);
    const borrowButtons = screen.getAllByText('借用');
    await userEvent.click(borrowButtons[0]);
    expect(onBorrow).toHaveBeenCalled();
  });

  it('renders skill tags for human type resources', () => {
    renderWithAntd(<ResourceList {...defaultProps} />);
    // Human resource (id=1) should show skill tags below name
    const skillTags = screen.getByTestId('skill-tags-1');
    expect(skillTags).toBeTruthy();
    // Equipment resource (id=2) should NOT have skill tags
    expect(screen.queryByTestId('skill-tags-2')).toBeNull();
  });

  it('shows skill tag filter when human resources have tags', () => {
    renderWithAntd(<ResourceList {...defaultProps} />);
    expect(screen.getByTestId('skill-tag-filter')).toBeTruthy();
    expect(screen.getByText('技能标签:')).toBeInTheDocument();
  });

  it('filters resources by skill tag when a tag is clicked', async () => {
    renderWithAntd(<ResourceList {...defaultProps} />);
    // Click on the '前端' tag filter
    const tagFilter = screen.getByTestId('skill-filter-前端');
    await userEvent.click(tagFilter);
    // Only resource with '前端' tag should be visible
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.queryByText('CNC机床')).toBeNull();
  });
});
