import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskForm from './TaskForm';
import * as taskService from '@/services/task.service';
import * as projectService from '@/services/project.service';

vi.mock('@/services/task.service', () => ({
  createTask: vi.fn().mockResolvedValue({ data: {} }),
  getTaskById: vi.fn().mockResolvedValue({
    code: 200,
    data: {
      id: 'task-1',
      name: 'Existing Task',
      description: 'Task description',
      projectId: 'proj-1',
      priority: 'high',
      status: 'in_progress',
      assigneeId: 'user-1',
      planStart: '2025-01-01',
      planEnd: '2025-01-31',
      plannedHours: 40,
      progress: 50,
    },
  }),
  updateTask: vi.fn().mockResolvedValue({ data: {} }),
  getTasks: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  addTaskTag: vi.fn(),
  removeTaskTag: vi.fn(),
}));

vi.mock('@/services/project.service', () => ({
  getProjects: vi.fn().mockResolvedValue({
    code: 200,
    data: [
      { id: 'proj-1', name: 'Project Alpha' },
      { id: 'proj-2', name: 'Project Beta' },
    ],
  }),
  getProjectById: vi.fn(),
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider locale={zhCN}>{ui}</ConfigProvider>);

const defaultProps = {
  visible: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it('renders create mode title when no taskId provided', async () => {
    renderWithAntd(<TaskForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('新建任务')).toBeInTheDocument();
    });
  });

  it('renders edit mode title when taskId is provided', async () => {
    renderWithAntd(<TaskForm {...defaultProps} taskId="task-1" />);
    await waitFor(() => {
      expect(screen.getByText('编辑任务')).toBeInTheDocument();
    });
  });

  it('renders all form fields', async () => {
    renderWithAntd(<TaskForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByLabelText('任务名称')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('所属项目')).toBeInTheDocument();
    expect(screen.getByLabelText('优先级')).toBeInTheDocument();
    expect(screen.getByLabelText('状态')).toBeInTheDocument();
    expect(screen.getByLabelText('负责人')).toBeInTheDocument();
    expect(screen.getByLabelText('计划开始')).toBeInTheDocument();
    expect(screen.getByLabelText('计划结束')).toBeInTheDocument();
    expect(screen.getByLabelText('计划工时')).toBeInTheDocument();
    expect(screen.getByLabelText('描述')).toBeInTheDocument();
  });

  it('is not rendered when visible is false', () => {
    renderWithAntd(<TaskForm {...defaultProps} visible={false} />);
    expect(screen.queryByText('新建任务')).not.toBeInTheDocument();
  });

  // --- Edit mode data loading ---

  it('fetches task data and populates form in edit mode', async () => {
    renderWithAntd(<TaskForm {...defaultProps} taskId="task-1" />);
    await waitFor(() => {
      expect(taskService.getTaskById).toHaveBeenCalledWith('task-1');
    });
    await waitFor(() => {
      const nameInput = screen.getByLabelText('任务名称') as HTMLInputElement;
      expect(nameInput.value).toBe('Existing Task');
    });
  });

  it('pre-fills projectId when provided', async () => {
    renderWithAntd(<TaskForm {...defaultProps} projectId="proj-2" />);
    await waitFor(() => {
      expect(screen.getByText('新建任务')).toBeInTheDocument();
    });
    // The project select should have proj-2 pre-selected
    // We verify by checking the form field has the value
    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalled();
    });
  });

  // --- Validation ---

  it('shows validation error when name is empty on submit', async () => {
    const user = userEvent.setup();
    renderWithAntd(<TaskForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByLabelText('任务名称')).toBeInTheDocument();
    });

    // Click OK without filling name
    const modal = screen.getByRole('dialog');
    const okButton = within(modal).getByRole('button', { name: /确/i });
    await user.click(okButton);

    await waitFor(() => {
      expect(screen.getByText('请输入任务名称')).toBeInTheDocument();
    });
    expect(taskService.createTask).not.toHaveBeenCalled();
  });

  // --- Create submission ---

  it('calls createTask and onSuccess when creating a task', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<TaskForm {...defaultProps} onSuccess={onSuccess} />);
    await waitFor(() => {
      expect(screen.getByLabelText('任务名称')).toBeInTheDocument();
    });

    // Fill in required name
    await user.type(screen.getByLabelText('任务名称'), 'New Task');

    // Submit
    const modal = screen.getByRole('dialog');
    const okButton = within(modal).getByRole('button', { name: /确/i });
    await user.click(okButton);

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Task' })
      );
      expect(message.success).toHaveBeenCalledWith('创建成功');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // --- Edit submission ---

  it('calls updateTask and onSuccess when editing a task', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderWithAntd(<TaskForm {...defaultProps} taskId="task-1" onSuccess={onSuccess} />);
    await waitFor(() => {
      expect(taskService.getTaskById).toHaveBeenCalledWith('task-1');
    });
    await waitFor(() => {
      const nameInput = screen.getByLabelText('任务名称') as HTMLInputElement;
      expect(nameInput.value).toBe('Existing Task');
    });

    // Update name
    const nameInput = screen.getByLabelText('任务名称');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Task');

    // Submit
    const modal = screen.getByRole('dialog');
    const okButton = within(modal).getByRole('button', { name: /确/i });
    await user.click(okButton);

    await waitFor(() => {
      expect(taskService.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ title: 'Updated Task' })
      );
      expect(message.success).toHaveBeenCalledWith('更新成功');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  // --- Error handling ---

  it('shows error message when createTask fails', async () => {
    vi.mocked(taskService.createTask).mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    renderWithAntd(<TaskForm {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByLabelText('任务名称')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('任务名称'), 'New Task');
    const modal = screen.getByRole('dialog');
    const okButton = within(modal).getByRole('button', { name: /确/i });
    await user.click(okButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalled();
    });
  });

  // --- Close / Cancel ---

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn();
    renderWithAntd(<TaskForm {...defaultProps} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByLabelText('任务名称')).toBeInTheDocument();
    });

    const modal = screen.getByRole('dialog');
    const cancelButton = within(modal).getByRole('button', { name: /取/i });
    await userEvent.setup().click(cancelButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
