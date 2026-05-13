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
  getProcessRoutes,
  getProcessRoute,
  createProcessRoute,
} from '../process.service';

describe('ProcessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProcessRoutes calls GET /process-routes with params', async () => {
    await getProcessRoutes({ projectId: 1 });
    expect(api.get).toHaveBeenCalledWith('/process-routes', { params: { projectId: 1 } });
  });

  it('getProcessRoutes calls GET /process-routes with default empty params', async () => {
    await getProcessRoutes();
    expect(api.get).toHaveBeenCalledWith('/process-routes', { params: {} });
  });

  it('getProcessRoute calls GET /process-routes/:id', async () => {
    await getProcessRoute(5);
    expect(api.get).toHaveBeenCalledWith('/process-routes/5');
  });

  it('createProcessRoute calls POST /process-routes with data', async () => {
    const data = { name: 'Route A', bomId: 1, projectId: 2, productCode: 'PC-001', productName: 'Product A' };
    await createProcessRoute(data);
    expect(api.post).toHaveBeenCalledWith('/process-routes', data);
  });
});
