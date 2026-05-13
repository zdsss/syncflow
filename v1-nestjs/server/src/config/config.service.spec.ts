import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: any;
  let auditService: AuditService;

  beforeEach(async () => {
    prisma = {
      department: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      userRole: {
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      notificationSetting: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('getDepartments()', () => {
    it('should return all departments', async () => {
      const mockDepts = [
        { id: 'd1', name: 'Engineering' },
        { id: 'd2', name: 'Design' },
      ];
      prisma.department.findMany.mockResolvedValue(mockDepts);

      const result = await service.getDepartments();

      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockDepts);
      expect(prisma.department.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('getRoles()', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: 'r1', name: 'Manager', departmentId: 'd1' },
        { id: 'r2', name: 'Developer', departmentId: 'd1' },
      ];
      prisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getRoles();

      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockRoles);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: {},
        include: { department: true },
      });
    });

    it('should filter by departmentId', async () => {
      prisma.role.findMany.mockResolvedValue([]);

      await service.getRoles('d2');

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        where: { departmentId: 'd2' },
        include: { department: true },
      });
    });
  });

  describe('getMembers()', () => {
    it('should return members for a role', async () => {
      const mockMembers = [
        { id: 'ur1', userId: 'u1', roleId: 'r5', user: { id: 'u1', name: 'Alice' } },
      ];
      prisma.userRole.findMany.mockResolvedValue(mockMembers);

      const result = await service.getMembers('r5');

      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockMembers);
      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: { roleId: 'r5' },
        include: { user: true },
      });
    });
  });

  describe('createRole()', () => {
    it('should create a role', async () => {
      const dto = { name: 'Tester', departmentId: 'd1', description: 'QA tester' };
      const created = { id: 'r10', ...dto, permissions: [], memberCount: 0 };
      prisma.role.create.mockResolvedValue(created);

      const result = await service.createRole(dto);

      expect(result.code).toBe(0);
      expect(result.data).toEqual(created);
      expect(prisma.role.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('addMember()', () => {
    it('should add a member to a role', async () => {
      const created = { id: 'ur1', userId: 'u1', roleId: 'r5' };
      prisma.userRole.create.mockResolvedValue(created);

      const result = await service.addMember({ userId: 'u1', roleId: 'r5' });

      expect(result.code).toBe(0);
      expect(result.data).toEqual(created);
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: { userId: 'u1', roleId: 'r5' },
      });
    });
  });

  describe('removeMember()', () => {
    it('should remove a member from a role', async () => {
      prisma.userRole.delete.mockResolvedValue({ id: 'ur1' });

      const result = await service.removeMember('ur1');

      expect(result.code).toBe(0);
      expect(prisma.userRole.delete).toHaveBeenCalledWith({
        where: { id: 'ur1' },
      });
    });

    it('should throw if member not found', async () => {
      prisma.userRole.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.removeMember('nonexistent')).rejects.toThrow('Member not found');
    });
  });

  describe('updateRole()', () => {
    it('should update a role name and description', async () => {
      const updated = { id: 'r1', name: 'Senior Dev', description: 'Senior developer', permissions: [] };
      prisma.role.update.mockResolvedValue(updated);

      const result = await service.updateRole('r1', { name: 'Senior Dev', description: 'Senior developer' });

      expect(result.code).toBe(0);
      expect(result.data).toEqual(updated);
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { name: 'Senior Dev', description: 'Senior developer' },
      });
    });

    it('should update role permissions', async () => {
      const updated = { id: 'r1', name: 'Dev', permissions: ['read', 'write'] };
      prisma.role.update.mockResolvedValue(updated);

      const result = await service.updateRole('r1', { permissions: ['read', 'write'] });

      expect(result.code).toBe(0);
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { permissions: ['read', 'write'] },
      });
    });

    it('should throw if role not found', async () => {
      prisma.role.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.updateRole('nonexistent', { name: 'x' })).rejects.toThrow('Role not found');
    });
  });

  describe('removeRole()', () => {
    it('should delete a role', async () => {
      prisma.role.delete.mockResolvedValue({ id: 'r1' });

      const result = await service.removeRole('r1');

      expect(result.code).toBe(0);
      expect(result.message).toBe('Role removed');
      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });

    it('should throw if role not found', async () => {
      prisma.role.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.removeRole('nonexistent')).rejects.toThrow('Role not found');
    });
  });

  describe('createDepartment()', () => {
    it('should create a department', async () => {
      const created = { id: 'd10', name: 'Engineering', parentId: null, sortOrder: 1 };
      prisma.department.create.mockResolvedValue(created);

      const result = await service.createDepartment({ name: 'Engineering', sortOrder: 1 });

      expect(result.code).toBe(0);
      expect(result.data).toEqual(created);
      expect(prisma.department.create).toHaveBeenCalledWith({
        data: { name: 'Engineering', sortOrder: 1 },
      });
    });

    it('should create a department with parentId', async () => {
      const created = { id: 'd11', name: 'Frontend', parentId: 'd10', sortOrder: 2 };
      prisma.department.create.mockResolvedValue(created);

      const result = await service.createDepartment({ name: 'Frontend', parentId: 'd10', sortOrder: 2 });

      expect(result.code).toBe(0);
      expect(prisma.department.create).toHaveBeenCalledWith({
        data: { name: 'Frontend', parentId: 'd10', sortOrder: 2 },
      });
    });
  });

  describe('updateDepartment()', () => {
    it('should update department name and sortOrder', async () => {
      const updated = { id: 'd1', name: 'R&D', sortOrder: 5 };
      prisma.department.update.mockResolvedValue(updated);

      const result = await service.updateDepartment('d1', { name: 'R&D', sortOrder: 5 });

      expect(result.code).toBe(0);
      expect(result.data).toEqual(updated);
      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { name: 'R&D', sortOrder: 5 },
      });
    });

    it('should throw if department not found', async () => {
      prisma.department.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.updateDepartment('nonexistent', { name: 'x' })).rejects.toThrow('Department not found');
    });
  });

  describe('removeDepartment()', () => {
    it('should delete a department with no roles or users', async () => {
      prisma.role.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.department.delete.mockResolvedValue({ id: 'd1' });

      const result = await service.removeDepartment('d1');

      expect(result.code).toBe(0);
      expect(result.message).toBe('Department removed');
      expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
    });

    it('should throw if department has roles', async () => {
      prisma.role.findMany.mockResolvedValue([{ id: 'r1', name: 'Dev' }]);

      await expect(service.removeDepartment('d1')).rejects.toThrow('Department has roles and cannot be deleted');
      expect(prisma.department.delete).not.toHaveBeenCalled();
    });

    it('should throw if department has users', async () => {
      prisma.role.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([{ id: 'u1', name: 'Alice' }]);

      await expect(service.removeDepartment('d1')).rejects.toThrow('Department has users and cannot be deleted');
      expect(prisma.department.delete).not.toHaveBeenCalled();
    });

    it('should throw if department not found on delete', async () => {
      prisma.role.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.department.delete.mockRejectedValue(new Error('Record not found'));

      await expect(service.removeDepartment('nonexistent')).rejects.toThrow('Department not found');
    });
  });

  describe('addMember() duplicate check', () => {
    it('should throw if user already assigned to role', async () => {
      prisma.userRole.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.addMember({ userId: 'u1', roleId: 'r5' })).rejects.toThrow('User already assigned to this role');
    });
  });

  describe('getNotificationSettings()', () => {
    it('should return settings for a user', async () => {
      const mockSettings = {
        id: 'ns-1',
        userId: 'u1',
        taskReminder: true,
        emailNotify: true,
        appNotify: false,
        smsNotify: false,
        reminderDays: 5,
      };
      prisma.notificationSetting.findUnique.mockResolvedValue(mockSettings);

      const result = await service.getNotificationSettings('u1');

      expect(result).toEqual(mockSettings);
      expect(prisma.notificationSetting.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
    });

    it('should return defaults if no settings exist', async () => {
      prisma.notificationSetting.findUnique.mockResolvedValue(null);

      const result = await service.getNotificationSettings('u1');

      expect(result).toEqual({
        userId: 'u1',
        taskReminder: true,
        emailNotify: true,
        appNotify: true,
        smsNotify: false,
        reminderDays: 3,
      });
    });
  });

  describe('updateNotificationSettings()', () => {
    it('should create or update settings via upsert', async () => {
      const data = { taskReminder: false, emailNotify: true, appNotify: true, smsNotify: false, reminderDays: 7 };
      const upserted = { id: 'ns-1', userId: 'u1', ...data };
      prisma.notificationSetting.upsert.mockResolvedValue(upserted);

      const result = await service.updateNotificationSettings('u1', data);

      expect(result).toEqual(upserted);
      expect(prisma.notificationSetting.upsert).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        create: { userId: 'u1', ...data },
        update: data,
      });
    });

    it('should return the updated settings', async () => {
      const partialData = { reminderDays: 14 };
      const updated = {
        id: 'ns-1',
        userId: 'u1',
        taskReminder: true,
        emailNotify: true,
        appNotify: true,
        smsNotify: false,
        reminderDays: 14,
      };
      prisma.notificationSetting.upsert.mockResolvedValue(updated);

      const result = await service.updateNotificationSettings('u1', partialData);

      expect(result.reminderDays).toBe(14);
      expect(prisma.notificationSetting.upsert).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        create: { userId: 'u1', ...partialData },
        update: partialData,
      });
    });
  });

  describe('getSystemParams()', () => {
    it('should return default system params', async () => {
      const result = await service.getSystemParams();

      expect(result.code).toBe(0);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data).toHaveLength(5);
    });

    it('should return params with correct structure', async () => {
      const result = await service.getSystemParams();
      const param = result.data[0];

      expect(param).toHaveProperty('key');
      expect(param).toHaveProperty('name');
      expect(param).toHaveProperty('value');
      expect(param).toHaveProperty('type');
    });

    it('should include 项目最大层级 default param', async () => {
      const result = await service.getSystemParams();
      const maxLevel = result.data.find((p: any) => p.key === '1');

      expect(maxLevel).toBeDefined();
      expect(maxLevel!.name).toBe('项目最大层级');
      expect(maxLevel!.value).toBe('7');
      expect(maxLevel!.type).toBe('input');
    });

    it('should include 会话超时 select param with options', async () => {
      const result = await service.getSystemParams();
      const timeout = result.data.find((p: any) => p.key === '4');

      expect(timeout).toBeDefined();
      expect(timeout!.name).toBe('会话超时');
      expect(timeout!.type).toBe('select');
      expect(timeout!.options).toEqual(['5分钟', '10分钟', '15分钟', '30分钟', '60分钟']);
    });
  });

  describe('updateSystemParams()', () => {
    it('should accept valid system params and return success', async () => {
      const data = [
        { key: '1', name: '项目最大层级', value: '10', type: 'input' },
        { key: '2', name: '文件大小限制', value: '500MB', type: 'input' },
        { key: '3', name: '版本保留数', value: '50', type: 'input' },
        { key: '4', name: '会话超时', value: '30分钟', type: 'select', options: ['5分钟', '10分钟', '15分钟', '30分钟', '60分钟'] },
        { key: '5', name: '数据库备份频率', value: '每周', type: 'select', options: ['每小时', '每日', '每周', '每月'] },
      ];

      const result = await service.updateSystemParams(data);

      expect(result.code).toBe(0);
      expect(result.data).toEqual(data);
    });

    it('should return updated params', async () => {
      const data = [
        { key: '1', name: '项目最大层级', value: '15', type: 'input' },
        { key: '2', name: '文件大小限制', value: '1GB', type: 'input' },
        { key: '3', name: '版本保留数', value: '100', type: 'input' },
        { key: '4', name: '会话超时', value: '60分钟', type: 'select', options: ['5分钟', '10分钟', '15分钟', '30分钟', '60分钟'] },
        { key: '5', name: '数据库备份频率', value: '每月', type: 'select', options: ['每小时', '每日', '每周', '每月'] },
      ];

      const result = await service.updateSystemParams(data);

      expect(result.data[0].value).toBe('15');
      expect(result.data[1].value).toBe('1GB');
    });
  });

  describe('getPermissions()', () => {
    it('should return roles with parsed module permissions and data permission', async () => {
      const mockRoles = [
        { id: 'r1', name: 'Admin', permissions: ['project', 'task', 'file', 'bom', 'approval', 'config', 'data:global'], department: { name: 'IT' } },
        { id: 'r2', name: 'Developer', permissions: ['project', 'task', 'file', 'bom', 'data:project'], department: { name: 'Engineering' } },
      ];
      prisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getPermissions();

      expect(result.code).toBe(0);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        id: 'r1',
        name: 'Admin',
        project: true,
        task: true,
        file: true,
        bom: true,
        approval: true,
        config: true,
        dataPermission: 'global',
      });
      expect(result.data[1]).toEqual({
        id: 'r2',
        name: 'Developer',
        project: true,
        task: true,
        file: true,
        bom: true,
        approval: false,
        config: false,
        dataPermission: 'project',
      });
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        include: { department: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should default dataPermission to personal if no data: prefix found', async () => {
      const mockRoles = [
        { id: 'r1', name: 'Guest', permissions: ['project'], department: { name: 'IT' } },
      ];
      prisma.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.getPermissions();

      expect(result.data[0].dataPermission).toBe('personal');
    });

    it('should return empty array when no roles exist', async () => {
      prisma.role.findMany.mockResolvedValue([]);

      const result = await service.getPermissions();

      expect(result.code).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('updatePermissions()', () => {
    it('should batch update role permissions', async () => {
      const roles = [
        { id: 'r1', name: 'Admin', permissions: [] },
        { id: 'r2', name: 'Dev', permissions: [] },
      ];
      prisma.role.findMany.mockResolvedValue(roles);
      prisma.role.update.mockResolvedValue({});

      const payload = [
        { roleId: 'r1', modules: ['project', 'task', 'file', 'bom', 'approval', 'config'], dataPermission: 'global' },
        { roleId: 'r2', modules: ['project', 'task'], dataPermission: 'project' },
      ];

      const result = await service.updatePermissions(payload);

      expect(result.code).toBe(0);
      expect(prisma.role.update).toHaveBeenCalledTimes(2);
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { permissions: ['project', 'task', 'file', 'bom', 'approval', 'config', 'data:global'] },
      });
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'r2' },
        data: { permissions: ['project', 'task', 'data:project'] },
      });
    });

    it('should update a single role permission', async () => {
      prisma.role.findMany.mockResolvedValue([{ id: 'r1', permissions: [] }]);
      prisma.role.update.mockResolvedValue({});

      const payload = [
        { roleId: 'r1', modules: ['project'], dataPermission: 'personal' },
      ];

      const result = await service.updatePermissions(payload);

      expect(result.code).toBe(0);
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { permissions: ['project', 'data:personal'] },
      });
    });

    it('should throw NotFoundException for invalid roleId', async () => {
      prisma.role.findMany.mockResolvedValue([]);

      const payload = [
        { roleId: 'nonexistent', modules: ['project'], dataPermission: 'personal' },
      ];

      await expect(service.updatePermissions(payload)).rejects.toThrow('Role not found: nonexistent');
    });
  });

  // === Audit log tests ===
  describe('audit logging', () => {
    it('should log an audit entry when a role is created', async () => {
      const dto = { name: 'Auditor', departmentId: 'd1', description: 'Audit role' };
      const created = { id: 'r-audit', ...dto, permissions: [] };
      prisma.role.create.mockResolvedValue(created);

      await service.createRole(dto);

      expect(auditService.log).toHaveBeenCalledWith('system', 'create', 'role', 'r-audit', {
        name: 'Auditor',
        departmentId: 'd1',
      });
    });

    it('should log an audit entry when a member is added to a role', async () => {
      const created = { id: 'ur-new', userId: 'u1', roleId: 'r5' };
      prisma.userRole.create.mockResolvedValue(created);

      await service.addMember({ userId: 'u1', roleId: 'r5' });

      expect(auditService.log).toHaveBeenCalledWith('u1', 'add_member', 'role', 'r5', {
        userRoleId: 'ur-new',
      });
    });
  });
});
