import { Test, TestingModule } from '@nestjs/testing';
import { ProcessController } from './process.controller';
import { ProcessService } from './process.service';

describe('ProcessController', () => {
  let controller: ProcessController;
  let service: ProcessService;

  const mockRoute = { id: 'route-1', name: 'Assembly Line' };
  const mockStep = { id: 'step-1', name: 'Step 1', sortOrder: 1 };
  const mockVersion = { id: 'v1', version: '1.0' };
  const mockParams = [{ name: 'Temperature', targetValue: 100 }];

  const mockService = {
    findAll: jest.fn().mockResolvedValue([mockRoute]),
    findOne: jest.fn().mockResolvedValue(mockRoute),
    create: jest.fn().mockResolvedValue(mockRoute),
    update: jest.fn().mockResolvedValue(mockRoute),
    remove: jest.fn().mockResolvedValue(mockRoute),
    addStep: jest.fn().mockResolvedValue(mockStep),
    removeStep: jest.fn().mockResolvedValue(mockStep),
    reorderSteps: jest.fn().mockResolvedValue([mockStep]),
    getStepParameters: jest.fn().mockResolvedValue(mockParams),
    updateStepParameters: jest.fn().mockResolvedValue(mockParams),
    createVersion: jest.fn().mockResolvedValue(mockVersion),
    getVersions: jest.fn().mockResolvedValue([mockVersion]),
    publishVersion: jest.fn().mockResolvedValue(mockVersion),
    getRouteVisualization: jest.fn().mockResolvedValue({ nodes: [], edges: [] }),
    getRouteStats: jest.fn().mockResolvedValue({ totalSteps: 3 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessController],
      providers: [{ provide: ProcessService, useValue: mockService }],
    }).compile();

    controller = module.get<ProcessController>(ProcessController);
    service = module.get<ProcessService>(ProcessService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return routes by project', async () => {
      const result = await controller.findAll('proj-1');
      expect(service.findAll).toHaveBeenCalledWith('proj-1');
      expect(result).toEqual({ code: 0, data: [mockRoute] });
    });
  });

  describe('findOne', () => {
    it('should return a route', async () => {
      const result = await controller.findOne('route-1');
      expect(service.findOne).toHaveBeenCalledWith('route-1');
      expect(result).toEqual({ code: 0, data: mockRoute });
    });

    it('should propagate not found errors', async () => {
      (service.findOne as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(controller.findOne('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create a route', async () => {
      const dto = { name: 'New Route', projectId: 'proj-1' };
      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ code: 0, data: mockRoute });
    });
  });

  describe('update', () => {
    it('should update a route', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update('route-1', dto as any);
      expect(service.update).toHaveBeenCalledWith('route-1', dto);
      expect(result).toEqual({ code: 0, data: mockRoute });
    });
  });

  describe('addStep', () => {
    it('should add a step', async () => {
      const dto = { name: 'Step 1', sortOrder: 1 };
      const result = await controller.addStep('route-1', dto as any);
      expect(service.addStep).toHaveBeenCalledWith('route-1', dto);
      expect(result).toEqual({ code: 0, data: mockStep });
    });
  });

  describe('remove', () => {
    it('should delete a route', async () => {
      const result = await controller.remove('route-1');
      expect(service.remove).toHaveBeenCalledWith('route-1');
      expect(result).toEqual({ code: 0, data: mockRoute });
    });
  });

  describe('removeStep', () => {
    it('should remove a step', async () => {
      const result = await controller.removeStep('route-1', 'step-1');
      expect(service.removeStep).toHaveBeenCalledWith('route-1', 'step-1');
      expect(result).toEqual(mockStep);
    });
  });

  describe('reorderSteps', () => {
    it('should reorder steps', async () => {
      const body = [{ id: 'step-1', sortOrder: 2 }];
      const result = await controller.reorderSteps('route-1', body);
      expect(service.reorderSteps).toHaveBeenCalledWith('route-1', body);
      expect(result).toEqual([mockStep]);
    });
  });

  describe('getStepParameters', () => {
    it('should return step parameters', async () => {
      const result = await controller.getStepParameters('route-1', 'step-1');
      expect(service.getStepParameters).toHaveBeenCalledWith('route-1', 'step-1');
      expect(result).toEqual({ code: 0, data: mockParams });
    });
  });

  describe('updateStepParameters', () => {
    it('should update step parameters', async () => {
      const body = [{ name: 'Temp', targetValue: 100 }];
      const result = await controller.updateStepParameters('route-1', 'step-1', body as any);
      expect(service.updateStepParameters).toHaveBeenCalledWith('route-1', 'step-1', body);
      expect(result).toEqual({ code: 0, data: mockParams });
    });
  });

  describe('createVersion', () => {
    it('should create a version', async () => {
      const result = await controller.createVersion('route-1', { description: 'v1' });
      expect(service.createVersion).toHaveBeenCalledWith('route-1', 'v1');
      expect(result).toEqual({ code: 0, data: mockVersion });
    });
  });

  describe('getVersions', () => {
    it('should return versions', async () => {
      const result = await controller.getVersions('route-1');
      expect(service.getVersions).toHaveBeenCalledWith('route-1');
      expect(result).toEqual({ code: 0, data: [mockVersion] });
    });
  });

  describe('publishVersion', () => {
    it('should publish a version', async () => {
      const result = await controller.publishVersion('route-1', 'v1');
      expect(service.publishVersion).toHaveBeenCalledWith('route-1', 'v1');
      expect(result).toEqual({ code: 0, data: mockVersion });
    });
  });

  describe('getRouteVisualization', () => {
    it('should return visualization', async () => {
      const result = await controller.getRouteVisualization('route-1');
      expect(service.getRouteVisualization).toHaveBeenCalledWith('route-1');
      expect(result).toEqual({ code: 0, data: { nodes: [], edges: [] } });
    });
  });

  describe('getRouteStats', () => {
    it('should return stats', async () => {
      const result = await controller.getRouteStats('route-1');
      expect(service.getRouteStats).toHaveBeenCalledWith('route-1');
      expect(result).toEqual({ code: 0, data: { totalSteps: 3 } });
    });
  });
});
