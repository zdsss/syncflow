import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getDepartments() {
    const data = await this.prisma.department.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { code: 0, data };
  }

  async getRoles(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};
    const data = await this.prisma.role.findMany({
      where,
      include: { department: true },
    });
    return { code: 0, data };
  }

  async getMembers(roleId: string) {
    const data = await this.prisma.userRole.findMany({
      where: { roleId },
      include: { user: true },
    });
    return { code: 0, data };
  }

  async createRole(dto: {
    name: string;
    departmentId: string;
    description?: string;
    permissions?: string[];
  }) {
    const data = await this.prisma.role.create({ data: dto as any });
    return { code: 0, data };
  }

  async addMember(dto: { userId: string; roleId: string }) {
    const data = await this.prisma.userRole.create({
      data: { userId: dto.userId, roleId: dto.roleId },
    });
    return { code: 0, data };
  }

  async removeMember(id: string) {
    await this.prisma.userRole.delete({ where: { id } });
    return { code: 0, message: 'Member removed' };
  }
}
