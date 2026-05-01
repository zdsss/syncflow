import api from './api';

export async function getProcessRoutes(projectId: string) {
  return api.get('/process', { params: { projectId } });
}

export async function getProcessRoute(id: string) {
  return api.get(`/process/${id}`);
}

export async function createProcessRoute(data: Record<string, any>) {
  return api.post('/process', data);
}

export async function updateProcessRoute(id: string, data: Record<string, any>) {
  return api.patch(`/process/${id}`, data);
}

export async function addProcessStep(routeId: string, data: Record<string, any>) {
  return api.post(`/process/${routeId}/steps`, data);
}

export async function deleteProcessRoute(id: string) {
  return api.delete(`/process/${id}`);
}
