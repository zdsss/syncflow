import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.file.findMany({
      where: {
        uploaderId: userId,
        projectId: null,
        isDeleted: false,
      },
      include: { uploader: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    name: string;
    type: string;
    extension?: string;
    size: number | bigint;
    path: string;
    uploaderId: string;
  }) {
    return this.prisma.file.create({
      data: {
        ...data,
        projectId: null,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.file.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
