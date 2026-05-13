import { request } from './api';

/** Task as returned by the Java backend TaskVO / TaskListVO */
export interface TaskVO {
  id: number;
  taskNo: string;
  title: string;
  description?: string;
  projectId: number;
  projectName?: string;
  parentId?: number | null;
  parentPath?: string;
  children?: TaskVO[];
  type: string;
  typeName?: string;
  status: number;
  priority?: number;
  assigneeId?: number;
  assigneeName?: string;
  reporterId?: number;
  reporterName?: string;
  participantIds?: number[];
  phaseId?: number;
  milestoneId?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  plannedHours?: number;
  plannedDays?: number;
  actualHours?: number;
  dueDate?: string;
  loggedHours?: number;
  progress: number;
  tags?: string;
  taskCategory?: string;
  flowInstanceId?: string;
  isOverdue?: boolean;
  isWarning?: boolean;
  commentCount?: number;
  attachmentCount?: number;
  watcherCount?: number;
  isWatching?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Paginated response envelope for tasks */
export interface TaskPageData {
  records: TaskVO[];
  total: number;
  size: number;
  current: number;
}

/** Task statistics */
export interface TaskStatistics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  warning: number;
  overdue: number;
  // By type
  taskCount: number;
  milestoneCount: number;
  issueCount: number;
  riskCount: number;
  suggestionCount: number;
  activityCount: number;
  changeCount: number;
  stageCount: number;
  approvalCount: number;
  // By status
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  onHoldCount: number;
  overdueCount: number;
  // Legacy aliases (for backward compatibility)
  pending?: number;
  inProgress?: number;
  reviewing?: number;
  completed?: number;
  cancelled?: number;
}

/** Comment */
export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  userName?: string;
  content: string;
  mentionedUsers?: number[];
  createdAt: string;
}

/** Paginated comment response */
export interface TaskCommentPageData {
  records: TaskComment[];
  total: number;
  size: number;
  current: number;
}

/** Activity log entry */
export interface TaskActivity {
  id: number;
  taskId: number;
  userId: number;
  userName?: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

/** Task query params */
export interface TaskQueryParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  statuses?: number[];
  types?: string[];
  assigneeId?: number;
  projectId?: number;
  phaseId?: number;
  isOverdue?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

// ---- API Methods ----

/** GET /api/tasks - paginated list */
export async function getTasks(params: TaskQueryParams = {}): Promise<{ code: number; data: TaskPageData }> {
  return request.get('/tasks', { params });
}

/** GET /api/tasks/{id} */
export async function getTaskById(id: number): Promise<{ code: number; data: TaskVO }> {
  return request.get(`/tasks/${id}`);
}

/** POST /api/tasks */
export async function createTask(data: Record<string, any>): Promise<{ code: number; data: TaskVO }> {
  return request.post('/tasks', data);
}

/** PUT /api/tasks/{id} */
export async function updateTask(id: number, data: Record<string, any>): Promise<{ code: number; data: TaskVO }> {
  return request.put(`/tasks/${id}`, data);
}

/** DELETE /api/tasks/{id} */
export async function deleteTask(id: number): Promise<{ code: number; data: null }> {
  return request.delete(`/tasks/${id}`);
}

/** PUT /api/tasks/{id}/status */
export async function changeStatus(id: number, status: number): Promise<{ code: number; data: null }> {
  return request.put(`/tasks/${id}/status`, { status });
}

/** PUT /api/tasks/{id}/complete */
export async function completeTask(id: number): Promise<{ code: number; data: null }> {
  return request.put(`/tasks/${id}/complete`);
}

/** PUT /api/tasks/{id}/progress?progress=N */
export async function updateProgress(id: number, progress: number): Promise<{ code: number; data: null }> {
  return request.put(`/tasks/${id}/progress`, null, { params: { progress } });
}

/** GET /api/tasks/statistics */
export async function getStatistics(): Promise<{ code: number; data: TaskStatistics }> {
  return request.get('/tasks/statistics');
}

/** POST /api/tasks/quick */
export async function quickCreate(data: { input: string; projectId?: number }): Promise<{ code: number; data: TaskVO }> {
  return request.post('/tasks/quick', data);
}


/** GET /api/tasks/{id}/comments */
export async function getComments(id: number, pageNum = 1, pageSize = 20): Promise<{ code: number; data: TaskCommentPageData }> {
  return request.get(`/tasks/${id}/comments`, { params: { pageNum, pageSize } });
}

/** POST /api/tasks/{id}/comments */
export async function addComment(id: number, data: { content: string; mentionedUsers?: number[] }): Promise<{ code: number; data: TaskComment }> {
  return request.post(`/tasks/${id}/comments`, data);
}

/** GET /api/tasks/{id}/activities — backend returns flat list */
export async function getActivities(id: number, pageNum = 1, pageSize = 20): Promise<{ code: number; data: TaskActivity[] }> {
  return request.get(`/tasks/${id}/activities`, { params: { pageNum, pageSize } });
}


/** POST /api/tasks/{id}/watch */
export async function watchTask(id: number): Promise<{ code: number; data: null }> {
  return request.post(`/tasks/${id}/watch`);
}

/** DELETE /api/tasks/{id}/watch */
export async function unwatchTask(id: number): Promise<{ code: number; data: null }> {
  return request.delete(`/tasks/${id}/watch`);
}
