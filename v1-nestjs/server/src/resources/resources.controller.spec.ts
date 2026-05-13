import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

describe('ResourcesController', () => {
  let controller: ResourcesController;
  let service: ResourcesService;

  const mockResource = { id: 'res-1', name: 'Server A', type: 'hardware' };
  const mockPaginated = { data: [mockResource], total: 1, page: 1, pageSize: 20 };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockPaginated),
    getTypes: jest.fn().mockResolvedValue(['hardware', 'software']),
    getByType: jest.fn().mockResolvedValue([mockResource]),
    findOne: jest.fn().mockResolvedValue(mockResource),
    create: jest.fn().mockResolvedValue(mockResource),
    update: jest.fn().mockResolvedValue(mockResource),
    remove: jest.fn().mockResolvedValue(mockResource),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useValue: mockService }],
    }).compile();

    controller = module.get<ResourcesController>(ResourcesController);
    service = module.get<ResourcesService>(ResourcesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated resources', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith({ type: undefined, status: undefined, page: undefined, pageSize: undefined });
      expect(result).toEqual({ code: 0, ...mockPaginated });
    });

    it('should pass filters', async () => {
      await controller.findAll('hardware', 'available', '2', '10');
      expect(service.findAll).toHaveBeenCalledWith({ type: 'hardware', status: 'available', page: 2, pageSize: 10 });
    });
  });

  describe('getTypes', () => {
    it('should return resource types', async () => {
      const result = await controller.getTypes();
      expect(service.getTypes).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: ['hardware', 'software'] });
    });
  });

  describe('getByType', () => {
    it('should return resources by type', async () => {
      const result = await controller.getByType('hardware');
      expect(service.getByType).toHaveBeenCalledWith('hardware');
      expect(result).toEqual({ code: 0, data: [mockResource] });
    });
  });

  describe('findOne', () => {
    it('should return a resource', async () => {
      const result = await controller.findOne('res-1');
      expect(service.findOne).toHaveBeenCalledWith('res-1');
      expect(result).toEqual({ code: 0, data: mockResource });
    });

    it('should propagate not found errors', async () => {
      (service.findOne as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(controller.findOne('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create a resource', async () => {
      const dto = { name: 'Server A', type: 'hardware' };
      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ code: 0, data: mockResource });
    });
  });

  describe('update', () => {
    it('should update a resource', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update('res-1', dto as any);
      expect(service.update).toHaveBeenCalledWith('res-1', dto);
      expect(result).toEqual({ code: 0, data: mockResource });
    });
  });

  describe('remove', () => {
    it('should delete a resource', async () => {
      const result = await controller.remove('res-1');
      expect(service.remove).toHaveBeenCalledWith('res-1');
      expect(result).toEqual({ code: 0, data: mockResource });
    });
  });
});
