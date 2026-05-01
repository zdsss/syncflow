import { render, screen } from '@testing-library/react';
import StorageStatsBar from './StorageStatsBar';

const mockSetStorageStats = vi.fn();

vi.mock('@/stores/useFileStore', () => ({
  useFileStore: () => ({
    storageStats: {
      totalFiles: 42,
      usedSpace: 5 * 1024 * 1024 * 1024, // 5 GB
      totalSpace: 20 * 1024 * 1024 * 1024, // 20 GB
    },
    setStorageStats: mockSetStorageStats,
  }),
}));

describe('StorageStatsBar', () => {
  it('renders file count', () => {
    render(<StorageStatsBar />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/个文件/)).toBeInTheDocument();
  });

  it('renders storage usage text', () => {
    render(<StorageStatsBar />);
    expect(screen.getByText(/5\.0GB/)).toBeInTheDocument();
    expect(screen.getByText(/20\.0GB/)).toBeInTheDocument();
    expect(screen.getByText(/可用/)).toBeInTheDocument();
  });

  it('renders progress bar with correct percentage', () => {
    render(<StorageStatsBar />);
    // 5/20 = 25%
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });
});
