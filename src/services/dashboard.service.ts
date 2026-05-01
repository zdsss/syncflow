import api from './api';

export async function getDashboardSummary() {
  return api.get('/dashboard/summary');
}
