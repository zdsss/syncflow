import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;
  let wsService: WebSocketService;
  let auditService: AuditService;
  let activityService: ActivityService;

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

  const mockWsService = {
    emitTaskStatusChanged: jest.fn(),
    emitTaskAssigned: jest.fn(),
    emitNotification: jest.fn(),
    emitApprovalUpdated: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    findAll: jest.fn(),
    getEntityHistory: jest.fn(),
  };

  const mockActivityService = {
    log: jest.fn().mockResolvedValue({ id: 'act-1' }),
    getByProject: jest.fn(),
    getByUser: jest.fn(),
  };

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
            taskDependency: {
              findFirst: jest.fn().mockResolvedValue(null),
              findMany: jest.fn().mockResolvedValue([]),
              create: jest.fn().mockResolvedValue({ id: 'dep-1', taskId: 'task-1', dependsOnId: 'dep-1', type: 'FS' }),
              deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          },
        },
        {
          provide: WebSocketService,
          useValue: mockWsService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
    wsService = module.get<WebSocketService>(WebSocketService);
    auditService = module.get<AuditService>(AuditService);
    activityService = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => jest.clearAllMocks());

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
        include: { children: true },
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

    it('should succeed when expectedUpdatedAt matches', async () => {
      const now = new Date();
      const taskWithTime = { ...mockTask, updatedAt: now };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithTime);
      (prisma.task.update as jest.Mock).mockResolvedValue(taskWithTime);

      await service.update('task-1', { name: 'Updated', expectedUpdatedAt: now.toISOString() });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { name: 'Updated' },
      });
    });

    it('should throw ConflictException when expectedUpdatedAt does not match', async () => {
      const now = new Date();
      const oldTime = new Date(now.getTime() - 10000);
      const taskWithTime = { ...mockTask, updatedAt: now };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithTime);

      await expect(
        service.update('task-1', { name: 'Updated', expectedUpdatedAt: oldTime.toISOString() }),
      ).rejects.toThrow(ConflictException);
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

  describe('WebSocket integration', () => {
    it('should emit task:status-changed when task status is updated', async () => {
      const updatedTask = { ...mockTask, status: 'completed' };
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      await service.update('task-1', { status: 'completed' });

      expect(wsService.emitTaskStatusChanged).toHaveBeenCalledWith(
        'task-1',
        'completed',
        'user-1',
      );
    });

    it('should NOT emit task:status-changed when status is unchanged', async () => {
      const sameTask = { ...mockTask, status: 'in_progress' };
      (prisma.task.update as jest.Mock).mockResolvedValue(sameTask);

      await service.update('task-1', { name: 'Updated Name' });

      expect(wsService.emitTaskStatusChanged).not.toHaveBeenCalled();
    });

    it('should emit task:assigned when task is created with assigneeId', async () => {
      const newTask = { ...mockTask, assigneeId: 'user-2' };
      (prisma.task.create as jest.Mock).mockResolvedValue(newTask);

      await service.create({
        name: 'New Task',
        projectId: 'proj-1',
        assigneeId: 'user-2',
      });

      expect(wsService.emitTaskAssigned).toHaveBeenCalledWith(
        'task-1',
        'user-2',
      );
    });

    it('should NOT emit task:assigned when task has no assigneeId', async () => {
      const newTask = { ...mockTask, assigneeId: null };
      (prisma.task.create as jest.Mock).mockResolvedValue(newTask);

      await service.create({
        name: 'New Task',
        projectId: 'proj-1',
      });

      expect(wsService.emitTaskAssigned).not.toHaveBeenCalled();
    });
  });

  describe('Audit logging', () => {
    it('should log audit when a task is created', async () => {
      await service.create({
        name: 'New Task',
        projectId: 'proj-1',
        assigneeId: 'user-1',
      });

      expect(auditService.log).toHaveBeenCalledWith(
        'user-1',
        'create',
        'task',
        'task-1',
      );
    });

    it('should log audit when a task is updated', async () => {
      await service.update('task-1', { name: 'Updated Task' });

      expect(auditService.log).toHaveBeenCalledWith(
        'user-1',
        'update',
        'task',
        'task-1',
        expect.objectContaining({
          name: { old: '电池测试任务', new: 'Updated Task' },
        }),
      );
    });

    it('should log audit when a task is deleted', async () => {
      await service.remove('task-1');

      expect(auditService.log).toHaveBeenCalledWith(
        'user-1',
        'delete',
        'task',
        'task-1',
      );
    });
  });

  describe('Activity logging', () => {
    it('should log activity when a task is created', async () => {
      await service.create({
        name: 'New Task',
        projectId: 'proj-1',
        assigneeId: 'user-1',
      });

      expect(activityService.log).toHaveBeenCalledWith(
        'user-1',
        'created',
        'task',
        'task-1',
        '电池测试任务',
        'proj-1',
      );
    });
  });

  describe('addDependency', () => {
    const mockTaskWithDeps = {
      ...mockTask,
      dependencies: [],
    };

    const mockDependencyTask = {
      ...mockTask,
      id: 'task-2',
      name: 'Dependency Task',
      dependencies: [],
    };

    it('should add a dependency ID to the task dependencies array', async () => {
      (prisma.task.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTaskWithDeps)
        .mockResolvedValueOnce(mockDependencyTask)
        .mockResolvedValueOnce({ ...mockTaskWithDeps, dependencies: ['task-2'] });
      (prisma.taskDependency.findFirst as jest.Mock).mockResolvedValue(null);
      const updatedTask = { ...mockTaskWithDeps, dependencies: ['task-2'] };
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      const result = await service.addDependency('task-1', 'task-2');

      expect(prisma.taskDependency.create).toHaveBeenCalledWith({
        data: { taskId: 'task-1', dependsOnId: 'task-2', type: 'FS' },
      });
    });

    it('should throw if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.addDependency('nonexistent', 'task-2'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw if dependency task not found', async () => {
      (prisma.task.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTaskWithDeps)
        .mockResolvedValueOnce(null);

      await expect(service.addDependency('task-1', 'nonexistent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent circular dependencies', async () => {
      const taskB = { ...mockTask, id: 'task-b', dependencies: ['task-a'] };
      const taskAWithDep = { ...mockTask, id: 'task-a', dependencies: ['task-b'] };

      (prisma.task.findUnique as jest.Mock)
        .mockResolvedValueOnce(taskB)
        .mockResolvedValueOnce(taskAWithDep);
      // Mock taskDependency.findFirst to find reverse dependency (circular)
      (prisma.taskDependency.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'rev-dep', taskId: 'task-a', dependsOnId: 'task-b' });

      await expect(service.addDependency('task-b', 'task-a'))
        .rejects.toThrow(BadRequestException);
    });

    it('should return task if dependency already exists', async () => {
      const taskWithExisting = { ...mockTask, dependencies: ['task-2'] };
      (prisma.task.findUnique as jest.Mock)
        .mockResolvedValueOnce(taskWithExisting)
        .mockResolvedValueOnce(mockDependencyTask);
      // Mock taskDependency.findFirst for circular check (null = no reverse)
      // Mock taskDependency.findFirst for existing check (found = already exists)
      (prisma.taskDependency.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // no circular
        .mockResolvedValueOnce({ id: 'existing-dep', taskId: 'task-1', dependsOnId: 'task-2' }); // exists

      const result = await service.addDependency('task-1', 'task-2');

      expect(prisma.taskDependency.create).not.toHaveBeenCalled();
    });
  });

  describe('removeDependency', () => {
    it('should remove a dependency ID from the task dependencies array', async () => {
      const taskWithDeps = { ...mockTask, dependencies: ['task-2', 'task-3'] };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithDeps);
      const updatedTask = { ...mockTask, dependencies: ['task-3'] };
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      const result = await service.removeDependency('task-1', 'task-2');

      expect(prisma.taskDependency.deleteMany).toHaveBeenCalledWith({
        where: { taskId: 'task-1', dependsOnId: 'task-2' },
      });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { dependencies: ['task-3'] },
      });
    });

    it('should throw if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.removeDependency('nonexistent', 'task-2'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getDependencies', () => {
    it('should return full task objects for all dependencies', async () => {
      const taskWithDeps = { ...mockTask, dependencies: ['task-2', 'task-3'] };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithDeps);

      const depRecords = [
        { id: 'td-1', taskId: 'task-1', dependsOnId: 'task-2', type: 'FS', dependsOn: { ...mockTask, id: 'task-2', name: 'Dep 2' } },
        { id: 'td-2', taskId: 'task-1', dependsOnId: 'task-3', type: 'SS', dependsOn: { ...mockTask, id: 'task-3', name: 'Dep 3' } },
      ];
      (prisma.taskDependency.findMany as jest.Mock).mockResolvedValue(depRecords);

      const result = await service.getDependencies('task-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task-2');
      expect(result[0].dependencyType).toBe('FS');
      expect(result[1].id).toBe('task-3');
      expect(result[1].dependencyType).toBe('SS');
      expect(prisma.taskDependency.findMany).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
        include: { dependsOn: true },
      });
    });

    it('should return empty array if no dependencies', async () => {
      const taskNoDeps = { ...mockTask, dependencies: [] };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskNoDeps);
      (prisma.taskDependency.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getDependencies('task-1');

      expect(result).toEqual([]);
    });

    it('should throw if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getDependencies('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('addTag', () => {
    it('should add a tag to the task tags array', async () => {
      const taskWithTags = { ...mockTask, tags: ['bug'] };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithTags);
      const updatedTask = { ...mockTask, tags: ['bug', 'feature'] };
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      const result = await service.addTag('task-1', 'feature');

      expect(result).toEqual(updatedTask);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { tags: ['bug', 'feature'] },
      });
    });

    it('should throw if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.addTag('nonexistent', 'feature'))
        .rejects.toThrow(NotFoundException);
    });

    it('should be idempotent (no-op if tag already exists)', async () => {
      const taskWithTag = { ...mockTask, tags: ['feature'] };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithTag);

      const result = await service.addTag('task-1', 'feature');

      expect(result).toEqual(taskWithTag);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('removeTag', () => {
    it('should remove a tag from the task tags array', async () => {
      const taskWithTags = { ...mockTask, tags: ['bug', 'feature'] };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithTags);
      const updatedTask = { ...mockTask, tags: ['bug'] };
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      const result = await service.removeTag('task-1', 'feature');

      expect(result).toEqual(updatedTask);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { tags: ['bug'] },
      });
    });

    it('should throw if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.removeTag('nonexistent', 'feature'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getTags', () => {
    it('should return the tags array', async () => {
      const taskWithTags = { ...mockTask, tags: ['bug', 'feature', 'urgent'] };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(taskWithTags);

      const result = await service.getTags('task-1');

      expect(result).toEqual(['bug', 'feature', 'urgent']);
    });

    it('should throw if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getTags('nonexistent'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
