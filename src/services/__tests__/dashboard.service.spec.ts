import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  getDashboard,
  getDashboardSummary,
  getWarnings,
  getRisks,
  getSuggestions,
} from '../dashboard.service';

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboard calls GET /dashboard', async () => {
    await getDashboard();
    expect(api.get).toHaveBeenCalledWith('/dashboard');
  });

  it('getDashboardSummary calls GET /dashboard/summary', async () => {
    await getDashboardSummary();
    expect(api.get).toHaveBeenCalledWith('/dashboard/summary');
  });

  it('getWarnings calls GET /dashboard/warnings', async () => {
    await getWarnings();
    expect(api.get).toHaveBeenCalledWith('/dashboard/warnings');
  });

  it('getRisks calls GET /dashboard/risks', async () => {
    await getRisks();
    expect(api.get).toHaveBeenCalledWith('/dashboard/risks');
  });

  it('getSuggestions calls GET /dashboard/suggestions', async () => {
    await getSuggestions();
    expect(api.get).toHaveBeenCalledWith('/dashboard/suggestions');
  });
});
