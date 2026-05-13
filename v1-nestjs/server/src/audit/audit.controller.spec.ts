import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockLog = { id: 'log-1', action: 'create', entityType: 'task', entityId: 'task-1' };
  const mockPaginated = { data: [mockLog], total: 1, page: 1, pageSize: 20 };
  const mockHistory = [mockLog];

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockPaginated),
    getEntityHistory: jest.fn().mockResolvedValue(mockHistory),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return audit logs', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith({
        userId: undefined,
        entityType: undefined,
        entityId: undefined,
        action: undefined,
        page: undefined,
        pageSize: undefined,
      });
      expect(result).toEqual(mockPaginated);
    });

    it('should pass all filters', async () => {
      await controller.findAll('user-1', 'task', 'task-1', 'create', '2', '10');
      expect(service.findAll).toHaveBeenCalledWith({
        userId: 'user-1',
        entityType: 'task',
        entityId: 'task-1',
        action: 'create',
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('getEntityHistory', () => {
    it('should return entity history', async () => {
      const result = await controller.getEntityHistory('task', 'task-1');
      expect(service.getEntityHistory).toHaveBeenCalledWith('task', 'task-1');
      expect(result).toEqual(mockHistory);
    });
  });
});
