import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskDetailPanel from './TaskDetailPanel';
import type { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types';

vi.mock('./TaskDetailPanel.module.css', () => ({
  default: {
    container: 'container',
    placeholder: 'placeholder',
    content: 'content',
    header: 'header',
    taskName: 'taskName',
    taskNameInput: 'taskNameInput',
    statusBadge: 'statusBadge',
    infoSection: 'infoSection',
    infoGrid: 'infoGrid',
    infoItem: 'infoItem',
    infoLabel: 'infoLabel',
    infoValue: 'infoValue',
    section: 'section',
    sectionTitle: 'sectionTitle',
    dateGrid: 'dateGrid',
    dateItem: 'dateItem',
    dateLabel: 'dateLabel',
    dateValue: 'dateValue',
    progressSection: 'progressSection',
    attachmentsSection: 'attachmentsSection',
    attachmentCount: 'attachmentCount',
    attachmentsList: 'attachmentsList',
    attachmentItem: 'attachmentItem',
    attachmentIcon: 'attachmentIcon',
    attachmentInfo: 'attachmentInfo',
    attachmentName: 'attachmentName',
    attachmentMeta: 'attachmentMeta',
    uploadBtn: 'uploadBtn',
    commentsSection: 'commentsSection',
    commentsList: 'commentsList',
    commentItem: 'commentItem',
    commentAuthor: 'commentAuthor',
    commentTime: 'commentTime',
    commentContent: 'commentContent',
    commentInput: 'commentInput',
    roleGrid: 'roleGrid',
    roleItem: 'roleItem',
    roleLabel: 'roleLabel',
    actions: 'actions',
  },
}));

vi.mock('@/services/comment.service', () => ({
  getComments: vi.fn().mockResolvedValue({ data: [] }),
  createComment: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/services/file.service', () => ({
  getFiles: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<any>();
  return {
    ...antd,
    message: {
      ...antd.message,
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
    Modal: {
      ...antd.Modal,
      confirm: vi.fn(),
    },
  };
});

const mockTask: Task = {
  id: '1', code: 'T-001', name: '任务一', description: '描述', projectId: 'p1',
  priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, assigneeId: 'user1',
  participantIds: ['user2'], progress: 50, milestone: false, dependencies: [], tags: [],
  planStart: '2025-01-01', planEnd: '2025-06-01', createdAt: '2025-01-01', updatedAt: '2025-01-01',
  plannedHours: 20, loggedHours: 8, type: '设计类',
};

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('TaskDetailPanel (project)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders placeholder when no task is selected', () => {
    renderWithAntd(<TaskDetailPanel task={null} />);
    expect(screen.getByText('请选择任务')).toBeInTheDocument();
  });

  it('renders task name when task is provided', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('任务一')).toBeInTheDocument();
  });

  it('displays task status', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getAllByText('进行中').length).toBeGreaterThanOrEqual(1);
  });

  it('displays task info fields', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('业务类型')).toBeInTheDocument();
    expect(screen.getByText('负责人')).toBeInTheDocument();
    expect(screen.getByText('优先级')).toBeInTheDocument();
  });

  it('displays date section', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('日期')).toBeInTheDocument();
    expect(screen.getByText('计划开始')).toBeInTheDocument();
    expect(screen.getByText('计划结束')).toBeInTheDocument();
  });

  it('displays progress section', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('进度')).toBeInTheDocument();
  });

  it('displays comments section', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('评论')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('添加评论...')).toBeInTheDocument();
  });

  it('displays attachments section', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('附件记录')).toBeInTheDocument();
    expect(screen.getByText('上传附件')).toBeInTheDocument();
  });

  it('displays action buttons', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('状态变更')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
  });

  it('displays participants section', () => {
    renderWithAntd(<TaskDetailPanel task={mockTask} />);
    expect(screen.getAllByText('参与者').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('设计人员').length).toBeGreaterThanOrEqual(1);
  });
});
