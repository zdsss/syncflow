import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcessVersionPanel from './ProcessVersionPanel';

vi.mock('@/services/process.service', () => ({
  getProcessVersions: vi.fn().mockResolvedValue({ data: [] }),
  createProcessVersion: vi.fn().mockResolvedValue({ data: {} }),
  publishProcessVersion: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock('./VersionCompareModal', () => ({
  default: (props: any) => (
    props.visible ? (
      <div data-testid="version-compare-modal">
        <span data-testid="compare-route-id">{props.routeId}</span>
        <button data-testid="close-compare" onClick={props.onClose}>CloseCompare</button>
      </div>
    ) : null
  ),
}));

import { getProcessVersions, createProcessVersion, publishProcessVersion } from '@/services/process.service';

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('ProcessVersionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getProcessVersions as any).mockResolvedValue({ data: [] });
  });

  it('renders when visible', async () => {
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    expect(screen.getByText('版本管理')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={false} onClose={() => {}} />);
    expect(screen.queryByText('版本管理')).not.toBeInTheDocument();
  });

  it('fetches versions when visible', async () => {
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(getProcessVersions).toHaveBeenCalledWith('route-1');
    });
  });

  it('displays version list', async () => {
    (getProcessVersions as any).mockResolvedValue({
      data: [
        { id: 'v1', version: 1, description: 'Initial', status: 'draft', routeId: 'route-1', createdAt: '2026-01-01' },
        { id: 'v2', version: 2, description: 'Updated', status: 'published', routeId: 'route-1', createdAt: '2026-02-01' },
      ],
    });
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
      expect(screen.getByText('已发布')).toBeInTheDocument();
    });
  });

  it('shows create version button', async () => {
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    expect(screen.getByText('创建新版本')).toBeInTheDocument();
  });

  it('opens description modal on create click', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await user.click(screen.getByText('创建新版本'));
    expect(screen.getByPlaceholderText('版本说明（可选）')).toBeInTheDocument();
  });

  it('calls createProcessVersion on confirm', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await user.click(screen.getByText('创建新版本'));
    // Footer buttons are in a portal - use document.querySelector
    const okBtn = document.querySelector('.ant-modal-footer .ant-btn-primary') as HTMLButtonElement;
    expect(okBtn).toBeTruthy();
    await user.click(okBtn);
    await waitFor(() => {
      expect(createProcessVersion).toHaveBeenCalledWith('route-1', undefined);
    });
  });

  it('shows publish button for draft versions', async () => {
    (getProcessVersions as any).mockResolvedValue({
      data: [{ id: 'v1', version: 1, status: 'draft', routeId: 'route-1', createdAt: '2026-01-01' }],
    });
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('发布')).toBeInTheDocument();
    });
  });

  it('shows version compare button', async () => {
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    expect(screen.getByText('版本对比')).toBeInTheDocument();
  });

  it('opens version compare modal when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await user.click(screen.getByText('版本对比'));
    expect(screen.getByTestId('version-compare-modal')).toBeInTheDocument();
  });

  it('passes routeId to compare modal', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await user.click(screen.getByText('版本对比'));
    expect(screen.getByTestId('compare-route-id').textContent).toBe('route-1');
  });

  it('closes compare modal when close is triggered', async () => {
    const user = userEvent.setup();
    renderWithAntd(<ProcessVersionPanel routeId="route-1" visible={true} onClose={() => {}} />);
    await user.click(screen.getByText('版本对比'));
    expect(screen.getByTestId('version-compare-modal')).toBeInTheDocument();
    await user.click(screen.getByTestId('close-compare'));
    expect(screen.queryByTestId('version-compare-modal')).not.toBeInTheDocument();
  });
});
