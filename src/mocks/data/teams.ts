import type { Team } from '@/types';

export const mockTeams: Team[] = [
  { id: 't1', name: '电池Pack研发团队', description: '电池Pack产品研发团队', memberCount: 12, leaderId: 'u1', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 't2', name: '设计团队', description: '工业设计团队', memberCount: 30, leaderId: 'u1', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 't3', name: '测试团队', description: '质量测试团队', memberCount: 8, leaderId: 'u13', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];
