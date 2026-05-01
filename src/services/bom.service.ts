import api from './api';

export async function getBomItems(projectId: string) {
  return api.get('/bom', { params: { projectId } });
}

export async function getBomTree(projectId: string) {
  return api.get('/bom/tree', { params: { projectId } });
}

export async function getBomItem(id: string) {
  return api.get(`/bom/${id}`);
}

export async function createBomItem(data: Record<string, any>) {
  return api.post('/bom', data);
}

export async function updateBomItem(id: string, data: Record<string, any>) {
  return api.patch(`/bom/${id}`, data);
}

export async function deleteBomItem(id: string) {
  return api.delete(`/bom/${id}`);
}
