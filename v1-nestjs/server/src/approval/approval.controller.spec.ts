import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';

describe('ApprovalController', () => {
  let controller: ApprovalController;
  let service: ApprovalService;

  const mockApproval = { id: 'appr-1', title: 'Approve budget', status: 'pending' };
  const mockPaginated = { data: [mockApproval], total: 1, page: 1, pageSize: 20 };

  const mockService = {
    findAll: jest.fn().mockResolvedValue(mockPaginated),
    findOne: jest.fn().mockResolvedValue(mockApproval),
    create: jest.fn().mockResolvedValue(mockApproval),
    createChain: jest.fn().mockResolvedValue({ ...mockApproval, chain: [] }),
    approve: jest.fn().mockResolvedValue({ ...mockApproval, status: 'approved' }),
    reject: jest.fn().mockResolvedValue({ ...mockApproval, status: 'rejected' }),
    transferApproval: jest.fn().mockResolvedValue({ ...mockApproval, status: 'transferred' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalController],
      providers: [{ provide: ApprovalService, useValue: mockService }],
    }).compile();

    controller = module.get<ApprovalController>(ApprovalController);
    service = module.get<ApprovalService>(ApprovalService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return approvals', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith({
        status: undefined,
        userId: undefined,
        page: undefined,
        pageSize: undefined,
      });
      expect(result).toEqual({ code: 0, ...mockPaginated });
    });

    it('should pass query filters', async () => {
      await controller.findAll('pending', 'user-1', '2', '10');
      expect(service.findAll).toHaveBeenCalledWith({
        status: 'pending',
        userId: 'user-1',
        page: 2,
        pageSize: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return an approval', async () => {
      const result = await controller.findOne('appr-1');
      expect(service.findOne).toHaveBeenCalledWith('appr-1');
      expect(result).toEqual({ code: 0, data: mockApproval });
    });

    it('should propagate not found errors', async () => {
      (service.findOne as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(controller.findOne('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    it('should create an approval', async () => {
      const dto = { title: 'Approve budget' };
      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ code: 0, data: mockApproval });
    });
  });

  describe('createChain', () => {
    it('should create an approval chain', async () => {
      const result = await controller.createChain('appr-1', { approverIds: ['user-1', 'user-2'] });
      expect(service.createChain).toHaveBeenCalledWith('appr-1', ['user-1', 'user-2']);
      expect(result).toEqual({ code: 0, data: { ...mockApproval, chain: [] } });
    });
  });

  describe('approve', () => {
    it('should approve', async () => {
      const result = await controller.approve('appr-1', { approverId: 'user-1' });
      expect(service.approve).toHaveBeenCalledWith('appr-1', 'user-1');
      expect(result).toEqual({ code: 0, data: { ...mockApproval, status: 'approved' } });
    });
  });

  describe('reject', () => {
    it('should reject with comment', async () => {
      const result = await controller.reject('appr-1', { approverId: 'user-1', comment: 'Budget too high' });
      expect(service.reject).toHaveBeenCalledWith('appr-1', 'user-1', 'Budget too high');
      expect(result).toEqual({ code: 0, data: { ...mockApproval, status: 'rejected' } });
    });
  });

  describe('transfer', () => {
    it('should transfer approval', async () => {
      const result = await controller.transfer('appr-1', { fromUserId: 'user-1', toUserId: 'user-2', comment: 'OOTO' });
      expect(service.transferApproval).toHaveBeenCalledWith('appr-1', 'user-1', 'user-2', 'OOTO');
      expect(result).toEqual({ code: 0, data: { ...mockApproval, status: 'transferred' } });
    });
  });
});
