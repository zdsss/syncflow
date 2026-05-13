import { RolesGuard } from './roles.guard';
import { PERMISSIONS_KEY } from '../decorators/roles.decorator';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

function createMockExecutionContext(user?: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  describe('when no permissions are required', () => {
    beforeEach(() => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(undefined),
      } as any;
      guard = new RolesGuard(reflector);
    });

    it('should return true', () => {
      const context = createMockExecutionContext({ id: 'u1', permissions: [] });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when empty permissions array is required', () => {
    beforeEach(() => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([]),
      } as any;
      guard = new RolesGuard(reflector);
    });

    it('should return true', () => {
      const context = createMockExecutionContext({ id: 'u1', permissions: ['task:create'] });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when user has all required permissions', () => {
    beforeEach(() => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['task:create', 'task:delete']),
      } as any;
      guard = new RolesGuard(reflector);
    });

    it('should return true', () => {
      const context = createMockExecutionContext({
        id: 'u1',
        permissions: ['task:create', 'task:delete', 'project:create'],
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('when user is missing a required permission', () => {
    beforeEach(() => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['task:create', 'task:delete']),
      } as any;
      guard = new RolesGuard(reflector);
    });

    it('should return false', () => {
      const context = createMockExecutionContext({
        id: 'u1',
        permissions: ['task:create'],
      });
      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('when user has no permissions array', () => {
    beforeEach(() => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(['task:create']),
      } as any;
      guard = new RolesGuard(reflector);
    });

    it('should return false when user has no permissions field', () => {
      const context = createMockExecutionContext({ id: 'u1' });
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when user object is missing', () => {
      const context = createMockExecutionContext(undefined);
      expect(guard.canActivate(context)).toBe(false);
    });
  });
});
