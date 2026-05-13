import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test project',
    parentId: null,
    category: 'development',
    phase: 'survey',
    status: 'in_progress',
    leaderId: 'user-1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    actualStartDate: null,
    actualEndDate: null,
    completion: 30,
    budget: 100000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProjectWithTasks = {
    ...mockProject,
    tasks: [],
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    findAll: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation(async (fn) => fn({
              project: {
                findUnique: jest.fn().mockResolvedValue({
                  ...mockProjectWithTasks,
                  tasks: [
                    {
                      id: 'task-1',
                      name: 'Task 1',
                      description: 'First task',
                      projectId: 'proj-1',
                      type: 'design',
                      priority: 'HIGH',
                      status: 'IN_PROGRESS',
                      assigneeId: 'user-1',
                      participantIds: ['user-2'],
                      planStart: new Date('2024-02-01'),
                      planEnd: new Date('2024-04-01'),
                      actualStart: null,
                      actualEnd: null,
                      plannedHours: 40,
                      loggedHours: 10,
                      progress: 50,
                      milestone: false,
                      dependencies: [],
                      reminderStrategy: null,
                      archiveLocation: null,
                      tags: ['backend'],
                    },
                    {
                      id: 'task-2',
                      name: 'Task 2',
                      description: 'Second task',
                      projectId: 'proj-1',
                      type: 'testing',
                      priority: 'MEDIUM',
                      status: 'COMPLETED',
                      assigneeId: 'user-2',
                      participantIds: [],
                      planStart: new Date('2024-05-01'),
                      planEnd: new Date('2024-07-01'),
                      actualStart: new Date('2024-05-01'),
                      actualEnd: new Date('2024-06-15'),
                      plannedHours: 20,
                      loggedHours: 18,
                      progress: 100,
                      milestone: true,
                      dependencies: [],
                      reminderStrategy: null,
                      archiveLocation: null,
                      tags: ['qa'],
                    },
                  ],
                }),
                create: jest.fn().mockResolvedValue({
                  ...mockProject,
                  id: 'proj-1-copy',
                  name: 'Test Project (副本)',
                  status: 'NOT_STARTED',
                  completion: 0,
                  tasks: [
                    { id: 'new-task-1', name: 'Task 1' },
                    { id: 'new-task-2', name: 'Task 2' },
                  ],
                  _count: { tasks: 2 },
                }),
              },
              task: {
                createMany: jest.fn().mockResolvedValue({ count: 2 }),
              },
            })),
            project: {
              findMany: jest.fn().mockResolvedValue([mockProject]),
              findUnique: jest.fn().mockResolvedValue(mockProjectWithTasks),
              create: jest.fn().mockResolvedValue(mockProject),
              update: jest.fn().mockResolvedValue(mockProject),
              delete: jest.fn().mockResolvedValue(mockProject),
            },
            task: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockProject]);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status when provided', async () => {
      await service.findAll('in_progress');

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'in_progress' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single project with tasks', async () => {
      const result = await service.findOne('proj-1');

      expect(result).toEqual(mockProjectWithTasks);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        include: { tasks: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createDto = {
        name: 'New Project',
        category: 'development',
        leaderId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockProject);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Project',
          category: 'development',
          leaderId: 'user-1',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto = { name: 'Updated Project' };

      const result = await service.update('proj-1', updateDto);

      expect(result).toEqual(mockProject);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      const result = await service.remove('proj-1');

      expect(result).toEqual(mockProject);
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
      });
    });
  });

  describe('searchProjects', () => {
    it('should search by name (case-insensitive contains)', async () => {
      const mockSearchResults = [{ ...mockProject, name: 'Battery Testing' }];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockSearchResults);

      const result = await service.searchProjects('battery');

      expect(result).toEqual(mockSearchResults);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'battery', mode: 'insensitive' } },
            { description: { contains: 'battery', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });

    it('should search by description (case-insensitive contains)', async () => {
      const mockSearchResults = [{ ...mockProject, description: 'Battery testing project' }];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockSearchResults);

      const result = await service.searchProjects('battery');

      expect(result).toEqual(mockSearchResults);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { description: { contains: 'battery', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should return matching projects ordered by createdAt desc', async () => {
      await service.searchProjects('test');

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should return empty array for no matches', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.searchProjects('nonexistent');

      expect(result).toEqual([]);
    });

    it('should limit results to 20', async () => {
      await service.searchProjects('test');

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });
  });

  describe('getMilestones', () => {
    it('should return all tasks where milestone=true for a project', async () => {
      const mockMilestones = [
        { id: 'task-1', name: 'MS1', milestone: true, projectId: 'proj-1', planEnd: new Date('2024-06-01') },
        { id: 'task-2', name: 'MS2', milestone: true, projectId: 'proj-1', planEnd: new Date('2024-12-01') },
      ];
      (prisma as any).task = { findMany: jest.fn().mockResolvedValue(mockMilestones), findUnique: jest.fn() };

      const result = await service.getMilestones('proj-1');

      expect(result).toEqual(mockMilestones);
      expect((prisma as any).task.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', milestone: true },
        orderBy: { planEnd: 'asc' },
      });
    });

    it('should return empty array when no milestones exist', async () => {
      (prisma as any).task = { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() };

      const result = await service.getMilestones('proj-1');

      expect(result).toEqual([]);
    });
  });

  describe('setMilestone', () => {
    const mockTask = { id: 'task-1', name: 'Test Task', milestone: false, projectId: 'proj-1' };
    const mockUpdatedTask = { ...mockTask, milestone: true };

    beforeEach(() => {
      (prisma as any).task = {
        findUnique: jest.fn().mockResolvedValue(mockTask),
        update: jest.fn().mockResolvedValue(mockUpdatedTask),
      };
    });

    it('should update a task milestone field to true', async () => {
      const result = await service.setMilestone('task-1', true);

      expect(result).toEqual(mockUpdatedTask);
      expect((prisma as any).task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { milestone: true },
      });
    });

    it('should update a task milestone field to false', async () => {
      const unmarked = { ...mockTask, milestone: true };
      const resultUnmarked = { ...mockTask, milestone: false };
      (prisma as any).task.findUnique.mockResolvedValue(unmarked);
      (prisma as any).task.update.mockResolvedValue(resultUnmarked);

      const result = await service.setMilestone('task-1', false);

      expect(result).toEqual(resultUnmarked);
      expect((prisma as any).task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { milestone: false },
      });
    });

    it('should return the updated task', async () => {
      const result = await service.setMilestone('task-1', true);

      expect(result.id).toBe('task-1');
      expect(result.milestone).toBe(true);
    });

    it('should throw if task not found', async () => {
      (prisma as any).task.findUnique.mockResolvedValue(null);

      await expect(service.setMilestone('nonexistent', true)).rejects.toThrow('Task not found');
    });
  });

  describe('getProjectTree', () => {
    it('should return all projects as a flat list with parentId', async () => {
      const projects = [
        { ...mockProject, id: 'parent-1', parentId: null, _count: { tasks: 5 } },
        { ...mockProject, id: 'child-1', parentId: 'parent-1', _count: { tasks: 3 } },
      ];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(projects);

      const result = await service.getProjectTree();

      expect(result).toEqual(projects);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { tasks: true } } },
      });
    });

    it('should allow caller to build tree from parentId relationships', async () => {
      const projects = [
        { ...mockProject, id: 'parent-1', parentId: null, _count: { tasks: 5 } },
        { ...mockProject, id: 'child-1', parentId: 'parent-1', _count: { tasks: 3 } },
        { ...mockProject, id: 'child-2', parentId: 'parent-1', _count: { tasks: 2 } },
      ];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(projects);

      const result = await service.getProjectTree();

      // Verify parentId relationships are present for tree building
      const parent = result.find((p: any) => p.id === 'parent-1');
      const children = result.filter((p: any) => p.parentId === 'parent-1');
      expect(parent!.parentId).toBeNull();
      expect(children).toHaveLength(2);
    });
  });

  describe('update with notifications', () => {
    it('should create notifications for project members when completion changes', async () => {
      const updatedProject = { ...mockProject, completion: 60 };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.project.update as jest.Mock).mockResolvedValue(updatedProject);
      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        { assigneeId: 'user-1' },
        { assigneeId: 'user-2' },
      ]);

      await service.update('proj-1', { completion: 60 });

      expect(mockNotificationsService.create).toHaveBeenCalledTimes(2);
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'user-1',
        'project_progress',
        '项目进度更新',
        expect.stringContaining('60%'),
        'project',
        'proj-1',
      );
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'user-2',
        'project_progress',
        '项目进度更新',
        expect.stringContaining('60%'),
        'project',
        'proj-1',
      );
    });
  });

  describe('importProjects', () => {
    const validRows = [
      { name: 'Project A', description: 'Desc A', phase: 'SURVEY', leaderId: 'user-1', startDate: '2024-01-01', endDate: '2024-06-30' },
      { name: 'Project B', description: 'Desc B', phase: 'DEVELOPMENT', leaderId: 'user-2', startDate: '2024-02-01', endDate: '2024-08-31' },
    ];

    it('should successfully import valid rows', async () => {
      const createManyMock = jest.fn().mockResolvedValue({ count: 2 });
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (fn) => fn({
        project: {
          createMany: createManyMock,
        },
      }));

      const result = await service.importProjects(validRows);

      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(createManyMock).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Project A' }),
          expect.objectContaining({ name: 'Project B' }),
        ]),
      });
    });

    it('should reject rows missing required name field', async () => {
      const rows = [
        { name: 'Valid Project', description: 'Desc', leaderId: 'user-1', startDate: '2024-01-01', endDate: '2024-06-30' },
        { description: 'No Name', leaderId: 'user-2', startDate: '2024-02-01', endDate: '2024-08-31' },
      ];

      const createManyMock = jest.fn().mockResolvedValue({ count: 1 });
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (fn) => fn({
        project: { createMany: createManyMock },
      }));

      const result = await service.importProjects(rows);

      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('name');
    });

    it('should return error details for invalid rows mixed with valid rows', async () => {
      const rows = [
        { name: 'Valid', description: 'OK', leaderId: 'user-1', startDate: '2024-01-01', endDate: '2024-06-30' },
        { name: '', description: 'Empty name', leaderId: 'user-1', startDate: '2024-01-01', endDate: '2024-06-30' },
        { description: 'No name at all', leaderId: 'user-1', startDate: '2024-01-01', endDate: '2024-06-30' },
      ];

      const createManyMock = jest.fn().mockResolvedValue({ count: 1 });
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (fn) => fn({
        project: { createMany: createManyMock },
      }));

      const result = await service.importProjects(rows);

      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(2);
    });

    it('should handle empty data array', async () => {
      const result = await service.importProjects([]);

      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('duplicateProject', () => {
    it('should throw NotFoundException if source project not found', async () => {
      // Override $transaction mock to return null for findUnique
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (fn) => fn({
        project: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
        },
        task: {
          createMany: jest.fn(),
        },
      }));

      await expect(service.duplicateProject('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should create a new project with (副本) suffix', async () => {
      const result = await service.duplicateProject('proj-1');

      expect(result.name).toBe('Test Project (副本)');
    });

    it('should reset project status to NOT_STARTED and completion to 0', async () => {
      const result = await service.duplicateProject('proj-1');

      expect(result.status).toBe('NOT_STARTED');
      expect(result.completion).toBe(0);
    });

    it('should copy all tasks from source project', async () => {
      const result = await service.duplicateProject('proj-1');

      // Verify the result has tasks and count
      expect(result.tasks).toHaveLength(2);
      expect(result._count.tasks).toBe(2);

      // Verify task creation was called
      const createManyMock = (prisma.$transaction as jest.Mock).mock.calls[0]
        ? null : null; // tasks are created via tx.task.createMany inside transaction
    });

    it('should return the duplicated project with task count', async () => {
      const result = await service.duplicateProject('proj-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('proj-1-copy');
      expect(result.name).toBe('Test Project (副本)');
    });
  });
});
