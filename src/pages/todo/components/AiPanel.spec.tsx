import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import AiPanel from './AiPanel';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  name: 'Task',
  projectId: 'p1',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.NOT_STARTED,
  assigneeId: 'u1',
  participantIds: [],
  progress: 0,
  milestone: false,
  dependencies: [],
  tags: [],
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides,
});

const buildTasks = () => [
  makeTask({ id: '1', status: TaskStatus.NOT_STARTED }),
  makeTask({ id: '2', status: TaskStatus.IN_PROGRESS }),
  makeTask({ id: '3', status: TaskStatus.IN_PROGRESS }),
  makeTask({ id: '4', status: TaskStatus.COMPLETED }),
  makeTask({ id: '5', status: TaskStatus.COMPLETED }),
  makeTask({ id: '6', status: TaskStatus.COMPLETED }),
  makeTask({ id: '7', status: TaskStatus.OVERDUE }),
  makeTask({ id: '8', status: TaskStatus.PENDING_ASSIGN }),
];

const defaultProps = {
  tasks: buildTasks(),
  isWide: false,
  onToggleWidth: vi.fn(),
  onClose: vi.fn(),
  onMetricClick: vi.fn(),
};

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('AiPanel', () => {
  beforeEach(() => {
    defaultProps.onClose.mockClear();
    defaultProps.onToggleWidth.mockClear();
    defaultProps.onMetricClick.mockClear();
  });

  it('renders AI assistant header', () => {
    renderWithAntd(<AiPanel {...defaultProps} />);
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('AI 助手')).toBeInTheDocument();
  });

  it('computes correct metrics from tasks', () => {
    renderWithAntd(<AiPanel {...defaultProps} />);
    // total=8, completed=3, inProgress=2, notStarted=2 (NOT_STARTED + PENDING_ASSIGN), overdue=1
    expect(screen.getByText((text) => text.includes('Total Tasks'))).toBeInTheDocument();
    // completion rate = 3/8 = 37.5 -> 38% (Math.round)
    expect(screen.getByText((text) => text.includes('Completion Rate'))).toBeInTheDocument();
  });

  it('renders metric cards with correct values', () => {
    renderWithAntd(<AiPanel {...defaultProps} />);
    // 6 metric cards should render
    const metricCards = screen.getAllByText(/个$/);
    expect(metricCards.length).toBe(6);
    // notStarted=2, inProgress=2, completed=3, overdue=1, total-completed=5, urgent=0
    expect(screen.getByText('未开始')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('已延期')).toBeInTheDocument();
    expect(screen.getByText('紧急')).toBeInTheDocument();
  });

  it('renders suggestion text mentioning overdue when overdue > 0', () => {
    renderWithAntd(<AiPanel {...defaultProps} />);
    expect(screen.getByText(/建议优先处理/)).toBeInTheDocument();
    expect(screen.getByText(/1 个任务已延期/)).toBeInTheDocument();
  });

  it('calls onMetricClick when metric card clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<AiPanel {...defaultProps} />);

    const completedCard = screen.getByText('已完成').closest('[class*="metricCard"]')!;
    await user.click(completedCard);

    expect(defaultProps.onMetricClick).toHaveBeenCalledWith(TaskStatus.COMPLETED);
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<AiPanel {...defaultProps} />);

    const closeButton = screen.getByTitle('关闭');
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
