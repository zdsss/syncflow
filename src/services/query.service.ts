import api from './api';

export async function getTaskStats() {
  return api.get('/query/task-stats');
}

export async function getProjectStats() {
  return api.get('/query/project-stats');
}

export async function getOverdueTasks() {
  return api.get('/query/overdue-tasks');
}
