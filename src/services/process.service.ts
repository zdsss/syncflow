import api from './api';

// ── Route List / Detail ─────────────────────────────────────────────

export async function getProcessRoutes(params: { projectId?: number; bomId?: number } = {}) {
  return api.get('/process-routes', { params });
}

export async function getProcessRoute(id: number) {
  return api.get(`/process-routes/${id}`);
}

// ── Route CRUD ──────────────────────────────────────────────────────

export async function createProcessRoute(data: {
  name: string;
  bomId: number;
  projectId: number;
  productCode: string;
  productName: string;
}) {
  return api.post('/process-routes', data);
}

// ── Legacy wrappers used by ProcessPage component ────────────────

export async function deleteProcessRoute(id: string | number) {
  return api.delete(`/process-routes/${id}`);
}

export async function addProcessStep(routeId: string | number, data: { name: string; sortOrder: number }) {
  return api.post(`/process-routes/${routeId}/operations`, data);
}

export async function reorderOperations(routeId: string | number, operationIds: string[]) {
  return api.put(`/process-routes/${routeId}/operations/reorder`, operationIds);
}

// ── Versions ──────────────────────────────────────────────────────

export async function getProcessVersions(routeId: string) {
  return api.get(`/process-routes/${routeId}/versions`) as unknown as Promise<{ data: Array<{ id: string; version: number; description?: string; status: string; routeId: string; createdAt: string; steps?: { id: string; name: string; sortOrder: number }[] }> }>;
}

export async function createProcessVersion(routeId: string, description?: string) {
  return api.post(`/process-routes/${routeId}/versions`, { description });
}

export async function publishProcessVersion(routeId: string, versionId: string) {
  return api.put(`/process-routes/${routeId}/versions/${versionId}/publish`);
}

// ── Step Parameters ───────────────────────────────────────────────

export async function getStepParameters(routeId: string, stepId: string) {
  return api.get(`/process-routes/${routeId}/operations/${stepId}/parameters`) as unknown as Promise<{ data: Array<{ name: string; targetValue: string; upperLimit: string; lowerLimit: string; unit: string; inspectionMethod: string }> }>;
}

export async function updateStepParameters(routeId: string, stepId: string, parameters: { name: string; targetValue: string; upperLimit: string; lowerLimit: string; unit: string; inspectionMethod: string }[]) {
  return api.put(`/process-routes/${routeId}/operations/${stepId}/parameters`, parameters);
}

// ── Approval ─────────────────────────────────────────────────────────

export async function submitRouteForApproval(routeId: string | number) {
  return api.post(`/process-routes/${routeId}/submit-approval`);
}

export async function withdrawRouteApproval(routeId: string | number) {
  return api.post(`/process-routes/${routeId}/withdraw-approval`);
}
