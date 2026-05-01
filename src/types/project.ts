export enum ProjectPhase {
  SURVEY = 'survey',
  CONCEPT = 'concept',
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  MASS_PRODUCTION = 'mass_production',
}

export enum ProjectStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  category: string;
  phase: ProjectPhase;
  status: ProjectStatus;
  leaderId: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  completion: number;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTreeNode extends Project {
  children?: ProjectTreeNode[];
  level: number;
}
