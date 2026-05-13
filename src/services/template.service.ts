import api from './api';

export async function getTemplates(params?: Record<string, any>) {
  return api.get('/templates', { params });
}

export async function getTemplate(id: string) {
  return api.get(`/templates/${id}`);
}

export async function deleteTemplate(id: string) {
  return api.delete(`/templates/${id}`);
}

export async function previewTemplate(id: string) {
  return api.get(`/templates/${id}/preview`);
}

export async function applyTemplate(id: string, data: Record<string, any>) {
  return api.post(`/templates/${id}/apply`, data);
}

export async function duplicateTemplate(id: string) {
  return api.post(`/templates/${id}/duplicate`);
}

export async function exportTemplate(id: string) {
  return api.get(`/templates/${id}/export`);
}

export async function importTemplate(data: Record<string, any>) {
  return api.post('/templates/import', data);
}
