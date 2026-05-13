import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  getTemplates,
  getTemplate,
  deleteTemplate,
  previewTemplate,
  applyTemplate,
  duplicateTemplate,
  exportTemplate,
  importTemplate,
} from '../template.service';

describe('TemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /templates with params', async () => {
    const params = { type: 'project' };
    await getTemplates(params);
    expect(api.get).toHaveBeenCalledWith('/templates', { params });
  });

  it('calls GET /templates/:id', async () => {
    await getTemplate('t1');
    expect(api.get).toHaveBeenCalledWith('/templates/t1');
  });

  it('calls DELETE /templates/:id', async () => {
    await deleteTemplate('t1');
    expect(api.delete).toHaveBeenCalledWith('/templates/t1');
  });

  it('calls GET /templates/:id/preview', async () => {
    await previewTemplate('t1');
    expect(api.get).toHaveBeenCalledWith('/templates/t1/preview');
  });

  it('calls POST /templates/:id/apply with data', async () => {
    const data = { name: 'New Project', leaderId: 'u1', startDate: '2026-05-01' };
    await applyTemplate('t1', data);
    expect(api.post).toHaveBeenCalledWith('/templates/t1/apply', data);
  });

  it('calls POST /templates/:id/duplicate', async () => {
    await duplicateTemplate('t1');
    expect(api.post).toHaveBeenCalledWith('/templates/t1/duplicate');
  });

  it('calls GET /templates/:id/export', async () => {
    await exportTemplate('t1');
    expect(api.get).toHaveBeenCalledWith('/templates/t1/export');
  });

  it('calls POST /templates/import with data', async () => {
    const data = { name: 'Imported Template', content: {} };
    await importTemplate(data);
    expect(api.post).toHaveBeenCalledWith('/templates/import', data);
  });
});
