import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTask = { id: 'task-1', title: 'Test Task', status: 'todo' };
  const mockPaginatedResult = {
    data: [mockTask],
    total: 1,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
    findOne: jest.fn().mockResolvedValue(mockTask),
    create: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    remove: jest.fn().mockResolvedValue(mockTask),
    getDependencies: jest.fn().mockResolvedValue([]),
    addDependency: jest.fn().mockResolvedValue(mockTask),
    removeDependency: jest.fn().mockResolvedValue(mockTask),
    getTags: jest.fn().mockResolvedValue(['tag1']),
    addTag: jest.fn().mockResolvedValue(mockTask),
    removeTag: jest.fn().mockResolvedValue(mockTask),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith({
        status: undefined,
        priority: undefined,
        keyword: undefined,
        projectId: undefined,
        parentId: undefined,
        rootOnly: false,
        page: undefined,
        pageSize: undefined,
      });
      expect(result).toEqual({ code: 0, ...mockPaginatedResult });
    });

    it('should pass query filters', async () => {
      await controller.findAll('done', 'high', 'bug', 'proj-1', 'parent-1', 'true', '2', '10');
      expect(service.findAll).toHaveBeenCalledWith({
        status: 'done',
        priority: 'high',
        keyword: 'bug',
        projectId: 'proj-1',
        parentId: 'parent-1',
        rootOnly: true,
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const result = await controller.findOne('task-1');
      expect(service.findOne).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({ code: 0, data: mockTask });
    });

    it('should propagate service errors', async () => {
      (service.findOne as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(controller.findOne('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto = { title: 'New Task' };
      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ code: 0, data: mockTask });
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const dto = { title: 'Updated' };
      const result = await controller.update('task-1', dto as any);
      expect(service.update).toHaveBeenCalledWith('task-1', dto);
      expect(result).toEqual({ code: 0, data: mockTask });
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      const result = await controller.remove('task-1');
      expect(service.remove).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({ code: 0, data: mockTask });
    });
  });

  describe('getDependencies', () => {
    it('should return dependencies', async () => {
      const result = await controller.getDependencies('task-1');
      expect(service.getDependencies).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({ code: 0, data: [] });
    });
  });

  describe('addDependency', () => {
    it('should add a dependency', async () => {
      const result = await controller.addDependency('task-1', { dependencyId: 'dep-1' });
      expect(service.addDependency).toHaveBeenCalledWith('task-1', 'dep-1', undefined);
      expect(result).toEqual({ code: 0, data: mockTask });
    });
  });

  describe('removeDependency', () => {
    it('should remove a dependency', async () => {
      const result = await controller.removeDependency('task-1', 'dep-1');
      expect(service.removeDependency).toHaveBeenCalledWith('task-1', 'dep-1');
      expect(result).toEqual({ code: 0, data: mockTask });
    });
  });

  describe('getTags', () => {
    it('should return tags', async () => {
      const result = await controller.getTags('task-1');
      expect(service.getTags).toHaveBeenCalledWith('task-1');
      expect(result).toEqual({ code: 0, data: ['tag1'] });
    });
  });

  describe('addTag', () => {
    it('should add a tag', async () => {
      const result = await controller.addTag('task-1', { tag: 'urgent' });
      expect(service.addTag).toHaveBeenCalledWith('task-1', 'urgent');
      expect(result).toEqual({ code: 0, data: mockTask });
    });
  });

  describe('removeTag', () => {
    it('should remove a tag', async () => {
      const result = await controller.removeTag('task-1', 'urgent');
      expect(service.removeTag).toHaveBeenCalledWith('task-1', 'urgent');
      expect(result).toEqual({ code: 0, data: mockTask });
    });
  });
});
