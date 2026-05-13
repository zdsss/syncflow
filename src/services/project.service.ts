import { request } from './api';

/** Project as returned by the backend (integer IDs, new field names) */
export interface ProjectVO {
  id: number;
  code?: string;
  name: string;
  description?: string;
  parentId?: number | null;
  projectType?: string;
  priority?: number;
  status: number;
  ownerId: number;
  ownerName?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  parentPath?: string;
  children?: ProjectVO[];
  createdAt?: string;
  updatedAt?: string;
}

/** Phase tree node with milestones and stage gates */
export interface PhaseNode {
  id: number;
  projectId?: number;
  name: string;
  code?: string;
  seqNo?: number;
  status?: number;
  progress?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  createdAt?: string;
  updatedAt?: string;
  milestones?: MilestoneNode[];
  stageGates?: StageGateNode[];
  children?: PhaseNode[];
}

export interface MilestoneNode {
  id: number;
  projectId?: number;
  phaseId?: number;
  name: string;
  type?: string;
  status?: number;
  progress?: number;
  plannedDate?: string;
  actualDate?: string;
  assigneeId?: number;
  deliverable?: string;
  parentMilestoneId?: number;
  flowInstanceId?: string;
  taskId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StageGateNode {
  id: number;
  phaseId?: number;
  name: string;
  gateType?: string;
  status?: number;
  flowInstanceId?: string;
  taskId?: string;
  approverId?: number;
  approvedAt?: string;
  comments?: string;
  activeTaskName?: string;
  activeTaskStatus?: string;
  activeTaskAssigneeId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Project member */
export interface ProjectMember {
  id?: number;
  userId: number;
  userName?: string;
  projectRole?: string;
  deptId?: number;
  deptName?: string;
  joinedAt?: string;
}

// ---- API Methods ----

/** GET /api/projects - returns tree ProjectVO[] */
export async function getProjects(): Promise<{ code: number; data: ProjectVO[] }> {
  return request.get('/projects');
}

/** GET /api/projects/{id} */
export async function getProjectById(id: number): Promise<{ code: number; data: ProjectVO }> {
  return request.get(`/projects/${id}`);
}

/** POST /api/projects */
export async function createProject(data: Record<string, any>): Promise<{ code: number; data: ProjectVO }> {
  return request.post('/projects', data);
}

/** PUT /api/projects/{id} */
export async function updateProject(id: number, data: Record<string, any>): Promise<{ code: number; data: ProjectVO }> {
  return request.put(`/projects/${id}`, data);
}

/** DELETE /api/projects/{id} */
export async function deleteProject(id: number): Promise<{ code: number; data: null }> {
  return request.delete(`/projects/${id}`);
}

/** GET /api/projects/{id}/phases/tree */
export async function getPhaseTree(id: number): Promise<{ code: number; data: PhaseNode[] }> {
  return request.get(`/projects/${id}/phases/tree`);
}

/** GET /api/projects/{id}/members */
export async function getMembers(id: number): Promise<{ code: number; data: ProjectMember[] }> {
  return request.get(`/projects/${id}/members`);
}

/** POST /api/projects/{id}/members */
export async function addMember(id: number, data: { userId: number; projectRole?: string }): Promise<{ code: number; data: null }> {
  return request.post(`/projects/${id}/members`, data);
}

/** DELETE /api/projects/{id}/members/{userId} */
export async function removeMember(id: number, userId: number): Promise<{ code: number; data: null }> {
  return request.delete(`/projects/${id}/members/${userId}`);
}

/** Gantt chart task item */
export interface GanttTaskItem {
  id: number;
  name: string;
  type: string;
  plannedStart?: string;
  plannedEnd?: string;
  plannedDate?: string;
  progress?: number;
  parentId?: number;
  status?: number;
  assigneeId?: number;
  assigneeName?: string;
  phaseId?: number;
  milestoneId?: number;
}

/** Gantt chart dependency */
export interface GanttDependencyItem {
  taskId: number;
  dependsOnTaskId: number;
  dependencyType: string;
}

/** Gantt chart data returned by GET /api/projects/{id}/gantt */
export interface GanttData {
  startDate?: string;
  endDate?: string;
  tasks: GanttTaskItem[];
  dependencies: GanttDependencyItem[];
}

/** GET /api/projects/{id}/gantt */
export async function getGanttData(id: number): Promise<{ code: number; data: GanttData }> {
  return request.get(`/projects/${id}/gantt`);
}

// ---- Milestone API ----

/** Milestone as returned by the backend */
export interface MilestoneVO {
  id: number;
  projectId: number;
  phaseId?: number;
  name: string;
  description?: string;
  plannedDate?: string;
  actualDate?: string;
  status: number;
  progress: number;
  deliverable?: string;
  createdAt?: string;
}

/** Create milestone DTO */
export interface CreateMilestoneDTO {
  name: string;
  description?: string;
  phaseId?: number;
  dueDate?: string;
}

/** GET /api/projects/{id}/milestones */
export async function getMilestones(projectId: number, phaseId?: number): Promise<{ code: number; data: MilestoneVO[] }> {
  return request.get(`/projects/${projectId}/milestones`, { params: phaseId ? { phaseId } : {} });
}

/** POST /api/projects/{id}/milestones */
export async function createMilestone(projectId: number, data: CreateMilestoneDTO): Promise<{ code: number; data: MilestoneVO }> {
  return request.post(`/projects/${projectId}/milestones`, data);
}

/** PUT /api/projects/milestones/{milestoneId} */
export async function updateMilestone(milestoneId: number, data: CreateMilestoneDTO): Promise<{ code: number; data: MilestoneVO }> {
  return request.put(`/projects/milestones/${milestoneId}`, data);
}

/** PUT /api/projects/milestones/{milestoneId}/start */
export async function startMilestone(milestoneId: number): Promise<{ code: number; data: MilestoneVO }> {
  return request.put(`/projects/milestones/${milestoneId}/start`);
}

/** POST /api/projects/milestones/{milestoneId}/complete */
export async function completeMilestone(milestoneId: number): Promise<{ code: number; data: null }> {
  return request.post(`/projects/milestones/${milestoneId}/complete`);
}

/** PUT /api/projects/{id}/status */
export async function updateProjectStatus(projectId: number, status: number): Promise<{ code: number; data: ProjectVO }> {
  return request.put(`/projects/${projectId}/status`, { status });
}

// ---- Phase API ----

/** POST /api/projects/{id}/phases */
export async function createPhase(projectId: number, data: { name: string; code?: string }): Promise<{ code: number; data: PhaseNode }> {
  return request.post(`/projects/${projectId}/phases`, data);
}

/** PUT /api/projects/phases/{phaseId} */
export async function updatePhase(phaseId: number, data: { name: string; code?: string }): Promise<{ code: number; data: PhaseNode }> {
  return request.put(`/projects/phases/${phaseId}`, data);
}

/** DELETE /api/projects/phases/{phaseId} */
export async function deletePhase(phaseId: number): Promise<{ code: number; data: null }> {
  return request.delete(`/projects/phases/${phaseId}`);
}

/** PUT /api/projects/{id}/phases/reorder */
export async function reorderPhases(projectId: number, phaseIdSeqNos: Record<number, number>): Promise<{ code: number; data: null }> {
  return request.put(`/projects/${projectId}/phases/reorder`, phaseIdSeqNos);
}
