import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRequest = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  patch: vi.fn().mockResolvedValue({ data: {} }),
  delete: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock('../api', () => ({
  default: mockRequest,
  request: mockRequest,
}));

import { request } from '../api';
import {
  createBom,
  getBomById,
  getBomsByProject,
  getBomStructure,
  createBomItem,
  updateBomItem,
  deleteBomItem,
  submitForApproval,
  getBomVersions,
  saveBomVersion,
  getChangeRequests,
} from '../bom.service';

describe('BomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── BOM CRUD ──

  it('createBom calls POST /boms with data', async () => {
    const data = { name: 'BOM A', projectId: 1, productCode: 'PC-001', productName: 'Product A' };
    await createBom(data);
    expect(request.post).toHaveBeenCalledWith('/boms', data);
  });

  it('getBomById calls GET /boms/:id', async () => {
    await getBomById(42);
    expect(request.get).toHaveBeenCalledWith('/boms/42');
  });

  it('getBomsByProject calls GET /boms?projectId', async () => {
    await getBomsByProject(7);
    expect(request.get).toHaveBeenCalledWith('/boms', { params: { projectId: 7 } });
  });

  // ── BOM Structure ──

  it('getBomStructure calls GET /boms/:bomId/structure', async () => {
    await getBomStructure(5);
    expect(request.get).toHaveBeenCalledWith('/boms/5/structure');
  });

  it('createBomItem calls POST /boms/:bomId/items with data', async () => {
    const data = { materialName: '螺丝', quantity: 10 };
    await createBomItem(5, data);
    expect(request.post).toHaveBeenCalledWith('/boms/5/items', data);
  });

  it('updateBomItem calls PUT /boms/items/:itemId with data', async () => {
    const data = { quantity: 10 };
    await updateBomItem(7, data);
    expect(request.put).toHaveBeenCalledWith('/boms/items/7', data);
  });

  it('deleteBomItem calls DELETE /boms/items/:itemId', async () => {
    await deleteBomItem(7);
    expect(request.delete).toHaveBeenCalledWith('/boms/items/7');
  });

  // ── Approval ──

  it('submitForApproval calls POST /boms/:bomId/submit-approval', async () => {
    await submitForApproval(5);
    expect(request.post).toHaveBeenCalledWith('/boms/5/submit-approval');
  });

  // ── Versions ──

  it('getBomVersions calls GET /boms/:id/versions', async () => {
    await getBomVersions(5);
    expect(request.get).toHaveBeenCalledWith('/boms/5/versions');
  });

  it('saveBomVersion calls POST /boms/:id/save-version with changeSummary param', async () => {
    await saveBomVersion(5, '新增物料');
    expect(request.post).toHaveBeenCalledWith('/boms/5/save-version', null, { params: { changeSummary: '新增物料' } });
  });

  it('saveBomVersion works without changeSummary', async () => {
    await saveBomVersion(5);
    expect(request.post).toHaveBeenCalledWith('/boms/5/save-version', null, { params: { changeSummary: undefined } });
  });

  // ── Change Requests ──

  it('getChangeRequests calls GET /boms/:bomId/change-requests', async () => {
    await getChangeRequests(5);
    expect(request.get).toHaveBeenCalledWith('/boms/5/change-requests');
  });
});
