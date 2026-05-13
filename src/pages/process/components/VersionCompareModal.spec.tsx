import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VersionCompareModal from './VersionCompareModal';

const mockVersions = [
  { id: 'v1', version: 1, description: 'Initial version', status: 'published', routeId: 'route-1', createdAt: '2026-01-01T00:00:00Z', steps: [{ id: 's1', name: 'Step 1', sortOrder: 1 }] },
  { id: 'v2', version: 2, description: 'Added new steps', status: 'published', routeId: 'route-1', createdAt: '2026-02-01T00:00:00Z', steps: [{ id: 's1', name: 'Step 1', sortOrder: 1 }, { id: 's2', name: 'Step 2', sortOrder: 2 }] },
  { id: 'v3', version: 3, description: 'Draft changes', status: 'draft', routeId: 'route-1', createdAt: '2026-03-01T00:00:00Z', steps: [{ id: 's1', name: 'Step 1', sortOrder: 1 }] },
];

const mockGetProcessVersions = vi.fn();

vi.mock('@/services/process.service', () => ({
  getProcessVersions: (...args: any[]) => mockGetProcessVersions(...args),
}));

const renderWithAntd = (ui: React.ReactElement) =>
  render(<ConfigProvider>{ui}</ConfigProvider>);

describe('VersionCompareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProcessVersions.mockResolvedValue({ data: mockVersions });
  });

  it('renders when visible', () => {
    renderWithAntd(
      <VersionCompareModal routeId="route-1" visible={true} onClose={() => {}} />
    );
    expect(screen.getByText('版本对比')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    renderWithAntd(
      <VersionCompareModal routeId="route-1" visible={false} onClose={() => {}} />
    );
    expect(screen.queryByText('版本对比')).not.toBeInTheDocument();
  });

  it('fetches versions on open', async () => {
    renderWithAntd(
      <VersionCompareModal routeId="route-1" visible={true} onClose={() => {}} />
    );
    await waitFor(() => {
      expect(mockGetProcessVersions).toHaveBeenCalledWith('route-1');
    });
  });

  it('shows two version selectors', async () => {
    renderWithAntd(
      <VersionCompareModal routeId="route-1" visible={true} onClose={() => {}} />
    );
    await waitFor(() => {
      expect(screen.getByText('基准版本')).toBeInTheDocument();
      expect(screen.getByText('对比版本')).toBeInTheDocument();
    });
  });

  it('shows empty state when no versions selected', async () => {
    renderWithAntd(
      <VersionCompareModal routeId="route-1" visible={true} onClose={() => {}} />
    );
    await waitFor(() => {
      expect(screen.getByText('请选择两个版本进行对比')).toBeInTheDocument();
    });
  });

  it('shows version options after loading', async () => {
    renderWithAntd(
      <VersionCompareModal routeId="route-1" visible={true} onClose={() => {}} />
    );
    await waitFor(() => {
      expect(mockGetProcessVersions).toHaveBeenCalled();
    });
    // Select elements should be present
    const selects = document.querySelectorAll('.ant-select');
    expect(selects.length).toBe(2);
  });
});
