import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

describe('ActivityController', () => {
  let controller: ActivityController;
  let service: ActivityService;

  const mockActivities = { data: [{ id: 'act-1', action: 'created' }], total: 1, page: 1, pageSize: 20 };

  const mockService = {
    getByProject: jest.fn().mockResolvedValue(mockActivities),
    getByUser: jest.fn().mockResolvedValue(mockActivities),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
      providers: [{ provide: ActivityService, useValue: mockService }],
    }).compile();

    controller = module.get<ActivityController>(ActivityController);
    service = module.get<ActivityService>(ActivityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return empty result when no filter', () => {
    const result = controller.findActivities();
    expect(result).toEqual({ data: [], total: 0, page: 1, pageSize: 20 });
  });

  it('should return activities by project', async () => {
    const result = await controller.findActivities('proj-1');
    expect(service.getByProject).toHaveBeenCalledWith('proj-1', { page: undefined, pageSize: undefined });
    expect(result).toEqual(mockActivities);
  });

  it('should return activities by user', async () => {
    const result = await controller.findActivities(undefined, 'user-1');
    expect(service.getByUser).toHaveBeenCalledWith('user-1', { page: undefined, pageSize: undefined });
    expect(result).toEqual(mockActivities);
  });

  it('should pass pagination', () => {
    controller.findActivities('proj-1', undefined, '2', '10');
    expect(service.getByProject).toHaveBeenCalledWith('proj-1', { page: 2, pageSize: 10 });
  });

  it('should propagate errors', () => {
    (service.getByProject as jest.Mock).mockImplementationOnce(() => { throw new Error('DB error'); });
    expect(() => controller.findActivities('proj-1')).toThrow('DB error');
  });
});
