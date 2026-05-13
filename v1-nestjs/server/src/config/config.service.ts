import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ConfigService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

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
    await this.auditService.log('system', 'create', 'role', data.id, { name: dto.name, departmentId: dto.departmentId });
    return { code: 0, data };
  }

  async updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }) {
    try {
      const updated = await this.prisma.role.update({
        where: { id },
        data,
      });
      return { code: 0, data: updated };
    } catch (error) {
      throw new NotFoundException('Role not found');
    }
  }

  async removeRole(id: string) {
    try {
      await this.prisma.role.delete({ where: { id } });
      await this.auditService.log('system', 'delete', 'role', id, {});
      return { code: 0, message: 'Role removed' };
    } catch (error) {
      throw new NotFoundException('Role not found');
    }
  }

  async createDepartment(dto: { name: string; parentId?: string; sortOrder?: number }) {
    const data = await this.prisma.department.create({ data: dto as any });
    return { code: 0, data };
  }

  async updateDepartment(id: string, data: { name?: string; sortOrder?: number }) {
    try {
      const updated = await this.prisma.department.update({
        where: { id },
        data,
      });
      return { code: 0, data: updated };
    } catch (error) {
      throw new NotFoundException('Department not found');
    }
  }

  async removeDepartment(id: string) {
    // Check if department has roles
    const roles = await this.prisma.role.findMany({ where: { departmentId: id } });
    if (roles.length > 0) {
      throw new ConflictException('Department has roles and cannot be deleted');
    }

    // Check if department has users
    const users = await this.prisma.user.findMany({ where: { departmentId: id } });
    if (users.length > 0) {
      throw new ConflictException('Department has users and cannot be deleted');
    }

    try {
      await this.prisma.department.delete({ where: { id } });
      return { code: 0, message: 'Department removed' };
    } catch (error) {
      throw new NotFoundException('Department not found');
    }
  }

  async addMember(dto: { userId: string; roleId: string }) {
    try {
      const data = await this.prisma.userRole.create({
        data: { userId: dto.userId, roleId: dto.roleId },
      });
      await this.auditService.log(dto.userId, 'add_member', 'role', dto.roleId, { userRoleId: data.id });
      return { code: 0, data };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('User already assigned to this role');
      }
      throw error;
    }
  }

  async removeMember(id: string) {
    try {
      await this.prisma.userRole.delete({ where: { id } });
      await this.auditService.log('system', 'remove_member', 'userRole', id, {});
      return { code: 0, message: 'Member removed' };
    } catch (error) {
      throw new NotFoundException('Member not found');
    }
  }

  async getSystemParams() {
    const data = [
      { key: '1', name: '项目最大层级', value: '7', type: 'input' },
      { key: '2', name: '文件大小限制', value: '200MB', type: 'input' },
      { key: '3', name: '版本保留数', value: '20', type: 'input' },
      {
        key: '4',
        name: '会话超时',
        value: '15分钟',
        type: 'select',
        options: ['5分钟', '10分钟', '15分钟', '30分钟', '60分钟'],
      },
      {
        key: '5',
        name: '数据库备份频率',
        value: '每日',
        type: 'select',
        options: ['每小时', '每日', '每周', '每月'],
      },
    ];
    return { code: 0, data };
  }

  async updateSystemParams(data: any[]) {
    return { code: 0, data };
  }

  async getPermissions() {
    const roles = await this.prisma.role.findMany({
      include: { department: true },
      orderBy: { name: 'asc' },
    });

    const MODULE_KEYS = ['project', 'task', 'file', 'bom', 'approval', 'config'];

    const data = roles.map((role: any) => {
      const perms = role.permissions as string[];
      const entry: any = { id: role.id, name: role.name };
      for (const mod of MODULE_KEYS) {
        entry[mod] = perms.includes(mod);
      }
      const dataPerm = perms.find((p: string) => p.startsWith('data:'));
      entry.dataPermission = dataPerm ? dataPerm.replace('data:', '') : 'personal';
      return entry;
    });

    return { code: 0, data };
  }

  async updatePermissions(payload: { roleId: string; modules: string[]; dataPermission: string }[]) {
    const allRoles = await this.prisma.role.findMany();
    const roleMap = new Map(allRoles.map((r: any) => [r.id, r]));

    for (const item of payload) {
      if (!roleMap.has(item.roleId)) {
        throw new NotFoundException(`Role not found: ${item.roleId}`);
      }
      const permissions = [...item.modules, `data:${item.dataPermission}`];
      await this.prisma.role.update({
        where: { id: item.roleId },
        data: { permissions },
      });
    }

    return { code: 0, message: 'Permissions updated' };
  }

  async getNotificationSettings(userId: string) {
    const settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });
    return settings || {
      userId,
      taskReminder: true,
      emailNotify: true,
      appNotify: true,
      smsNotify: false,
      reminderDays: 3,
    };
  }

  async updateNotificationSettings(userId: string, data: any) {
    return this.prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}
