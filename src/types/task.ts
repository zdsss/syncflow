export enum TaskStatus {
  PENDING_ASSIGN = 'pending_assign',
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  URGENT = 'urgent',
}

export enum TaskPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  type?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  participantIds: string[];
  planStart?: string;
  planEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  plannedHours?: number;
  loggedHours?: number;
  progress: number;
  milestone: boolean;
  dependencies: string[];
  tags: string[];
  reminderStrategy?: string;
  archiveLocation?: string;
  createdAt: string;
  updatedAt: string;
}
