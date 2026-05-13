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
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getEquipment,
  getEquipmentDetail,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getBorrowRecords,
  createBorrowRecord,
  returnBorrow,
} from '../resource.service';

describe('ResourceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Resources ────────────────────────────────────────────────
  it('getResources calls GET /resources with params', async () => {
    const params = { type: 'server', status: 'active' };
    await getResources(params);
    expect(api.get).toHaveBeenCalledWith('/resources', { params });
  });

  it('getResources calls GET /resources without params', async () => {
    await getResources();
    expect(api.get).toHaveBeenCalledWith('/resources', { params: undefined });
  });

  it('getResource calls GET /resources/:id', async () => {
    await getResource('res-1');
    expect(api.get).toHaveBeenCalledWith('/resources/res-1');
  });

  it('createResource calls POST /resources with data', async () => {
    const data = { name: 'Server A', type: 'server' };
    await createResource(data);
    expect(api.post).toHaveBeenCalledWith('/resources', data);
  });

  it('updateResource calls PATCH /resources/:id with data', async () => {
    const data = { status: 'inactive' };
    await updateResource('res-1', data);
    expect(api.patch).toHaveBeenCalledWith('/resources/res-1', data);
  });

  it('deleteResource calls DELETE /resources/:id', async () => {
    await deleteResource('res-1');
    expect(api.delete).toHaveBeenCalledWith('/resources/res-1');
  });

  // ── Equipment ────────────────────────────────────────────────
  it('getEquipment calls GET /resources/equipment', async () => {
    await getEquipment({ status: 'active' });
    expect(api.get).toHaveBeenCalledWith('/resources/equipment', { params: { status: 'active' } });
  });

  it('getEquipmentDetail calls GET /resources/equipment/:id', async () => {
    await getEquipmentDetail('eq-1');
    expect(api.get).toHaveBeenCalledWith('/resources/equipment/eq-1');
  });

  it('createEquipment calls POST /resources/equipment', async () => {
    await createEquipment({ name: 'Printer' });
    expect(api.post).toHaveBeenCalledWith('/resources/equipment', { name: 'Printer' });
  });

  it('updateEquipment calls PATCH /resources/equipment/:id', async () => {
    await updateEquipment('eq-1', { status: 'maintenance' });
    expect(api.patch).toHaveBeenCalledWith('/resources/equipment/eq-1', { status: 'maintenance' });
  });

  it('deleteEquipment calls DELETE /resources/equipment/:id', async () => {
    await deleteEquipment('eq-1');
    expect(api.delete).toHaveBeenCalledWith('/resources/equipment/eq-1');
  });

  // ── Suppliers ────────────────────────────────────────────────
  it('getSuppliers calls GET /resources/suppliers', async () => {
    await getSuppliers({ keyword: 'test' });
    expect(api.get).toHaveBeenCalledWith('/resources/suppliers', { params: { keyword: 'test' } });
  });

  it('getSupplier calls GET /resources/suppliers/:id', async () => {
    await getSupplier('sup-1');
    expect(api.get).toHaveBeenCalledWith('/resources/suppliers/sup-1');
  });

  it('createSupplier calls POST /resources/suppliers', async () => {
    await createSupplier({ name: 'Supplier A' });
    expect(api.post).toHaveBeenCalledWith('/resources/suppliers', { name: 'Supplier A' });
  });

  it('updateSupplier calls PATCH /resources/suppliers/:id', async () => {
    await updateSupplier('sup-1', { status: 'inactive' });
    expect(api.patch).toHaveBeenCalledWith('/resources/suppliers/sup-1', { status: 'inactive' });
  });

  it('deleteSupplier calls DELETE /resources/suppliers/:id', async () => {
    await deleteSupplier('sup-1');
    expect(api.delete).toHaveBeenCalledWith('/resources/suppliers/sup-1');
  });

  // ── Borrowing ────────────────────────────────────────────────
  it('getBorrowRecords calls GET /resources/borrows', async () => {
    await getBorrowRecords({ status: 'borrowed' });
    expect(api.get).toHaveBeenCalledWith('/resources/borrows', { params: { status: 'borrowed' } });
  });

  it('createBorrowRecord calls POST /resources/borrows', async () => {
    await createBorrowRecord({ resourceId: 'eq-1', borrowerId: 'u1' });
    expect(api.post).toHaveBeenCalledWith('/resources/borrows', { resourceId: 'eq-1', borrowerId: 'u1' });
  });

  it('returnBorrow calls PUT /resources/borrows/:id/return', async () => {
    await returnBorrow('br-1');
    expect(api.put).toHaveBeenCalledWith('/resources/borrows/br-1/return');
  });
});
