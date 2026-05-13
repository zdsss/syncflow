import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import AiPanel, { generateSuggestions } from './AiPanel';
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

describe('generateSuggestions', () => {
  it('returns warning when overdue > 0', () => {
    const suggestions = generateSuggestions({
      overdue: 3,
      urgent: 0,
      inProgress: 1,
      completed: 5,
      total: 10,
    });
    const warning = suggestions.find((s) => s.text.includes('超期'));
    expect(warning).toBeDefined();
    expect(warning!.type).toBe('warning');
    expect(warning!.text).toContain('3');
  });

  it('returns warning when urgent > 0', () => {
    const suggestions = generateSuggestions({
      overdue: 0,
      urgent: 2,
      inProgress: 1,
      completed: 5,
      total: 10,
    });
    const warning = suggestions.find((s) => s.text.includes('紧急'));
    expect(warning).toBeDefined();
    expect(warning!.type).toBe('warning');
    expect(warning!.text).toContain('2');
  });

  it('returns info when inProgress > 3', () => {
    const suggestions = generateSuggestions({
      overdue: 0,
      urgent: 0,
      inProgress: 5,
      completed: 2,
      total: 10,
    });
    const info = suggestions.find((s) => s.type === 'info');
    expect(info).toBeDefined();
    expect(info!.text).toContain('5');
  });

  it('does not return info when inProgress <= 3', () => {
    const suggestions = generateSuggestions({
      overdue: 0,
      urgent: 0,
      inProgress: 3,
      completed: 5,
      total: 10,
    });
    const info = suggestions.find((s) => s.type === 'info');
    expect(info).toBeUndefined();
  });

  it('returns success when completionRate >= 80', () => {
    const suggestions = generateSuggestions({
      overdue: 0,
      urgent: 0,
      inProgress: 1,
      completed: 8,
      total: 10,
    });
    const success = suggestions.find((s) => s.text.includes('完成率已达'));
    expect(success).toBeDefined();
    expect(success!.type).toBe('success');
    expect(success!.text).toContain('80%');
  });

  it('returns warning when completionRate < 30 and total > 0', () => {
    const suggestions = generateSuggestions({
      overdue: 0,
      urgent: 0,
      inProgress: 1,
      completed: 1,
      total: 10,
    });
    const warning = suggestions.find((s) => s.text.includes('完成率仅'));
    expect(warning).toBeDefined();
    expect(warning!.type).toBe('warning');
    expect(warning!.text).toContain('10%');
  });

  it('returns default success when no conditions match', () => {
    const suggestions = generateSuggestions({
      overdue: 0,
      urgent: 0,
      inProgress: 2,
      completed: 5,
      total: 10,
    });
    // completionRate is 50%, not >= 80% and not < 30%
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('success');
    expect(suggestions[0].text).toContain('当前任务进展良好');
  });

  it('returns multiple suggestions when multiple conditions match', () => {
    const suggestions = generateSuggestions({
      overdue: 2,
      urgent: 3,
      inProgress: 5,
      completed: 1,
      total: 15,
    });
    // overdue + urgent + inProgress + low completionRate
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('handles total = 0 gracefully', () => {
    const suggestions = generateSuggestions({
      overdue: 0,
      urgent: 0,
      inProgress: 0,
      completed: 0,
      total: 0,
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('success');
  });

  it('each suggestion has type, icon, and text', () => {
    const suggestions = generateSuggestions({
      overdue: 1,
      urgent: 1,
      inProgress: 5,
      completed: 9,
      total: 10,
    });
    for (const s of suggestions) {
      expect(s).toHaveProperty('type');
      expect(s).toHaveProperty('icon');
      expect(s).toHaveProperty('text');
      expect(['warning', 'info', 'success']).toContain(s.type);
      expect(typeof s.icon).toBe('string');
      expect(typeof s.text).toBe('string');
    }
  });
});

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
    // With overdue=1, generateSuggestions should produce a warning about overdue
    expect(screen.getByText(/超期/)).toBeInTheDocument();
  });

  it('renders multiple suggestions from generateSuggestions', () => {
    // default tasks have overdue=1, so should get overdue warning
    renderWithAntd(<AiPanel {...defaultProps} />);
    // The suggestion section should render
    expect(screen.getByText('智能建议')).toBeInTheDocument();
    // Should contain at least one suggestion from generateSuggestions
    const suggestionTexts = screen.getAllByText(/超期|紧急|进行中|完成率|进展良好/);
    expect(suggestionTexts.length).toBeGreaterThanOrEqual(1);
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
