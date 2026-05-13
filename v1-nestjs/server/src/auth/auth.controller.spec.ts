import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test' };
  const mockTokens = { accessToken: 'at', refreshToken: 'rt' };

  const mockService = {
    register: jest.fn().mockResolvedValue(mockUser),
    login: jest.fn().mockResolvedValue(mockTokens),
    refreshToken: jest.fn().mockResolvedValue({ accessToken: 'new-at' }),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out' }),
    getUsers: jest.fn().mockResolvedValue([mockUser]),
    validateUser: jest.fn().mockResolvedValue(mockUser),
    switchTeam: jest.fn().mockResolvedValue({ teamId: 'team-2' }),
    getTeams: jest.fn().mockResolvedValue([{ id: 'team-1', name: 'Default' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user', async () => {
      const dto = { email: 'new@example.com', password: 'pass', name: 'New' };
      const result = await controller.register(dto as any);
      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });

    it('should propagate duplicate email errors', async () => {
      (service.register as jest.Mock).mockRejectedValueOnce(new Error('Conflict'));
      await expect(controller.register({} as any)).rejects.toThrow('Conflict');
    });
  });

  describe('login', () => {
    it('should return tokens on login', async () => {
      const dto = { email: 'test@example.com', password: 'pass' };
      const result = await controller.login(dto as any);
      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });

    it('should propagate invalid credentials', async () => {
      (service.login as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));
      await expect(controller.login({} as any)).rejects.toThrow('Unauthorized');
    });
  });

  describe('refresh', () => {
    it('should return a new access token', async () => {
      const result = await controller.refresh({ refreshToken: 'rt' });
      expect(service.refreshToken).toHaveBeenCalledWith('rt');
      expect(result).toEqual({ accessToken: 'new-at' });
    });

    it('should propagate invalid refresh token', async () => {
      (service.refreshToken as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));
      await expect(controller.refresh({ refreshToken: 'bad' })).rejects.toThrow('Unauthorized');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const result = await controller.logout({ user: { id: 'user-1' } });
      expect(service.logout).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ message: 'Logged out' });
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const result = await controller.getUsers();
      expect(service.getUsers).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: [mockUser] });
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const req = { user: { id: 'user-1', email: 'test@example.com' } };
      const result = await controller.getMe(req);
      expect(service.validateUser).toHaveBeenCalledWith({ sub: 'user-1', email: 'test@example.com' });
      expect(result).toEqual({ code: 0, data: mockUser });
    });
  });

  describe('switchTeam', () => {
    it('should switch team', async () => {
      const result = await controller.switchTeam({ user: { id: 'user-1' } }, { teamId: 'team-2' });
      expect(service.switchTeam).toHaveBeenCalledWith('user-1', 'team-2');
      expect(result).toEqual({ code: 0, data: { teamId: 'team-2' } });
    });
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      const result = await controller.getTeams();
      expect(service.getTeams).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: [{ id: 'team-1', name: 'Default' }] });
    });
  });
});
