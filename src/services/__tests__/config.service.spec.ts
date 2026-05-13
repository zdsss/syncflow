import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../api';
import {
  getDepartmentTree,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getNotificationSettings,
  updateNotificationSettings,
  getModuleCategories,
  getModules,
  getModuleSpecs,
  getSpecParams,
  publishSpec,
  getOrderCategories,
  getOrderProducts,
} from '../config.service';

describe('ConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Departments', () => {
    it('getDepartmentTree calls GET /sys/departments/tree', async () => {
      await getDepartmentTree();
      expect(api.get).toHaveBeenCalledWith('/sys/departments/tree');
    });

    it('createDepartment calls POST /sys/departments with data', async () => {
      const data = { name: 'Engineering', code: 'ENG', sortOrder: 1 };
      await createDepartment(data);
      expect(api.post).toHaveBeenCalledWith('/sys/departments', data);
    });

    it('updateDepartment calls PUT /sys/departments/:id with data', async () => {
      const data = { name: 'R&D', sortOrder: 5 };
      await updateDepartment(1, data);
      expect(api.put).toHaveBeenCalledWith('/sys/departments/1', data);
    });

    it('deleteDepartment calls DELETE /sys/departments/:id', async () => {
      await deleteDepartment(1);
      expect(api.delete).toHaveBeenCalledWith('/sys/departments/1');
    });
  });

  describe('Roles', () => {
    it('getRoles calls GET /sys/roles', async () => {
      await getRoles();
      expect(api.get).toHaveBeenCalledWith('/sys/roles');
    });

    it('createRole calls POST /sys/roles with data', async () => {
      const data = { code: 'dev', name: 'Developer', description: 'Dev role' };
      await createRole(data);
      expect(api.post).toHaveBeenCalledWith('/sys/roles', data);
    });

    it('updateRole calls PUT /sys/roles/:id with data', async () => {
      const data = { name: 'Senior Developer' };
      await updateRole(1, data);
      expect(api.put).toHaveBeenCalledWith('/sys/roles/1', data);
    });

    it('deleteRole calls DELETE /sys/roles/:id', async () => {
      await deleteRole(1);
      expect(api.delete).toHaveBeenCalledWith('/sys/roles/1');
    });
  });

  describe('Users', () => {
    it('getUsers calls GET /sys/users', async () => {
      await getUsers();
      expect(api.get).toHaveBeenCalledWith('/sys/users', { params: {} });
    });

    it('getUsers calls GET /sys/users with params', async () => {
      await getUsers({ pageNum: 1, pageSize: 10, keyword: 'test' });
      expect(api.get).toHaveBeenCalledWith('/sys/users', { params: { pageNum: 1, pageSize: 10, keyword: 'test' } });
    });

    it('createUser calls POST /sys/users with data', async () => {
      const data = { username: 'john', realName: 'John Doe' };
      await createUser(data);
      expect(api.post).toHaveBeenCalledWith('/sys/users', data);
    });

    it('updateUser calls PUT /sys/users/:id with data', async () => {
      const data = { realName: 'Jane Doe' };
      await updateUser(1, data);
      expect(api.put).toHaveBeenCalledWith('/sys/users/1', data);
    });

    it('deleteUser calls DELETE /sys/users/:id', async () => {
      await deleteUser(1);
      expect(api.delete).toHaveBeenCalledWith('/sys/users/1');
    });
  });

  describe('Notification Settings', () => {
    it('getNotificationSettings calls GET /notifications/settings', async () => {
      api.get.mockResolvedValue({ data: { taskReminder: true } });
      await getNotificationSettings();
      expect(api.get).toHaveBeenCalledWith('/notifications/settings');
    });

    it('updateNotificationSettings calls PUT /notifications/settings with data', async () => {
      const data = { taskReminder: false };
      api.put.mockResolvedValue({ data });
      await updateNotificationSettings(data);
      expect(api.put).toHaveBeenCalledWith('/notifications/settings', data);
    });
  });

  describe('Module Library', () => {
    it('getModuleCategories calls GET /config/modules/categories', async () => {
      await getModuleCategories();
      expect(api.get).toHaveBeenCalledWith('/config/modules/categories');
    });

    it('getModules calls GET /config/modules', async () => {
      await getModules();
      expect(api.get).toHaveBeenCalledWith('/config/modules', { params: {} });
    });

    it('getModules calls GET /config/modules with categoryId', async () => {
      await getModules(5);
      expect(api.get).toHaveBeenCalledWith('/config/modules', { params: { categoryId: 5 } });
    });

    it('getModuleSpecs calls GET /config/modules/:moduleId/specs', async () => {
      await getModuleSpecs(3);
      expect(api.get).toHaveBeenCalledWith('/config/modules/3/specs');
    });

    it('getSpecParams calls GET /config/modules/specs/:specId/params', async () => {
      await getSpecParams(7);
      expect(api.get).toHaveBeenCalledWith('/config/modules/specs/7/params');
    });

    it('publishSpec calls POST /config/modules/specs/:specId/publish', async () => {
      await publishSpec(7);
      expect(api.post).toHaveBeenCalledWith('/config/modules/specs/7/publish');
    });
  });

  describe('Order Config', () => {
    it('getOrderCategories calls GET /config/orders/categories', async () => {
      await getOrderCategories();
      expect(api.get).toHaveBeenCalledWith('/config/orders/categories');
    });

    it('getOrderProducts calls GET /config/orders/products', async () => {
      await getOrderProducts();
      expect(api.get).toHaveBeenCalledWith('/config/orders/products', { params: {} });
    });

    it('getOrderProducts calls GET /config/orders/products with categoryId', async () => {
      await getOrderProducts(3);
      expect(api.get).toHaveBeenCalledWith('/config/orders/products', { params: { categoryId: 3 } });
    });
  });
});
