import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let prisma: PrismaService;
  let wsService: WebSocketService;

  const mockApproval = {
    id: 'approval-1',
    type: 'task_complete',
    targetId: 'task-1',
    targetType: 'task',
    status: 'PENDING',
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
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(mockApproval),
      update: jest.fn().mockImplementation((args) =>
        Promise.resolve({ ...mockApproval, ...args.data }),
      ),
    },
    approvalChain: {
      createMany: jest.fn().mockResolvedValue({ count: 3 }),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        return fn(mockPrisma);
      }
      return Promise.all(fn);
    }),
  };

  const mockWsService = {
    emitTaskStatusChanged: jest.fn(),
    emitTaskAssigned: jest.fn(),
    emitNotification: jest.fn(),
    emitApprovalUpdated: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WebSocketService, useValue: mockWsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ApprovalService>(ApprovalService);
    prisma = module.get<PrismaService>(PrismaService);
    wsService = module.get<WebSocketService>(WebSocketService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all approvals', async () => {
      const result = await service.findAll({});
      expect(result.data).toEqual([mockApproval]);
      expect(result.total).toBe(1);
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

    it('should paginate with default page=1 and pageSize=20', async () => {
      const result = await service.findAll({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should paginate with custom page and pageSize', async () => {
      (prisma.approval.count as jest.Mock).mockResolvedValueOnce(100);
      const result = await service.findAll({ page: 3, pageSize: 10 });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(10);
      expect(prisma.approval.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
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
        data: expect.objectContaining({ status: 'PENDING' }),
      });
    });
  });

  describe('approve', () => {
    it('should set status to approved and approverId', async () => {
      const result = await service.approve('approval-1', 'user-2');
      expect(result.status).toBe('APPROVED');
      expect(result.approverId).toBe('user-2');
    });

    it('should throw BadRequestException when already approved', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'APPROVED',
      });
      await expect(service.approve('approval-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when already rejected', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'REJECTED',
      });
      await expect(service.approve('approval-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('should set status to rejected with comment', async () => {
      const result = await service.reject('approval-1', 'user-2', 'Not meeting requirements');
      expect(result.status).toBe('REJECTED');
      expect(result.approverId).toBe('user-2');
      expect(result.comment).toBe('Not meeting requirements');
    });

    it('should throw BadRequestException when already rejected', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'REJECTED',
      });
      await expect(service.reject('approval-1', 'user-2', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when already approved', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'APPROVED',
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

  describe('WebSocket integration', () => {
    it('should emit approval:updated when approval is approved', async () => {
      await service.approve('approval-1', 'user-2');

      expect(wsService.emitApprovalUpdated).toHaveBeenCalledWith(
        'approval-1',
        'APPROVED',
      );
    });

    it('should emit approval:updated when approval is rejected', async () => {
      await service.reject('approval-1', 'user-2', 'Not meeting requirements');

      expect(wsService.emitApprovalUpdated).toHaveBeenCalledWith(
        'approval-1',
        'REJECTED',
      );
    });
  });

  describe('createChain', () => {
    it('should create ordered chain steps from an array of approver IDs', async () => {
      const approverIds = ['approver-1', 'approver-2', 'approver-3'];

      const result = await service.createChain('approval-1', approverIds);

      expect(mockPrisma.approvalChain.createMany).toHaveBeenCalledWith({
        data: [
          { approvalId: 'approval-1', stepOrder: 1, approverId: 'approver-1', status: 'pending' },
          { approvalId: 'approval-1', stepOrder: 2, approverId: 'approver-2', status: 'pending' },
          { approvalId: 'approval-1', stepOrder: 3, approverId: 'approver-3', status: 'pending' },
        ],
      });
      expect(result).toEqual({ count: 3 });
    });

    it('should throw BadRequestException if approvers array is empty', async () => {
      await expect(service.createChain('approval-1', [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if approval does not exist', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.createChain('nonexistent', ['approver-1']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveStep', () => {
    const mockChainSteps = [
      { id: 'chain-1', approvalId: 'approval-1', stepOrder: 1, approverId: 'approver-1', status: 'pending', comment: null, actedAt: null },
      { id: 'chain-2', approvalId: 'approval-1', stepOrder: 2, approverId: 'approver-2', status: 'pending', comment: null, actedAt: null },
      { id: 'chain-3', approvalId: 'approval-1', stepOrder: 3, approverId: 'approver-3', status: 'pending', comment: null, actedAt: null },
    ];

    it('should mark the current pending step as approved', async () => {
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce(mockChainSteps);

      const updatedStep = { ...mockChainSteps[0], status: 'approved', actedAt: new Date(), comment: 'Looks good' };
      mockPrisma.approvalChain.update.mockResolvedValueOnce(updatedStep);

      // Transaction mock: the callback receives tx which is effectively the same mock
      mockPrisma.$transaction.mockImplementationOnce(async (fn) => {
        const tx = {
          approvalChain: {
            update: jest.fn().mockResolvedValue(updatedStep),
            count: jest.fn().mockResolvedValue(1), // only 1 approved step, not the last
          },
          approval: {
            update: jest.fn(),
          },
        };
        return fn(tx);
      });

      const result = await service.approveStep('approval-1', 'approver-1', 'Looks good');
      expect(result.step.status).toBe('approved');
      expect(result.approvalApproved).toBe(false);
    });

    it('should mark the entire approval as approved when the last step is approved', async () => {
      const lastStep = { ...mockChainSteps[2], status: 'pending' };
      const updatedLastStep = { ...lastStep, status: 'approved', actedAt: new Date() };

      mockPrisma.approvalChain.findMany.mockResolvedValueOnce(mockChainSteps);

      mockPrisma.$transaction.mockImplementationOnce(async (fn) => {
        const tx = {
          approvalChain: {
            update: jest.fn().mockResolvedValue(updatedLastStep),
            count: jest.fn().mockResolvedValue(3), // all 3 approved = last step
          },
          approval: {
            update: jest.fn().mockResolvedValue({ ...mockApproval, status: 'APPROVED' }),
          },
        };
        return fn(tx);
      });

      const result = await service.approveStep('approval-1', 'approver-3');
      expect(result.approvalApproved).toBe(true);
    });

    it('should throw if the step is already acted upon', async () => {
      const actedSteps = [
        { ...mockChainSteps[0], status: 'approved' },
        { ...mockChainSteps[1], status: 'pending' },
        { ...mockChainSteps[2], status: 'pending' },
      ];
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce(actedSteps);

      // approver-1's step is already approved
      await expect(
        service.approveStep('approval-1', 'approver-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if approver has no step in the chain', async () => {
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce(mockChainSteps);

      await expect(
        service.approveStep('approval-1', 'unknown-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if no chain exists for the approval', async () => {
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce([]);

      await expect(
        service.approveStep('approval-1', 'approver-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectStep', () => {
    const mockChainSteps = [
      { id: 'chain-1', approvalId: 'approval-1', stepOrder: 1, approverId: 'approver-1', status: 'pending', comment: null, actedAt: null },
      { id: 'chain-2', approvalId: 'approval-1', stepOrder: 2, approverId: 'approver-2', status: 'pending', comment: null, actedAt: null },
    ];

    it('should mark the step as rejected and reject the entire approval', async () => {
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce(mockChainSteps);

      const rejectedStep = { ...mockChainSteps[0], status: 'rejected', comment: 'Not good enough', actedAt: new Date() };

      mockPrisma.$transaction.mockImplementationOnce(async (fn) => {
        const tx = {
          approvalChain: {
            update: jest.fn().mockResolvedValue(rejectedStep),
          },
          approval: {
            update: jest.fn().mockResolvedValue({ ...mockApproval, status: 'REJECTED' }),
          },
        };
        return fn(tx);
      });

      const result = await service.rejectStep('approval-1', 'approver-1', 'Not good enough');
      expect(result.step.status).toBe('rejected');
      expect(result.approvalRejected).toBe(true);
    });

    it('should throw if comment is missing', async () => {
      await expect(
        service.rejectStep('approval-1', 'approver-1', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if the step is already acted upon', async () => {
      const actedSteps = [
        { ...mockChainSteps[0], status: 'approved' },
        { ...mockChainSteps[1], status: 'pending' },
      ];
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce(actedSteps);

      await expect(
        service.rejectStep('approval-1', 'approver-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if no chain exists for the approval', async () => {
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce([]);

      await expect(
        service.rejectStep('approval-1', 'approver-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if approver has no step in the chain', async () => {
      mockPrisma.approvalChain.findMany.mockResolvedValueOnce(mockChainSteps);

      await expect(
        service.rejectStep('approval-1', 'unknown-user', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('transferApproval', () => {
    it('should update the approverId to toUserId', async () => {
      const result = await service.transferApproval('approval-1', 'user-1', 'user-3');
      expect(result.approverId).toBe('user-3');
      expect(mockPrisma.approval.update).toHaveBeenCalledWith({
        where: { id: 'approval-1' },
        data: { approverId: 'user-3' },
      });
    });

    it('should create a notification for toUserId', async () => {
      await service.transferApproval('approval-1', 'user-1', 'user-3');
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        'user-3',
        'approval_transferred',
        '审批已转交给您',
        expect.any(String),
        'approval',
        'approval-1',
      );
    });

    it('should return the updated approval', async () => {
      const result = await service.transferApproval('approval-1', 'user-1', 'user-3');
      expect(result).toBeDefined();
      expect(result.approverId).toBe('user-3');
    });

    it('should throw NotFoundException if approval not found', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.transferApproval('nonexistent', 'user-1', 'user-3'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if approval is not pending', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'APPROVED',
      });
      await expect(
        service.transferApproval('approval-1', 'user-1', 'user-3'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for REJECTED status', async () => {
      mockPrisma.approval.findUnique.mockResolvedValueOnce({
        ...mockApproval,
        status: 'REJECTED',
      });
      await expect(
        service.transferApproval('approval-1', 'user-1', 'user-3'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Notification integration', () => {
    it('should send notification to approver when approval is created', async () => {
      const dto = {
        type: 'task_complete',
        targetId: 'task-1',
        targetType: 'task',
        applicantId: 'user-1',
      };

      await service.create(dto);

      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.any(String),
        'approval_pending',
        'New approval request',
        expect.any(String),
        'approval',
        mockApproval.id,
      );
    });

    it('should send notification to applicant when approval is approved', async () => {
      await service.approve('approval-1', 'user-2');

      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        mockApproval.applicantId,
        'approval_approved',
        'Your request was approved',
        expect.any(String),
        'approval',
        'approval-1',
      );
    });

    it('should send notification to applicant when approval is rejected', async () => {
      await service.reject('approval-1', 'user-2', 'Not meeting requirements');

      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        mockApproval.applicantId,
        'approval_rejected',
        'Your request was rejected',
        expect.any(String),
        'approval',
        'approval-1',
      );
    });
  });

  describe('Audit integration', () => {
    it('should create an audit log when approval is approved', async () => {
      await service.approve('approval-1', 'user-2');

      expect(mockAuditService.log).toHaveBeenCalledWith('user-2', 'approve', 'approval', 'approval-1', {
        previousStatus: 'PENDING',
        newStatus: 'APPROVED',
      });
    });

    it('should create an audit log when approval is rejected', async () => {
      await service.reject('approval-1', 'user-2', 'Not meeting requirements');

      expect(mockAuditService.log).toHaveBeenCalledWith('user-2', 'reject', 'approval', 'approval-1', {
        previousStatus: 'PENDING',
        newStatus: 'REJECTED',
        comment: 'Not meeting requirements',
      });
    });
  });
});
