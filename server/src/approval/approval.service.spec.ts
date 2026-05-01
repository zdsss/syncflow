import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let prisma: PrismaService;

  const mockApproval = {
    id: 'approval-1',
    type: 'task_complete',
    targetId: 'task-1',
    targetType: 'task',
    status: 'pending',
    applicantId: 'user-1',
    approverId: null,
    comment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    approval: {
      findMany: jest.fn().mockResolvedValue([mockApproval]),
      findUnique: jest.fn().mockResolvedValue(mockApproval),
      create: jest.fn().mockResolvedValue(mockApproval),
      update: jest.fn().mockImplementation((args) =>
        Promise.resolve({ ...mockApproval, ...args.data }),
      ),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all approvals', async () => {
      const result = await service.findAll({});
      expect(result).toEqual([mockApproval]);
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'pending' });
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        }),
      );
    });

    it('should filter by userId', async () => {
      await service.findAll({ userId: 'user-1' });
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ applicantId: 'user-1' }, { approverId: 'user-1' }],
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single approval', async () => {
      const result = await service.findOne('approval-1');
      expect(result).toEqual(mockApproval);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an approval with pending status', async () => {
      const dto = {
        type: 'task_complete',
        targetId: 'task-1',
        targetType: 'task',
        applicantId: 'user-1',
      };

      const result = await service.create(dto);
      expect(result).toEqual(mockApproval);
      expect(prisma.approval.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'pending' }),
      });
    });
  });

  describe('approve', () => {
    it('should set status to approved and approverId', async () => {
      const result = await service.approve('approval-1', 'user-2');
      expect(result.status).toBe('approved');
      expect(result.approverId).toBe('user-2');
    });

    it('should throw BadRequestException when already approved', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'approved',
      });
      await expect(service.approve('approval-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when already rejected', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'rejected',
      });
      await expect(service.approve('approval-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('should set status to rejected with comment', async () => {
      const result = await service.reject('approval-1', 'user-2', 'Not meeting requirements');
      expect(result.status).toBe('rejected');
      expect(result.approverId).toBe('user-2');
      expect(result.comment).toBe('Not meeting requirements');
    });

    it('should throw BadRequestException when already rejected', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'rejected',
      });
      await expect(service.reject('approval-1', 'user-2', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when already approved', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'approved',
      });
      await expect(service.reject('approval-1', 'user-2', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when comment is missing', async () => {
      await expect(service.reject('approval-1', 'user-2', '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
