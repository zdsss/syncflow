import { Test, TestingModule } from '@nestjs/testing';
import { QueryService } from './query.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QueryService', () => {
  let service: QueryService;
  let prisma: PrismaService;

  const mockTaskGroupBy = [
    { status: 'completed', _count: { id: 5 } },
    { status: 'in_progress', _count: { id: 3 } },
    { status: 'not_started', _count: { id: 2 } },
  ];

  const mockProjectGroupBy = [
    { status: 'completed', _count: { id: 2 } },
    { status: 'in_progress', _count: { id: 1 } },
  ];

  const mockOverdueTasks = [
    {
      id: 'task-1',
      name: 'Overdue Task 1',
      status: 'in_progress',
      planEnd: new Date('2024-01-01'),
      project: { id: 'proj-1', name: 'Project A' },
    },
    {
      id: 'task-2',
      name: 'Overdue Task 2',
      status: 'not_started',
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

      expect(result[0]).toEqual({ status: 'completed', _count: { id: 5 } });
      expect(result[1]).toEqual({ status: 'in_progress', _count: { id: 3 } });
      expect(result[2]).toEqual({ status: 'not_started', _count: { id: 2 } });
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

      expect(result[0]).toEqual({ status: 'completed', _count: { id: 2 } });
      expect(result[1]).toEqual({ status: 'in_progress', _count: { id: 1 } });
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks with project info', async () => {
      const result = await service.getOverdueTasks();

      expect(result).toEqual(mockOverdueTasks);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          planEnd: { lt: expect.any(Date) },
          status: { not: 'completed' },
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
});
