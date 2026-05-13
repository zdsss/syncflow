import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect } from 'vitest';
import TaskDetailPanel from './TaskDetailPanel';
import type { TaskItem } from './TaskList';

vi.mock('./QueryPage.module.css', () => ({
  default: {
    detailPanel: 'detailPanel',
    detailHeader: 'detailHeader',
    detailTitle: 'detailTitle',
    businessTypeRow: 'businessTypeRow',
    businessTypeLabel: 'businessTypeLabel',
    businessTypeSelect: 'businessTypeSelect',
    actionButtons: 'actionButtons',
    detailContent: 'detailContent',
    section: 'section',
    sectionTitle: 'sectionTitle',
    templateSelect: 'templateSelect',
    templateHint: 'templateHint',
    processRecord: 'processRecord',
    processDot: 'processDot',
    processInfo: 'processInfo',
    processAction: 'processAction',
    processTime: 'processTime',
    emptyDetail: 'emptyDetail',
    participantItem: 'participantItem',
    participantAvatar: 'participantAvatar',
    participantName: 'participantName',
    participantRole: 'participantRole',
    detailNavigation: 'detailNavigation',
  },
}));

const mockTask: TaskItem = {
  id: '1',
  code: 'P3-L2-010',
  name: '电芯来料异常处理',
  status: '进行中',
  statusLabel: '进行中',
  priority: '紧急',
  priorityLabel: '紧急',
  assignee: '邓智豪',
  dueDate: '2026/05/10',
  overdue: false,
  progress: 40,
  starred: true,
};

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TaskDetailPanel (query)', () => {
  it('renders without crashing with no task', () => {
    renderWithAntd(<TaskDetailPanel />);
    expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument();
    expect(screen.getByText('任务详情')).toBeInTheDocument();
  });

  it('displays task name when task is selected', () => {
    renderWithAntd(<TaskDetailPanel selectedTask={mockTask} />);
    expect(screen.getByText('电芯来料异常处理')).toBeInTheDocument();
  });

  it('displays business type label', () => {
    renderWithAntd(<TaskDetailPanel selectedTask={mockTask} />);
    expect(screen.getByText('业务类型')).toBeInTheDocument();
  });

  it('displays action buttons', () => {
    renderWithAntd(<TaskDetailPanel selectedTask={mockTask} />);
    expect(screen.getAllByText('选择流程').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('流程记录').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('设置参与人')).toBeInTheDocument();
    expect(screen.getByText('标记重要')).toBeInTheDocument();
    expect(screen.getByText('完成任务')).toBeInTheDocument();
  });

  it('displays flow template section', () => {
    renderWithAntd(<TaskDetailPanel selectedTask={mockTask} />);
    expect(screen.getByText('流程选择')).toBeInTheDocument();
    expect(screen.getByText('请选择流程模板')).toBeInTheDocument();
  });

  it('displays process records when task is selected', () => {
    renderWithAntd(<TaskDetailPanel selectedTask={mockTask} />);
    expect(screen.getAllByText('流程记录').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('邓智豪 创建了任务')).toBeInTheDocument();
  });

  it('displays participants when task is selected', () => {
    renderWithAntd(<TaskDetailPanel selectedTask={mockTask} />);
    expect(screen.getByText('参与人设置')).toBeInTheDocument();
    expect(screen.getByText('邓智豪')).toBeInTheDocument();
    expect(screen.getByText('负责人')).toBeInTheDocument();
  });

  it('displays empty state when no task selected', () => {
    renderWithAntd(<TaskDetailPanel />);
    expect(screen.getByText('暂无流程记录')).toBeInTheDocument();
    expect(screen.getByText('暂无参与人')).toBeInTheDocument();
  });

  it('displays navigation buttons', () => {
    renderWithAntd(<TaskDetailPanel />);
    expect(screen.getByTestId('detail-navigation')).toBeInTheDocument();
    const navContainer = screen.getByTestId('detail-navigation');
    expect(navContainer).toHaveTextContent(/上一步/);
    expect(navContainer).toHaveTextContent(/下一步/);
    expect(navContainer).toHaveTextContent(/全.*部/);
  });
});
