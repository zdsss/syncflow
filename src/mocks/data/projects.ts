import type { Project } from '@/types';
import { ProjectPhase, ProjectStatus } from '@/types';

export const mockProjects: Project[] = [
  // Level 1 - Industry
  { id: 'p1', name: '汽车', category: '行业', phase: ProjectPhase.DEVELOPMENT, status: ProjectStatus.IN_PROGRESS, leaderId: 'u6', startDate: '2025-01-01', endDate: '2026-12-31', completion: 45, parentId: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  // Level 2 - Domain
  { id: 'p2', name: '新能源', category: '领域', phase: ProjectPhase.DEVELOPMENT, status: ProjectStatus.IN_PROGRESS, leaderId: 'u6', startDate: '2025-01-01', endDate: '2026-12-31', completion: 42, parentId: 'p1', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  // Level 3 - Product Line
  { id: 'p3', name: '电池', category: '产品线', phase: ProjectPhase.DEVELOPMENT, status: ProjectStatus.IN_PROGRESS, leaderId: 'u8', startDate: '2025-02-01', endDate: '2026-10-31', completion: 38, parentId: 'p2', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  // Level 4 - Sub-system
  { id: 'p4', name: '电池Pack', category: '子系统', phase: ProjectPhase.DEVELOPMENT, status: ProjectStatus.IN_PROGRESS, leaderId: 'u1', startDate: '2025-03-01', endDate: '2026-06-30', completion: 35, parentId: 'p3', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  // Level 5 - Module
  { id: 'p5', name: '电池模组', category: '模组', phase: ProjectPhase.PLANNING, status: ProjectStatus.IN_PROGRESS, leaderId: 'u2', startDate: '2025-04-01', endDate: '2026-03-31', completion: 25, parentId: 'p4', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-15T00:00:00Z' },
  { id: 'p6', name: '电池包', category: '组件', phase: ProjectPhase.CONCEPT, status: ProjectStatus.NOT_STARTED, leaderId: 'u3', startDate: '2025-05-01', endDate: '2025-12-31', completion: 10, parentId: 'p5', createdAt: '2025-05-01T00:00:00Z', updatedAt: '2025-05-01T00:00:00Z' },
  { id: 'p7', name: '电池冷却液', category: '零件', phase: ProjectPhase.SURVEY, status: ProjectStatus.NOT_STARTED, leaderId: 'u4', startDate: '2025-06-01', endDate: '2025-11-30', completion: 5, parentId: 'p6', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z' },
  // Additional projects
  { id: 'p8', name: '智能驾驶系统', category: '子系统', phase: ProjectPhase.CONCEPT, status: ProjectStatus.IN_PROGRESS, leaderId: 'u8', startDate: '2025-03-15', endDate: '2026-09-30', completion: 20, parentId: 'p2', createdAt: '2025-03-15T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  { id: 'p9', name: '充电桩控制系统', category: '子系统', phase: ProjectPhase.DEVELOPMENT, status: ProjectStatus.DELAYED, leaderId: 'u10', startDate: '2025-01-15', endDate: '2025-08-31', completion: 60, parentId: 'p2', createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-05-01T00:00:00Z' },
  { id: 'p10', name: '车载信息娱乐系统', category: '子系统', phase: ProjectPhase.TESTING, status: ProjectStatus.IN_PROGRESS, leaderId: 'u11', startDate: '2025-02-01', endDate: '2025-07-31', completion: 75, parentId: 'p1', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-05-01T00:00:00Z' },
];
