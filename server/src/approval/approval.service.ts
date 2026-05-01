import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { status?: string; userId?: string }) {
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

    return this.prisma.approval.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
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
    return this.prisma.approval.create({
      data: {
        type: data.type,
        targetId: data.targetId,
        targetType: data.targetType,
        applicantId: data.applicantId,
        comment: data.comment,
        status: 'pending',
      },
    });
  }

  async approve(id: string, approverId: string) {
    const approval = await this.findOne(id);

    if (approval.status === 'approved') {
      throw new BadRequestException('Approval already approved');
    }

    if (approval.status === 'rejected') {
      throw new BadRequestException('Cannot approve a rejected approval');
    }

    return this.prisma.approval.update({
      where: { id },
      data: { status: 'approved', approverId },
    });
  }

  async reject(id: string, approverId: string, comment: string) {
    const approval = await this.findOne(id);

    if (approval.status === 'rejected') {
      throw new BadRequestException('Approval already rejected');
    }

    if (approval.status === 'approved') {
      throw new BadRequestException('Cannot reject an approved approval');
    }

    if (!comment) {
      throw new BadRequestException('Comment is required for rejection');
    }

    return this.prisma.approval.update({
      where: { id },
      data: { status: 'rejected', approverId, comment },
    });
  }
}
