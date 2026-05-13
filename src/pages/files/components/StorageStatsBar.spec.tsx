import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StorageStatsBar from './StorageStatsBar';

const mockSetStorageStats = vi.fn();

let mockStorageStats = {
  totalFiles: 42,
  usedSpace: 5 * 1024 * 1024 * 1024, // 5 GB
  totalSpace: 20 * 1024 * 1024 * 1024, // 20 GB
};

vi.mock('@/stores/useFileStore', () => ({
  useFileStore: () => ({
    get storageStats() {
      return mockStorageStats;
    },
    setStorageStats: mockSetStorageStats,
  }),
}));

describe('StorageStatsBar', () => {
  beforeEach(() => {
    mockStorageStats = {
      totalFiles: 42,
      usedSpace: 5 * 1024 * 1024 * 1024,
      totalSpace: 20 * 1024 * 1024 * 1024,
    };
  });

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

  it('renders KB formatted sizes when values are in KB range', () => {
    mockStorageStats = {
      totalFiles: 5,
      usedSpace: 512 * 1024, // 512 KB
      totalSpace: 1024 * 1024, // 1 MB = 1024 KB
    };
    render(<StorageStatsBar />);
    expect(screen.getByText(/512\.0KB/)).toBeInTheDocument();
    expect(screen.getByText(/1\.0MB/)).toBeInTheDocument();
    expect(screen.getByText(/可用/)).toBeInTheDocument();
  });

  it('renders MB formatted sizes when values are in MB range', () => {
    mockStorageStats = {
      totalFiles: 10,
      usedSpace: 100 * 1024 * 1024, // 100 MB
      totalSpace: 500 * 1024 * 1024, // 500 MB
    };
    render(<StorageStatsBar />);
    expect(screen.getByText(/100\.0MB/)).toBeInTheDocument();
    expect(screen.getByText(/500\.0MB/)).toBeInTheDocument();
  });

  it('renders "0 B" for zero usedSpace', () => {
    mockStorageStats = {
      totalFiles: 0,
      usedSpace: 0,
      totalSpace: 10 * 1024 * 1024 * 1024, // 10 GB
    };
    render(<StorageStatsBar />);
    // formatBytes(0) returns '0 B' — appears in "共 0 个文件 | 0 B/10.0GB | 可用 10.0GB"
    expect(screen.getByText(/0 个文件/)).toBeInTheDocument();
    expect(screen.getByText(/0 B\/10\.0GB/)).toBeInTheDocument();
    expect(screen.getByText(/可用 10\.0GB/)).toBeInTheDocument();
  });

  it('shows 0% when totalSpace is 0', () => {
    mockStorageStats = {
      totalFiles: 0,
      usedSpace: 0,
      totalSpace: 0,
    };
    render(<StorageStatsBar />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('renders available space for KB-range values', () => {
    mockStorageStats = {
      totalFiles: 3,
      usedSpace: 200 * 1024, // 200 KB
      totalSpace: 500 * 1024, // 500 KB
    };
    render(<StorageStatsBar />);
    // availableSpace = 500KB - 200KB = 300KB = 307200 bytes
    expect(screen.getByText(/可用 300\.0KB/)).toBeInTheDocument();
    // percent = 200/500 = 40%
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });
});
