import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockTask = {
    id: 'task-1',
    name: '电池测试任务',
    description: 'Test task description',
    projectId: 'proj-1',
    type: 'development',
    priority: 'high',
    status: 'in_progress',
    assigneeId: 'user-1',
    participantIds: [],
    planStart: new Date('2024-01-01'),
    planEnd: new Date('2024-06-30'),
    actualStart: null,
    actualEnd: null,
    plannedHours: 40,
    loggedHours: 10,
    progress: 25,
    milestone: false,
    dependencies: [],
    reminderStrategy: null,
    archiveLocation: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasks = [mockTask];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findMany: jest.fn().mockResolvedValue(mockTasks),
              count: jest.fn().mockResolvedValue(1),
              findUnique: jest.fn().mockResolvedValue(mockTask),
              create: jest.fn().mockResolvedValue(mockTask),
              update: jest.fn().mockResolvedValue(mockTask),
              delete: jest.fn().mockResolvedValue(mockTask),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const result = await service.findAll({});

      expect(result.data).toEqual(mockTasks);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'in_progress' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'in_progress' }),
        }),
      );
    });

    it('should search by keyword in task name', async () => {
      await service.findAll({ keyword: '电池' });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: '电池', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should support custom pagination', async () => {
      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const result = await service.findOne('task-1');

      expect(result).toEqual(mockTask);
      expect(prisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createDto = {
        name: 'New Task',
        projectId: 'proj-1',
        assigneeId: 'user-1',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockTask);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Task',
          projectId: 'proj-1',
          assigneeId: 'user-1',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update task fields', async () => {
      const updateDto = { name: 'Updated Task', status: 'completed' };

      const result = await service.update('task-1', updateDto);

      expect(result).toEqual(mockTask);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const result = await service.remove('task-1');

      expect(result).toEqual(mockTask);
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });
  });
});
