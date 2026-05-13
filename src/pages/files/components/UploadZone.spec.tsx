import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, message } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UploadZone from './UploadZone';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    message: {
      ...actual.message,
      success: vi.fn(),
    },
  };
});

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('UploadZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area when visible', () => {
    renderWithAntd(<UploadZone visible={true} onVisibleChange={vi.fn()} />);
    expect(screen.getByText('拖拽文件至此上传')).toBeInTheDocument();
  });

  it('returns null when not visible', () => {
    const { container } = renderWithAntd(<UploadZone visible={false} onVisibleChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows upload icon when visible', () => {
    const { container } = renderWithAntd(<UploadZone visible={true} onVisibleChange={vi.fn()} />);
    const icon = container.querySelector('.anticon-upload');
    expect(icon).toBeInTheDocument();
  });

  it('renders overlay with drag-and-drop handlers', () => {
    const { container } = renderWithAntd(<UploadZone visible={true} onVisibleChange={vi.fn()} />);
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeDefined();
    expect(overlay.tagName).toBe('DIV');
  });

  it('calls onVisibleChange(true) on drag enter', () => {
    const onVisibleChange = vi.fn();
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={onVisibleChange} />
    );
    const overlay = container.firstChild as HTMLElement;
    fireEvent.dragEnter(overlay);
    expect(onVisibleChange).toHaveBeenCalledWith(true);
  });

  it('calls onVisibleChange(false) on drag leave when counter reaches zero', () => {
    const onVisibleChange = vi.fn();
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={onVisibleChange} />
    );
    const overlay = container.firstChild as HTMLElement;
    // Enter once to set counter to 1
    fireEvent.dragEnter(overlay);
    onVisibleChange.mockClear();
    // Leave should decrement to 0 and call onVisibleChange(false)
    fireEvent.dragLeave(overlay);
    expect(onVisibleChange).toHaveBeenCalledWith(false);
  });

  it('does not call onVisibleChange(false) on drag leave when counter > 1', () => {
    const onVisibleChange = vi.fn();
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={onVisibleChange} />
    );
    const overlay = container.firstChild as HTMLElement;
    // Enter twice to set counter to 2
    fireEvent.dragEnter(overlay);
    fireEvent.dragEnter(overlay);
    onVisibleChange.mockClear();
    // Leave once should decrement to 1, NOT call onVisibleChange(false)
    fireEvent.dragLeave(overlay);
    expect(onVisibleChange).not.toHaveBeenCalledWith(false);
  });

  it('prevents default on drag over', () => {
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={vi.fn()} />
    );
    const overlay = container.firstChild as HTMLElement;
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    fireEvent(overlay, event);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('handles file drop and shows success message', () => {
    const onVisibleChange = vi.fn();
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={onVisibleChange} />
    );
    const overlay = container.firstChild as HTMLElement;

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file] },
    });

    fireEvent(overlay, dropEvent);
    expect(onVisibleChange).toHaveBeenCalledWith(false);
    expect(message.success).toHaveBeenCalledWith(expect.stringContaining('test.pdf'));
  });

  it('handles drop with multiple files', () => {
    const onVisibleChange = vi.fn();
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={onVisibleChange} />
    );
    const overlay = container.firstChild as HTMLElement;

    const file1 = new File(['a'], 'a.txt', { type: 'text/plain' });
    const file2 = new File(['b'], 'b.txt', { type: 'text/plain' });
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [file1, file2] },
    });

    fireEvent(overlay, dropEvent);
    expect(message.success).toHaveBeenCalledWith(expect.stringContaining('a.txt'));
    expect(message.success).toHaveBeenCalledWith(expect.stringContaining('b.txt'));
  });

  it('does not show message when drop has no files', () => {
    const onVisibleChange = vi.fn();
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={onVisibleChange} />
    );
    const overlay = container.firstChild as HTMLElement;

    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: { files: [] },
    });

    fireEvent(overlay, dropEvent);
    expect(message.success).not.toHaveBeenCalled();
  });

  it('increments drag counter on multiple nested drag enters', () => {
    const onVisibleChange = vi.fn();
    const { container } = renderWithAntd(
      <UploadZone visible={true} onVisibleChange={onVisibleChange} />
    );
    const overlay = container.firstChild as HTMLElement;
    fireEvent.dragEnter(overlay);
    fireEvent.dragEnter(overlay);
    fireEvent.dragEnter(overlay);
    // Now leave once - counter goes from 3 to 2, should not call false
    onVisibleChange.mockClear();
    fireEvent.dragLeave(overlay);
    expect(onVisibleChange).not.toHaveBeenCalledWith(false);
    // Leave again - counter goes from 2 to 1, still not false
    fireEvent.dragLeave(overlay);
    expect(onVisibleChange).not.toHaveBeenCalledWith(false);
    // Leave again - counter goes from 1 to 0, should call false
    fireEvent.dragLeave(overlay);
    expect(onVisibleChange).toHaveBeenCalledWith(false);
  });
});
