import { Test, TestingModule } from '@nestjs/testing';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

describe('QueryController', () => {
  let controller: QueryController;
  let service: QueryService;

  const mockStats = { total: 100, byStatus: { todo: 30, done: 70 } };
  const mockCsv = 'id,title\ntask-1,Test';

  const mockService = {
    getTaskStats: jest.fn().mockResolvedValue(mockStats),
    getProjectStats: jest.fn().mockResolvedValue(mockStats),
    getOverdueTasks: jest.fn().mockResolvedValue([{ id: 'task-1', overdue: true }]),
    getProjectProgress: jest.fn().mockResolvedValue({ progress: 75 }),
    getUserWorkload: jest.fn().mockResolvedValue({ tasks: 5, hours: 40 }),
    getDepartmentStats: jest.fn().mockResolvedValue({ members: 10 }),
    exportTasks: jest.fn().mockResolvedValue(mockCsv),
    exportProjects: jest.fn().mockResolvedValue(mockCsv),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueryController],
      providers: [{ provide: QueryService, useValue: mockService }],
    }).compile();

    controller = module.get<QueryController>(QueryController);
    service = module.get<QueryService>(QueryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTaskStats', () => {
    it('should return task stats', async () => {
      const result = await controller.getTaskStats();
      expect(service.getTaskStats).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: mockStats });
    });
  });

  describe('getProjectStats', () => {
    it('should return project stats', async () => {
      const result = await controller.getProjectStats();
      expect(service.getProjectStats).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: mockStats });
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks', async () => {
      const result = await controller.getOverdueTasks();
      expect(service.getOverdueTasks).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: [{ id: 'task-1', overdue: true }] });
    });
  });

  describe('getProjectProgress', () => {
    it('should return project progress', async () => {
      const result = await controller.getProjectProgress('proj-1');
      expect(service.getProjectProgress).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual({ code: 0, data: { progress: 75 } });
    });
  });

  describe('getUserWorkload', () => {
    it('should return user workload', async () => {
      const result = await controller.getUserWorkload('user-1');
      expect(service.getUserWorkload).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ code: 0, data: { tasks: 5, hours: 40 } });
    });
  });

  describe('getDepartmentStats', () => {
    it('should return department stats', async () => {
      const result = await controller.getDepartmentStats('dept-1');
      expect(service.getDepartmentStats).toHaveBeenCalledWith('dept-1');
      expect(result).toEqual({ code: 0, data: { members: 10 } });
    });
  });

  describe('exportTasks', () => {
    it('should export tasks as CSV', async () => {
      const result = await controller.exportTasks('proj-1', 'done', 'high');
      expect(service.exportTasks).toHaveBeenCalledWith({ projectId: 'proj-1', status: 'done', priority: 'high' });
      expect(result).toEqual(mockCsv);
    });
  });

  describe('exportProjects', () => {
    it('should export projects as CSV', async () => {
      const result = await controller.exportProjects('active');
      expect(service.exportProjects).toHaveBeenCalledWith({ status: 'active' });
      expect(result).toEqual(mockCsv);
    });
  });
});
