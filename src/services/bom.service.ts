import { request } from './api';

// ── BOM CRUD ────────────────────────────────────────────────────────

export interface BomVO {
  id: number;
  bomNo: string;
  name: string;
  projectId: number;
  productCode?: string;
  productName?: string;
  version?: string;
  status: number;
  totalItems?: number;
  isLatest?: boolean;
}

export interface BomItemVO {
  id: number;
  bomId: number;
  parentId?: number | null;
  name: string;
  materialCode?: string;
  specification?: string;
  drawingNo?: string;
  material?: string;
  surfaceTreatment?: string;
  sourceType?: string;
  quantity: number;
  weight?: number;
  totalWeight?: number;
  unitOfMeasure?: string;
  isVirtual?: boolean;
  storageLocation?: string;
  isOptional?: boolean;
  remark?: string;
  level?: number;
  levelNo?: string;
  seqNo?: number;
  children?: BomItemVO[];
}

export async function createBom(data: {
  name: string;
  projectId: number;
  productCode: string;
  productName: string;
}): Promise<{ code: number; data: BomVO }> {
  return request.post('/boms', data);
}

export async function getBomById(id: number | string): Promise<{ code: number; data: BomVO }> {
  return request.get(`/boms/${id}`);
}

export async function getBomsByProject(projectId: number | string): Promise<{ code: number; data: BomVO[] }> {
  return request.get('/boms', { params: { projectId } });
}

// ── BOM Structure ───────────────────────────────────────────────────

/** GET /api/boms/{bomId}/structure — loads BOM item tree by BOM ID */
export async function getBomStructure(bomId: number | string): Promise<{ code: number; data: BomItemVO[] }> {
  return request.get(`/boms/${bomId}/structure`);
}

/** Add item to a specific BOM */
export async function createBomItem(bomId: number | string, data: Record<string, any>): Promise<{ code: number; data: BomItemVO }> {
  return request.post(`/boms/${bomId}/items`, data);
}

export async function updateBomItem(itemId: number, data: Record<string, any>): Promise<{ code: number; data: BomItemVO }> {
  return request.put(`/boms/items/${itemId}`, data);
}

export async function deleteBomItem(itemId: number): Promise<{ code: number; data: null }> {
  return request.delete(`/boms/items/${itemId}`);
}

// ── Approval ────────────────────────────────────────────────────────

/** Submit BOM for approval (BOM_APPROVAL workflow) */
export async function submitForApproval(bomId: number | string): Promise<{ code: number; data: null }> {
  return request.post(`/boms/${bomId}/submit-approval`);
}

/** Withdraw a pending BOM approval */
export async function withdrawBomApproval(bomId: number | string): Promise<{ code: number; data: null }> {
  return request.post(`/boms/${bomId}/withdraw-approval`);
}

// ── Versions ────────────────────────────────────────────────────────

export async function getBomVersions(id: number | string) {
  return request.get(`/boms/${id}/versions`);
}

/** Save current state as a new version. Backend: POST /api/boms/{id}/save-version?changeSummary=... */
export async function saveBomVersion(id: number | string, changeSummary?: string) {
  return request.post(`/boms/${id}/save-version`, null, { params: { changeSummary } });
}

/** Compare two BOM versions — returns added/removed/modified item lists */
export async function compareBomVersions(id: number | string, v1: number | string, v2: number | string) {
  return request.get(`/boms/${id}/compare`, { params: { v1, v2 } });
}

// ── Change Requests ─────────────────────────────────────────────────

export async function getChangeRequests(bomId: number | string) {
  return request.get(`/boms/${bomId}/change-requests`);
}

export async function createChangeRequest(bomId: number | string, data: {
  changeType: string;
  itemId?: number;
  name?: string;
  sourceType?: string;
  quantity?: number;
  specification?: string;
  materialCode?: string;
  unitOfMeasure?: string;
  description?: string;
}) {
  return request.post(`/boms/${bomId}/change-requests`, data);
}

// ── Legacy aliases (kept for backward compat) ───────────────────────

/** @deprecated Use getBomStructure(bomId) with BOM ID instead of project ID */
export const getBomTree = getBomStructure;

/** @deprecated Use getBomsByProject */
export const getBomItems = getBomsByProject;

/** @deprecated Use saveBomVersion */
export const createBomVersion = saveBomVersion;

/** Roll back a BOM to a previously saved version. Backend: POST /api/boms/{id}/rollback?targetVersion=... */
export async function rollbackBomVersion(id: number | string, targetVersion: string) {
  return request.post(`/boms/${id}/rollback`, null, { params: { targetVersion } });
}
