import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private wsService: WebSocketService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  async findAll(query: { status?: string; userId?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.userId) {
      where.OR = [
        { applicantId: query.userId },
        { approverId: query.userId },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.approval.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approval.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) {
      throw new NotFoundException('Approval not found');
    }
    return approval;
  }

  async create(data: {
    type: string;
    targetId: string;
    targetType: string;
    applicantId: string;
    comment?: string;
  }) {
    const approval = await this.prisma.approval.create({
      data: {
        type: data.type,
        targetId: data.targetId,
        targetType: data.targetType,
        applicantId: data.applicantId,
        comment: data.comment,
        status: 'PENDING',
      },
    });

    // Notify the applicant that a new approval request has been created
    await this.notificationsService.create(
      data.applicantId,
      'approval_pending',
      'New approval request',
      `Your ${data.type} approval request has been submitted and is pending review`,
      'approval',
      approval.id,
    );

    return approval;
  }

  async approve(id: string, approverId: string) {
    const approval = await this.findOne(id);

    if (approval.status === 'APPROVED') {
      throw new BadRequestException('Approval already approved');
    }

    if (approval.status === 'REJECTED') {
      throw new BadRequestException('Cannot approve a rejected approval');
    }

    // If a chain exists, delegate to approveStep
    const chain = await this.prisma.approvalChain.findMany({
      where: { approvalId: id },
      orderBy: { stepOrder: 'asc' },
    });

    if (chain.length > 0) {
      const result = await this.approveStep(id, approverId);
      return {
        ...approval,
        status: result.approvalApproved ? 'APPROVED' : 'PENDING',
        approverId: result.approvalApproved ? approverId : approval.approverId,
      };
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: 'APPROVED', approverId },
    });

    this.wsService.emitApprovalUpdated(id, 'APPROVED');

    await this.auditService.log(approverId, 'approve', 'approval', id, {
      previousStatus: approval.status,
      newStatus: 'APPROVED',
    });

    await this.notificationsService.create(
      approval.applicantId,
      'approval_approved',
      'Your request was approved',
      `Your ${approval.type} request has been approved`,
      'approval',
      id,
    );

    return updated;
  }

  async reject(id: string, approverId: string, comment: string) {
    const approval = await this.findOne(id);

    if (approval.status === 'REJECTED') {
      throw new BadRequestException('Approval already rejected');
    }

    if (approval.status === 'APPROVED') {
      throw new BadRequestException('Cannot reject an approved approval');
    }

    if (!comment) {
      throw new BadRequestException('Comment is required for rejection');
    }

    // If a chain exists, delegate to rejectStep
    const chain = await this.prisma.approvalChain.findMany({
      where: { approvalId: id },
      orderBy: { stepOrder: 'asc' },
    });

    if (chain.length > 0) {
      const result = await this.rejectStep(id, approverId, comment);
      return {
        ...approval,
        status: 'REJECTED',
        approverId,
        comment,
      };
    }

    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: 'REJECTED', approverId, comment },
    });

    this.wsService.emitApprovalUpdated(id, 'REJECTED');

    await this.auditService.log(approverId, 'reject', 'approval', id, {
      previousStatus: approval.status,
      newStatus: 'REJECTED',
      comment,
    });

    await this.notificationsService.create(
      approval.applicantId,
      'approval_rejected',
      'Your request was rejected',
      `Your ${approval.type} request has been rejected: ${comment}`,
      'approval',
      id,
    );

    return updated;
  }

  async createChain(approvalId: string, approverIds: string[]) {
    if (!approverIds || approverIds.length === 0) {
      throw new BadRequestException('Approvers array must not be empty');
    }

    await this.findOne(approvalId);

    const data = approverIds.map((approverId, index) => ({
      approvalId,
      stepOrder: index + 1,
      approverId,
      status: 'pending',
    }));

    return this.prisma.approvalChain.createMany({ data });
  }

  async approveStep(
    approvalId: string,
    approverId: string,
    comment?: string,
  ) {
    const chain = await this.prisma.approvalChain.findMany({
      where: { approvalId },
      orderBy: { stepOrder: 'asc' },
    });

    if (chain.length === 0) {
      throw new BadRequestException('No approval chain found for this approval');
    }

    const step = chain.find(
      (s) => s.approverId === approverId && s.status === 'pending',
    );

    if (!step) {
      // Check if the approver exists in the chain at all
      const existingStep = chain.find((s) => s.approverId === approverId);
      if (!existingStep) {
        throw new NotFoundException('Approver not found in the approval chain');
      }
      // The step exists but is already acted upon
      throw new BadRequestException('This approval step has already been acted upon');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedStep = await tx.approvalChain.update({
        where: { id: step.id },
        data: {
          status: 'approved',
          comment: comment || null,
          actedAt: new Date(),
        },
      });

      // Check if this is the last step
      const approvedCount = await tx.approvalChain.count({
        where: { approvalId, status: 'approved' },
      });

      const isLastStep = approvedCount === chain.length;
      let approvalApproved = false;

      if (isLastStep) {
        await tx.approval.update({
          where: { id: approvalId },
          data: { status: 'APPROVED', approverId },
        });
        approvalApproved = true;
        this.wsService.emitApprovalUpdated(approvalId, 'APPROVED');
      }

      return { step: updatedStep, approvalApproved };
    });

    return result;
  }

  async transferApproval(approvalId: string, fromUserId: string, toUserId: string, comment?: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id: approvalId } });
    if (!approval) throw new NotFoundException('Approval not found');
    if (approval.status !== 'PENDING') throw new BadRequestException('Can only transfer pending approvals');

    const updated = await this.prisma.approval.update({
      where: { id: approvalId },
      data: { approverId: toUserId },
    });

    // Notify new approver
    await this.notificationsService.create(
      toUserId,
      'approval_transferred',
      '审批已转交给您',
      comment || '有一个审批已转交给您，请及时处理',
      'approval',
      approvalId,
    );

    return updated;
  }

  async rejectStep(
    approvalId: string,
    approverId: string,
    comment: string,
  ) {
    if (!comment) {
      throw new BadRequestException('Comment is required for rejection');
    }

    const chain = await this.prisma.approvalChain.findMany({
      where: { approvalId },
      orderBy: { stepOrder: 'asc' },
    });

    if (chain.length === 0) {
      throw new BadRequestException('No approval chain found for this approval');
    }

    const step = chain.find(
      (s) => s.approverId === approverId && s.status === 'pending',
    );

    if (!step) {
      const existingStep = chain.find((s) => s.approverId === approverId);
      if (!existingStep) {
        throw new NotFoundException('Approver not found in the approval chain');
      }
      throw new BadRequestException('This approval step has already been acted upon');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedStep = await tx.approvalChain.update({
        where: { id: step.id },
        data: {
          status: 'rejected',
          comment,
          actedAt: new Date(),
        },
      });

      // Rejection at any step rejects the entire approval
      const approval = await tx.approval.update({
        where: { id: approvalId },
        data: { status: 'REJECTED', approverId, comment },
      });

      return { step: updatedStep, approvalRejected: true };
    });

    this.wsService.emitApprovalUpdated(approvalId, 'REJECTED');

    return result;
  }
}
