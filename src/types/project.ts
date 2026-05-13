/**
 * @deprecated Static phase enum - prefer dynamic ProjectPhaseData from API.
 * Java backend stores phases in prj_phase table, not static enum.
 */
export enum ProjectPhase {
  SURVEY = 1,
  CONCEPT = 2,
  PLANNING = 3,
  DEVELOPMENT = 4,
  TESTING = 5,
  MASS_PRODUCTION = 6,
}

/** Dynamic project phase data from API (prj_phase table) */
export interface ProjectPhaseData {
  id: number;
  projectId: number;
  name: string;
  code: string;
  seqNo: number;
  status: number;
  progress: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
}

export enum ProjectStatus {
  CANCELLED = 0,
  NOT_STARTED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  DELAYED = 4,
}

export interface Project {
  id: number;
  code?: string;
  name: string;
  description?: string;
  parentId?: number | null;
  projectType?: string;
  priority?: number;
  status: ProjectStatus;
  ownerId: number;
  ownerName?: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  parentPath?: string;
  flowInstanceId?: string;
  children?: Project[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTreeNode extends Project {
  children?: ProjectTreeNode[];
  level: number;
}
