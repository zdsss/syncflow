import api from './api';

export async function getResources(params?: { type?: string; status?: string }) {
  return api.get('/resources', { params });
}

export async function getResource(id: string) {
  return api.get(`/resources/${id}`);
}

export async function createResource(data: any) {
  return api.post('/resources', data);
}

export async function updateResource(id: string, data: any) {
  return api.patch(`/resources/${id}`, data);
}

export async function deleteResource(id: string) {
  return api.delete(`/resources/${id}`);
}
