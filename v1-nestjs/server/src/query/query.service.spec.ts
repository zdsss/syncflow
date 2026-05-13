import { Test, TestingModule } from '@nestjs/testing';
import { QueryService } from './query.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QueryService', () => {
  let service: QueryService;
  let prisma: PrismaService;

  const mockTaskGroupBy = [
    { status: 'COMPLETED', _count: { id: 5 } },
    { status: 'IN_PROGRESS', _count: { id: 3 } },
    { status: 'NOT_STARTED', _count: { id: 2 } },
  ];

  const mockProjectGroupBy = [
    { status: 'COMPLETED', _count: { id: 2 } },
    { status: 'IN_PROGRESS', _count: { id: 1 } },
  ];

  const mockOverdueTasks = [
    {
      id: 'task-1',
      name: 'Overdue Task 1',
      status: 'IN_PROGRESS',
      planEnd: new Date('2024-01-01'),
      project: { id: 'proj-1', name: 'Project A' },
    },
    {
      id: 'task-2',
      name: 'Overdue Task 2',
      status: 'NOT_STARTED',
      planEnd: new Date('2024-02-01'),
      project: { id: 'proj-2', name: 'Project B' },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              groupBy: jest.fn().mockResolvedValue(mockTaskGroupBy),
              findMany: jest.fn().mockResolvedValue(mockOverdueTasks),
            },
            project: {
              groupBy: jest.fn().mockResolvedValue(mockProjectGroupBy),
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QueryService>(QueryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTaskStats', () => {
    it('should return task statistics grouped by status', async () => {
      const result = await service.getTaskStats();

      expect(result).toEqual(mockTaskGroupBy);
      expect(prisma.task.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        _count: { id: true },
      });
    });

    it('should return correct counts for each status', async () => {
      const result = await service.getTaskStats();

      expect(result[0]).toEqual({ status: 'COMPLETED', _count: { id: 5 } });
      expect(result[1]).toEqual({ status: 'IN_PROGRESS', _count: { id: 3 } });
      expect(result[2]).toEqual({ status: 'NOT_STARTED', _count: { id: 2 } });
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics grouped by status', async () => {
      const result = await service.getProjectStats();

      expect(result).toEqual(mockProjectGroupBy);
      expect(prisma.project.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        _count: { id: true },
      });
    });

    it('should return correct project counts', async () => {
      const result = await service.getProjectStats();

      expect(result[0]).toEqual({ status: 'COMPLETED', _count: { id: 2 } });
      expect(result[1]).toEqual({ status: 'IN_PROGRESS', _count: { id: 1 } });
    });
  });

  describe('exportTasks', () => {
    const mockTasksForExport = [
      {
        id: 'task-1',
        name: 'Battery Test',
        projectId: 'proj-1',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: 'user-1',
        planStart: '2024-01-01T00:00:00.000Z',
        planEnd: '2024-06-30T00:00:00.000Z',
        progress: 25,
        createdAt: new Date(),
      },
      {
        id: 'task-2',
        name: 'Pack Assembly',
        projectId: 'proj-1',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        assigneeId: null,
        planStart: null,
        planEnd: null,
        progress: 100,
        createdAt: new Date(),
      },
    ];

    beforeEach(() => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasksForExport);
    });

    it('should return tasks as CSV string', async () => {
      const result = await service.exportTasks();

      expect(typeof result).toBe('string');
      expect(result).toContain('ID,Name,Project,Status,Priority,Assignee,PlanStart,PlanEnd,Progress');
      expect(result).toContain('task-1');
      expect(result).toContain('task-2');
    });

    it('should have correct CSV header format', async () => {
      const result = await service.exportTasks();
      const lines = result.split('\n');

      expect(lines[0]).toBe('ID,Name,Project,Status,Priority,Assignee,PlanStart,PlanEnd,Progress');
    });

    it('should apply filters when exporting tasks', async () => {
      await service.exportTasks({ projectId: 'proj-1', status: 'IN_PROGRESS', priority: 'HIGH' });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', status: 'IN_PROGRESS', priority: 'HIGH' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle null fields in CSV output', async () => {
      const result = await service.exportTasks();
      const lines = result.split('\n');

      // Second task has null assigneeId and null dates
      expect(lines[2]).toContain('task-2');
      expect(lines[2]).toContain('Pack Assembly');
    });
  });

  describe('exportProjects', () => {
    const mockProjectsForExport = [
      {
        id: 'proj-1',
        name: 'Battery Project',
        status: 'IN_PROGRESS',
        phase: 'DEVELOPMENT',
        leaderId: 'user-1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T00:00:00.000Z',
        completion: 50,
        createdAt: new Date(),
      },
    ];

    beforeEach(() => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjectsForExport);
    });

    it('should return projects as CSV string', async () => {
      const result = await service.exportProjects();

      expect(typeof result).toBe('string');
      expect(result).toContain('ID,Name,Status,Phase,Leader,StartDate,EndDate,Completion');
      expect(result).toContain('proj-1');
      expect(result).toContain('Battery Project');
    });

    it('should have correct CSV header format', async () => {
      const result = await service.exportProjects();
      const lines = result.split('\n');

      expect(lines[0]).toBe('ID,Name,Status,Phase,Leader,StartDate,EndDate,Completion');
    });

    it('should apply status filter when exporting projects', async () => {
      await service.exportProjects({ status: 'IN_PROGRESS' });

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'IN_PROGRESS' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should call findMany with empty where when no filters', async () => {
      await service.exportProjects();

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks with project info', async () => {
      const result = await service.getOverdueTasks();

      expect(result).toEqual(mockOverdueTasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          planEnd: { lt: expect.any(Date) },
          status: { not: 'COMPLETED' },
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { planEnd: 'asc' },
      });
    });

    it('should include project information for each task', async () => {
      const result = await service.getOverdueTasks();

      expect(result[0].project).toBeDefined();
      expect(result[0].project.name).toBe('Project A');
    });
  });

  // === Fix B: Query enhancements ===
  describe('getProjectProgress()', () => {
    it('should return project with task count, completed count, and completion percentage', async () => {
      const mockProject = { id: 'p1', name: 'Battery Project', status: 'IN_PROGRESS' };
      const mockPrisma = prisma as any;
      mockPrisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      mockPrisma.task.count = jest.fn()
        .mockResolvedValueOnce(10)  // totalTasks
        .mockResolvedValueOnce(4);  // completedTasks

      const result = await service.getProjectProgress('p1');

      expect(result).toEqual({
        project: mockProject,
        totalTasks: 10,
        completedTasks: 4,
        completionRate: 40,
      });
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(mockPrisma.task.count).toHaveBeenCalledWith({ where: { projectId: 'p1' } });
      expect(mockPrisma.task.count).toHaveBeenCalledWith({ where: { projectId: 'p1', status: 'COMPLETED' } });
    });

    it('should return 0% completion when there are no tasks', async () => {
      const mockProject = { id: 'p2', name: 'Empty Project', status: 'NOT_STARTED' };
      const mockPrisma = prisma as any;
      mockPrisma.project.findUnique = jest.fn().mockResolvedValue(mockProject);
      mockPrisma.task.count = jest.fn()
        .mockResolvedValueOnce(0)  // totalTasks
        .mockResolvedValueOnce(0); // completedTasks

      const result = await service.getProjectProgress('p2');

      expect(result).toEqual({
        project: mockProject,
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
      });
    });

    it('should return null if project not found', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.project.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.getProjectProgress('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserWorkload()', () => {
    it('should return tasks grouped by status with total count', async () => {
      const mockTasks = [
        { id: 't1', status: 'COMPLETED', assigneeId: 'u1' },
        { id: 't2', status: 'COMPLETED', assigneeId: 'u1' },
        { id: 't3', status: 'IN_PROGRESS', assigneeId: 'u1' },
        { id: 't4', status: 'NOT_STARTED', assigneeId: 'u1' },
        { id: 't5', status: 'IN_PROGRESS', assigneeId: 'u1' },
      ];
      const mockPrisma = prisma as any;
      mockPrisma.task.findMany = jest.fn().mockResolvedValue(mockTasks);

      const result = await service.getUserWorkload('u1');

      expect(result).toEqual({
        total: 5,
        byStatus: {
          COMPLETED: 2,
          IN_PROGRESS: 2,
          NOT_STARTED: 1,
        },
      });
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { assigneeId: 'u1' },
      });
    });

    it('should return empty status map when user has no tasks', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.task.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getUserWorkload('u-no-tasks');

      expect(result).toEqual({ total: 0, byStatus: {} });
    });
  });

  describe('getDepartmentStats()', () => {
    it('should return users in department with their task counts and status breakdown', async () => {
      const mockUsers = [
        { id: 'u1', name: 'Alice' },
        { id: 'u2', name: 'Bob' },
      ];
      const mockPrisma = prisma as any;
      mockPrisma.user = {
        findMany: jest.fn().mockResolvedValue(mockUsers),
      };
      mockPrisma.task.groupBy = jest.fn().mockResolvedValue([
        { assigneeId: 'u1', status: 'COMPLETED', _count: { id: 2 } },
        { assigneeId: 'u1', status: 'IN_PROGRESS', _count: { id: 1 } },
        { assigneeId: 'u1', status: 'NOT_STARTED', _count: { id: 2 } },
        { assigneeId: 'u2', status: 'COMPLETED', _count: { id: 1 } },
        { assigneeId: 'u2', status: 'IN_PROGRESS', _count: { id: 2 } },
      ]);

      const result = await service.getDepartmentStats('dept1');

      expect(result).toEqual([
        { id: 'u1', name: 'Alice', taskCount: 5, byStatus: { COMPLETED: 2, IN_PROGRESS: 1, NOT_STARTED: 2 } },
        { id: 'u2', name: 'Bob', taskCount: 3, byStatus: { COMPLETED: 1, IN_PROGRESS: 2 } },
      ]);
      expect(mockPrisma.task.groupBy).toHaveBeenCalledWith({
        by: ['assigneeId', 'status'],
        where: { assigneeId: { in: ['u1', 'u2'] } },
        _count: { id: true },
      });
    });

    it('should return empty array for non-existent department', async () => {
      const mockPrisma = prisma as any;
      mockPrisma.user = {
        findMany: jest.fn().mockResolvedValue([]),
      };

      const result = await service.getDepartmentStats('nonexistent');

      expect(result).toEqual([]);
    });
  });
});
