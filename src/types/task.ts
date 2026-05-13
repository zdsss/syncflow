export type TaskType =
  | 'TASK'
  | 'MILESTONE'
  | 'ISSUE'
  | 'RISK'
  | 'SUGGESTION'
  | 'CHANGE'
  | 'ACTIVITY'
  | 'STAGE'
  | 'APPROVAL';

export enum TaskStatus {
  PENDING = 1,
  IN_PROGRESS = 2,
  PENDING_REVIEW = 3,
  COMPLETED = 4,
  CANCELLED = 5,
  ON_HOLD = 6,
  OVERDUE = 7,
}

export enum TaskPriority {
  URGENT = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
}

export interface TaskDependency {
  taskId: string;
  dependsOnId: string;
  type: 'SS' | 'SF' | 'FS' | 'FF';
}

export interface Task {
  id: number;
  taskNo: string;
  title: string;
  name?: string;
  description?: string;
  type: TaskType;
  projectId: number;
  parentId?: number;
  children?: Task[];
  priority?: TaskPriority;
  status: TaskStatus;
  assigneeId?: number;
  assigneeName?: string;
  reporterName?: string;
  projectName?: string;
  deptName?: string;
  phaseId?: number;
  milestoneId?: number;
  milestone?: boolean;
  taskCategory?: string;
  dependencies?: string[];
  dependencyDetails?: TaskDependency[];
  participants?: string[];
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  plannedHours?: number;
  actualHours?: number;
  plannedDays?: number;
  dueDate?: string;
  progress: number;
  tags?: string;
  isWatching?: boolean;
  isOverdue?: boolean;
  isWarning?: boolean;
  commentCount?: number;
  attachmentCount?: number;
  watcherCount?: number;
  flowInstanceId?: string;
  createdAt?: string;
  updatedAt?: string;
}
