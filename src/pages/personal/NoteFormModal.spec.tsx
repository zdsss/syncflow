import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteFormModal from './NoteFormModal';

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

const mockCreateNote = vi.fn();
const mockUpdateNote = vi.fn();

vi.mock('@/services/personal.service', () => ({
  createNote: (...args: any[]) => mockCreateNote(...args),
  updateNote: (...args: any[]) => mockUpdateNote(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

// Ant Design 5 Modal buttons render text with spaces: "创 建", "保 存", "取 消"
const findOkButton = (dialog: HTMLElement) => {
  const buttons = within(dialog).getAllByRole('button');
  return buttons.find((btn) =>
    /创\s*建|保\s*存|OK|确/.test(btn.textContent || '')
  )!;
};

const findCancelButton = (dialog: HTMLElement) => {
  const buttons = within(dialog).getAllByRole('button');
  return buttons.find((btn) =>
    /取\s*消|Cancel/.test(btn.textContent || '')
  )!;
};

describe('NoteFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateNote.mockResolvedValue({ code: 0, data: { id: 'n1' } });
    mockUpdateNote.mockResolvedValue({ code: 0, data: { id: 'n1' } });
  });

  it('renders modal with title for create mode', () => {
    renderWithAntd(<NoteFormModal {...defaultProps} />);
    expect(screen.getByText('新建笔记')).toBeInTheDocument();
  });

  it('renders modal with title for edit mode', () => {
    const note = { id: 'n1', title: 'Test', content: 'Content', category: '工作' };
    renderWithAntd(<NoteFormModal {...defaultProps} note={note} />);
    expect(screen.getByText('编辑笔记')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    renderWithAntd(<NoteFormModal {...defaultProps} />);
    expect(screen.getByLabelText('标题')).toBeInTheDocument();
    expect(screen.getByLabelText('分类')).toBeInTheDocument();
    expect(screen.getByLabelText('内容')).toBeInTheDocument();
  });

  it('populates fields in edit mode', () => {
    const note = { id: 'n1', title: 'Test Title', content: 'Test Content', category: '工作' };
    renderWithAntd(<NoteFormModal {...defaultProps} note={note} />);
    expect(screen.getByLabelText('标题')).toHaveValue('Test Title');
    expect(screen.getByLabelText('内容')).toHaveValue('Test Content');
  });

  it('calls createNote on submit in create mode', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderWithAntd(<NoteFormModal {...defaultProps} onSuccess={onSuccess} userId="user-1" />);

    await user.type(screen.getByLabelText('标题'), 'New Note');
    await user.type(screen.getByLabelText('内容'), 'New content here');

    const dialog = screen.getByRole('dialog');
    await user.click(findOkButton(dialog));

    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith({
        userId: 'user-1',
        title: 'New Note',
        content: 'New content here',
        category: undefined,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls updateNote on submit in edit mode', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const note = { id: 'n1', title: 'Old Title', content: 'Old Content', category: '工作' };
    renderWithAntd(<NoteFormModal {...defaultProps} note={note} onSuccess={onSuccess} />);

    const titleInput = screen.getByLabelText('标题');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    const dialog = screen.getByRole('dialog');
    await user.click(findOkButton(dialog));

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('n1', {
        title: 'Updated Title',
        content: 'Old Content',
        category: '工作',
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows success message after creating', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NoteFormModal {...defaultProps} userId="user-1" />);

    await user.type(screen.getByLabelText('标题'), 'New Note');
    await user.type(screen.getByLabelText('内容'), 'Content here');

    const dialog = screen.getByRole('dialog');
    await user.click(findOkButton(dialog));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('笔记创建成功');
    });
  });

  it('shows success message after updating', async () => {
    const user = userEvent.setup();
    const note = { id: 'n1', title: 'Title', content: 'Content', category: '工作' };
    renderWithAntd(<NoteFormModal {...defaultProps} note={note} />);

    const dialog = screen.getByRole('dialog');
    await user.click(findOkButton(dialog));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('笔记更新成功');
    });
  });

  it('shows error message when create fails', async () => {
    const user = userEvent.setup();
    mockCreateNote.mockRejectedValueOnce(new Error('Create failed'));
    renderWithAntd(<NoteFormModal {...defaultProps} userId="user-1" />);

    await user.type(screen.getByLabelText('标题'), 'New Note');
    await user.type(screen.getByLabelText('内容'), 'Content here');

    const dialog = screen.getByRole('dialog');
    await user.click(findOkButton(dialog));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('操作失败');
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithAntd(<NoteFormModal {...defaultProps} userId="user-1" />);

    const dialog = screen.getByRole('dialog');
    await user.click(findOkButton(dialog));

    await waitFor(() => {
      expect(screen.getByText('请输入标题')).toBeInTheDocument();
      expect(screen.getByText('请输入内容')).toBeInTheDocument();
    });

    expect(mockCreateNote).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithAntd(<NoteFormModal {...defaultProps} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    await user.click(findCancelButton(dialog));

    expect(onClose).toHaveBeenCalled();
  });
});
