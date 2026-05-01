import type { Department, Role, User } from '@/types';

export const mockDepartments: Department[] = [
  { id: 'd1', name: '公司管理层', sortOrder: 1 },
  { id: 'd2', name: '设计部', sortOrder: 2 },
  { id: 'd3', name: '产品部', sortOrder: 3 },
  { id: 'd4', name: '研发部', sortOrder: 4 },
  { id: 'd5', name: '测试部', sortOrder: 5 },
];

export const mockRoles: Role[] = [
  { id: 'r1', name: '管理层 - 总经理', departmentId: 'd1', permissions: ['*'], memberCount: 1 },
  { id: 'r2', name: '管理层 - 副总经理', departmentId: 'd1', permissions: ['project:*', 'task:*', 'config:read'], memberCount: 2 },
  { id: 'r3', name: '管理层 - 财务总监', departmentId: 'd1', permissions: ['finance:*'], memberCount: 1 },
  { id: 'r4', name: '管理层 - 设计主管', departmentId: 'd2', permissions: ['design:*', 'task:*'], memberCount: 1 },
  { id: 'r5', name: '设计师', departmentId: 'd2', permissions: ['design:edit', 'task:edit'], memberCount: 4 },
  { id: 'r6', name: '管理层 - 产品经理', departmentId: 'd3', permissions: ['product:*', 'task:*'], memberCount: 1 },
  { id: 'r7', name: '需求分析师', departmentId: 'd3', permissions: ['product:edit', 'task:edit'], memberCount: 3 },
  { id: 'r8', name: '产品助理', departmentId: 'd3', permissions: ['product:read', 'task:edit'], memberCount: 2 },
  { id: 'r9', name: '管理层 - 研发主管', departmentId: 'd4', permissions: ['dev:*', 'task:*'], memberCount: 1 },
  { id: 'r10', name: '前端工程师', departmentId: 'd4', permissions: ['dev:edit', 'task:edit'], memberCount: 3 },
  { id: 'r11', name: '后端工程师', departmentId: 'd4', permissions: ['dev:edit', 'task:edit'], memberCount: 3 },
  { id: 'r12', name: '测试主管', departmentId: 'd5', permissions: ['test:*', 'task:*'], memberCount: 1 },
  { id: 'r13', name: '测试工程师', departmentId: 'd5', permissions: ['test:edit', 'task:edit'], memberCount: 3 },
];
