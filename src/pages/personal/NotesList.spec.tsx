import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotesList from './NotesList';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    },
  };
});

const mockNotes = [
  {
    id: 'n1',
    title: '工作计划',
    content: '本周需要完成的任务包括前端开发和后端联调，需要安排好时间',
    category: '工作',
    userId: 'user-1',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    id: 'n2',
    title: '学习笔记',
    content: 'TypeScript高级类型技巧学习记录',
    category: '学习',
    userId: 'user-1',
    createdAt: '2026-04-19T08:00:00Z',
    updatedAt: '2026-04-19T08:00:00Z',
  },
  {
    id: 'n3',
    title: '会议纪要',
    content: '项目进度讨论会议纪要',
    category: '工作',
    userId: 'user-1',
    createdAt: '2026-04-18T14:00:00Z',
    updatedAt: '2026-04-18T14:00:00Z',
  },
];

const mockGetNotes = vi.fn();
const mockDeleteNote = vi.fn();

vi.mock('@/services/personal.service', () => ({
  getNotes: (...args: any[]) => mockGetNotes(...args),
  deleteNote: (...args: any[]) => mockDeleteNote(...args),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ currentUser: { id: 'user-1' } }),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('NotesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetNotes.mockResolvedValue({
      code: 0,
      data: { items: mockNotes, total: 3 },
    });
    mockDeleteNote.mockResolvedValue({ code: 0 });
  });

  it('renders notes list title', async () => {
    renderWithAntd(<NotesList />);
    expect(screen.getByText('我的笔记')).toBeInTheDocument();
  });

  it('renders new note button', async () => {
    renderWithAntd(<NotesList />);
    expect(screen.getByText('新建笔记')).toBeInTheDocument();
  });

  it('fetches notes on mount with userId', async () => {
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(mockGetNotes).toHaveBeenCalledWith('user-1', expect.objectContaining({ page: 1, pageSize: 9 }));
    });
  });

  it('renders note cards with title and content preview', async () => {
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(screen.getByText('工作计划')).toBeInTheDocument();
      expect(screen.getByText('学习笔记')).toBeInTheDocument();
      expect(screen.getByText('会议纪要')).toBeInTheDocument();
    });
  });

  it('shows category tags on cards', async () => {
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      // Tags are rendered inside .ant-tag elements
      const tags = document.querySelectorAll('.ant-tag');
      const tagTexts = Array.from(tags).map((t) => t.textContent);
      expect(tagTexts).toContain('工作');
      expect(tagTexts).toContain('学习');
    });
  });

  it('shows category filter tabs', async () => {
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
    });
    await waitFor(() => {
      const tabs = screen.getAllByRole('tab');
      const tabTexts = tabs.map((t) => t.textContent);
      expect(tabTexts).toContain('全部');
      expect(tabTexts).toContain('工作');
      expect(tabTexts).toContain('学习');
    });
  });

  it('filters notes by category tab', async () => {
    const user = userEvent.setup();
    mockGetNotes
      .mockResolvedValueOnce({ code: 0, data: { items: mockNotes, total: 3 } })
      .mockResolvedValueOnce({ code: 0, data: { items: mockNotes.filter(n => n.category === '学习'), total: 1 } });

    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(screen.getByText('工作计划')).toBeInTheDocument();
    });

    const tabs = screen.getAllByRole('tab');
    const studyTab = tabs.find((t) => t.textContent === '学习');
    if (studyTab) await user.click(studyTab);

    await waitFor(() => {
      expect(mockGetNotes).toHaveBeenLastCalledWith('user-1', expect.objectContaining({ category: '学习' }));
    });
  });

  it('calls deleteNote and shows success message', async () => {
    const user = userEvent.setup();
    mockGetNotes
      .mockResolvedValueOnce({ code: 0, data: { items: mockNotes, total: 3 } })
      .mockResolvedValueOnce({ code: 0, data: { items: mockNotes.slice(1), total: 2 } });

    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(screen.getByText('工作计划')).toBeInTheDocument();
    });

    // Find delete buttons by their danger type
    const deleteButtons = screen.getAllByText(/删\s*除/);
    await user.click(deleteButtons[0]);

    // Wait for Popconfirm to appear and click confirm button
    await waitFor(() => {
      expect(screen.getByText('确定删除这条笔记？')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByRole('button', { name: /确\s*定/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith('n1');
      expect(message.success).toHaveBeenCalledWith('笔记已删除');
    });
  });

  it('shows error message when delete fails', async () => {
    const user = userEvent.setup();
    mockDeleteNote.mockRejectedValueOnce(new Error('Delete failed'));

    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(screen.getByText('工作计划')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/删\s*除/);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('确定删除这条笔记？')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByRole('button', { name: /确\s*定/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('删除失败');
    });
  });

  it('shows empty state when no notes', async () => {
    mockGetNotes.mockResolvedValue({ code: 0, data: { items: [], total: 0 } });
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(screen.getByText('暂无笔记')).toBeInTheDocument();
    });
  });

  it('shows content preview truncated on cards', async () => {
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(screen.getByText(/本周需要完成的任务/)).toBeInTheDocument();
    });
  });

  it('opens NoteFormModal when clicking new note button', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NotesList />);
    const newBtn = screen.getByText('新建笔记');
    await user.click(newBtn);
    await waitFor(() => {
      const modalTitle = document.querySelector('.ant-modal-title');
      expect(modalTitle?.textContent).toContain('新建笔记');
    });
  });

  it('shows edit button on cards', async () => {
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      const editButtons = screen.getAllByText(/编\s*辑/);
      expect(editButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows pagination when total exceeds page size', async () => {
    mockGetNotes.mockResolvedValue({ code: 0, data: { items: mockNotes, total: 30 } });
    renderWithAntd(<NotesList />);
    await waitFor(() => {
      expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
    });
  });
});
