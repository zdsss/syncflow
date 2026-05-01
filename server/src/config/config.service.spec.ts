import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      department: {
        findMany: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
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
  });
});
