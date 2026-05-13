import api from './api';

export interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  currentTask?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email?: string;
  address?: string;
  status: string;
}

export interface BorrowRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  borrowerId: string;
  borrowerName: string;
  borrowDate: string;
  returnDate?: string;
  status: string;
  purpose?: string;
}

// ── Resources ──────────────────────────────────────────────────────

export async function getResources(params?: { type?: string; status?: string }) {
  return api.get('/resources', { params });
}

export async function getResource(id: string) {
  return api.get(`/resources/${id}`);
}

export async function createResource(data: Partial<Resource>) {
  return api.post('/resources', data);
}

export async function updateResource(id: string, data: Partial<Resource>) {
  return api.patch(`/resources/${id}`, data);
}

export async function deleteResource(id: string) {
  return api.delete(`/resources/${id}`);
}

// ── Equipment ──────────────────────────────────────────────────────

export async function getEquipment(params?: { status?: string; location?: string }) {
  return api.get('/resources/equipment', { params });
}

export async function getEquipmentDetail(id: string) {
  return api.get(`/resources/equipment/${id}`);
}

export async function createEquipment(data: Record<string, any>) {
  return api.post('/resources/equipment', data);
}

export async function updateEquipment(id: string, data: Record<string, any>) {
  return api.patch(`/resources/equipment/${id}`, data);
}

export async function deleteEquipment(id: string) {
  return api.delete(`/resources/equipment/${id}`);
}

// ── Suppliers ──────────────────────────────────────────────────────

export async function getSuppliers(params?: { keyword?: string; status?: string }) {
  return api.get('/resources/suppliers', { params });
}

export async function getSupplier(id: string) {
  return api.get(`/resources/suppliers/${id}`);
}

export async function createSupplier(data: Record<string, any>) {
  return api.post('/resources/suppliers', data);
}

export async function updateSupplier(id: string, data: Record<string, any>) {
  return api.patch(`/resources/suppliers/${id}`, data);
}

export async function deleteSupplier(id: string) {
  return api.delete(`/resources/suppliers/${id}`);
}

// ── Borrowing ──────────────────────────────────────────────────────

export async function getBorrowRecords(params?: { resourceId?: string; status?: string }) {
  return api.get('/resources/borrows', { params });
}

export async function createBorrowRecord(data: Record<string, any>) {
  return api.post('/resources/borrows', data);
}

export async function returnBorrow(id: string) {
  return api.put(`/resources/borrows/${id}/return`);
}
