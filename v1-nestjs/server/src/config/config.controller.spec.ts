import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: ConfigService;

  const mockDepartment = { id: 'dept-1', name: 'Engineering' };
  const mockRole = { id: 'role-1', name: 'Admin', departmentId: 'dept-1' };
  const mockMember = { id: 'mem-1', userId: 'user-1', roleId: 'role-1' };
  const mockPerm = { roleId: 'role-1', modules: ['tasks'] };

  const mockService = {
    getDepartments: jest.fn().mockResolvedValue([mockDepartment]),
    getRoles: jest.fn().mockResolvedValue([mockRole]),
    getMembers: jest.fn().mockResolvedValue([mockMember]),
    createRole: jest.fn().mockResolvedValue(mockRole),
    updateRole: jest.fn().mockResolvedValue(mockRole),
    removeRole: jest.fn().mockResolvedValue(mockRole),
    createDepartment: jest.fn().mockResolvedValue(mockDepartment),
    updateDepartment: jest.fn().mockResolvedValue(mockDepartment),
    removeDepartment: jest.fn().mockResolvedValue(mockDepartment),
    addMember: jest.fn().mockResolvedValue(mockMember),
    removeMember: jest.fn().mockResolvedValue(mockMember),
    getSystemParams: jest.fn().mockResolvedValue([]),
    updateSystemParams: jest.fn().mockResolvedValue([]),
    getPermissions: jest.fn().mockResolvedValue([mockPerm]),
    updatePermissions: jest.fn().mockResolvedValue([mockPerm]),
    getNotificationSettings: jest.fn().mockResolvedValue({}),
    updateNotificationSettings: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [{ provide: ConfigService, useValue: mockService }],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDepartments', () => {
    it('should return departments', async () => {
      const result = await controller.getDepartments();
      expect(service.getDepartments).toHaveBeenCalled();
      expect(result).toEqual([mockDepartment]);
    });
  });

  describe('getRoles', () => {
    it('should return roles', async () => {
      const result = await controller.getRoles('dept-1');
      expect(service.getRoles).toHaveBeenCalledWith('dept-1');
      expect(result).toEqual([mockRole]);
    });

    it('should return roles without department filter', async () => {
      const result = await controller.getRoles();
      expect(service.getRoles).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockRole]);
    });
  });

  describe('getMembers', () => {
    it('should return members by role', async () => {
      const result = await controller.getMembers('role-1');
      expect(service.getMembers).toHaveBeenCalledWith('role-1');
      expect(result).toEqual([mockMember]);
    });
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      const dto = { name: 'Admin', departmentId: 'dept-1' };
      const result = await controller.createRole(dto as any);
      expect(service.createRole).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const dto = { name: 'SuperAdmin' };
      const result = await controller.updateRole('role-1', dto as any);
      expect(service.updateRole).toHaveBeenCalledWith('role-1', dto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('removeRole', () => {
    it('should delete a role', async () => {
      const result = await controller.removeRole('role-1');
      expect(service.removeRole).toHaveBeenCalledWith('role-1');
      expect(result).toEqual(mockRole);
    });
  });

  describe('createDepartment', () => {
    it('should create a department', async () => {
      const dto = { name: 'Engineering' };
      const result = await controller.createDepartment(dto as any);
      expect(service.createDepartment).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('updateDepartment', () => {
    it('should update a department', async () => {
      const dto = { name: 'R&D' };
      const result = await controller.updateDepartment('dept-1', dto as any);
      expect(service.updateDepartment).toHaveBeenCalledWith('dept-1', dto);
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('removeDepartment', () => {
    it('should delete a department', async () => {
      const result = await controller.removeDepartment('dept-1');
      expect(service.removeDepartment).toHaveBeenCalledWith('dept-1');
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('addMember', () => {
    it('should add a member', async () => {
      const dto = { userId: 'user-1', roleId: 'role-1' };
      const result = await controller.addMember(dto as any);
      expect(service.addMember).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMember);
    });
  });

  describe('removeMember', () => {
    it('should remove a member', async () => {
      const result = await controller.removeMember('mem-1');
      expect(service.removeMember).toHaveBeenCalledWith('mem-1');
      expect(result).toEqual(mockMember);
    });
  });

  describe('getSystemParams', () => {
    it('should return system params', async () => {
      const result = await controller.getSystemParams();
      expect(service.getSystemParams).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('updateSystemParams', () => {
    it('should update system params', async () => {
      const params = [{ key: 'maxUploadSize', value: '10mb' }];
      const result = await controller.updateSystemParams(params);
      expect(service.updateSystemParams).toHaveBeenCalledWith(params);
      expect(result).toEqual([]);
    });
  });

  describe('getPermissions', () => {
    it('should return permissions', async () => {
      const result = await controller.getPermissions();
      expect(service.getPermissions).toHaveBeenCalled();
      expect(result).toEqual([mockPerm]);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions', async () => {
      const body = [{ roleId: 'role-1', modules: ['tasks'], dataPermission: 'all' }];
      const result = await controller.updatePermissions(body);
      expect(service.updatePermissions).toHaveBeenCalledWith(body);
      expect(result).toEqual([mockPerm]);
    });
  });

  describe('getNotificationSettings', () => {
    it('should return notification settings', async () => {
      const result = await controller.getNotificationSettings('user-1');
      expect(service.getNotificationSettings).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ code: 0, data: {} });
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings', async () => {
      const body = { emailEnabled: true };
      const result = await controller.updateNotificationSettings('user-1', body);
      expect(service.updateNotificationSettings).toHaveBeenCalledWith('user-1', body);
      expect(result).toEqual({ code: 0, data: {} });
    });
  });
});
