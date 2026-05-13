import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    phone: null,
    departmentId: 'dept-1',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    department: {
      id: 'dept-1',
      name: 'Engineering',
      parentId: null,
      sortOrder: 1,
    },
    roles: [
      {
        id: 'ur-1',
        userId: 'user-1',
        roleId: 'role-1',
        role: {
          id: 'role-1',
          name: 'Developer',
          departmentId: 'dept-1',
          description: null,
          permissions: [],
          memberCount: 5,
        },
      },
    ],
  };

  const mockTeams = [
    {
      id: 'team-1',
      name: 'Alpha Team',
      description: 'Main team',
      memberCount: 5,
      leaderId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUserWithPassword = {
    ...mockUser,
    password: '$2b$10$hashedpassword',
  };

  const mockJwtService = {
    sign: jest.fn().mockImplementation((payload: any, options?: any) => {
      if (options?.expiresIn === '7d') return 'mock-refresh-token';
      return 'mock-access-token';
    }),
    verify: jest.fn(),
  };

  const mockPrisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue(mockUser),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    team: {
      findMany: jest.fn().mockResolvedValue(mockTeams),
      findUnique: jest.fn(),
    },
    teamMember: {
      findUnique: jest.fn(),
    },
    department: {
      findFirst: jest.fn().mockResolvedValue({ id: 'dept-1', name: 'Engineering', sortOrder: 1 }),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }),
      findFirst: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentUser', () => {
    it('should return user with department and roles', async () => {
      const result = await service.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(result!.department).toBeDefined();
      expect(result!.department.name).toBe('Engineering');
      expect(result!.roles).toHaveLength(1);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        include: {
          department: true,
          roles: { include: { role: true } },
        },
      });
    });
  });

  describe('getUsers', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Test User', email: 'test@example.com', avatar: null, departmentId: 'dept-1', status: 'active' },
        { id: 'user-2', name: 'Another User', email: 'another@example.com', avatar: null, departmentId: 'dept-1', status: 'active' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers();

      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          departmentId: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getTeams', () => {
    it('should return all teams', async () => {
      const result = await service.getTeams();

      expect(result).toEqual(mockTeams);
      expect(result).toHaveLength(1);
      expect(mockPrisma.team.findMany).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerDto = {
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
    };

    it('should create user with hashed password and return user without password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
        name: 'New User',
      });

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'New User',
          email: 'new@example.com',
          password: '$2b$10$hashedpassword',
          departmentId: 'dept-1',
        },
      });
      expect(result.code).toBe(0);
      expect(result.data).toBeDefined();
      expect(result.data).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return accessToken and refreshToken for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        '$2b$10$hashedpassword',
      );
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      // Access token
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        { expiresIn: '15m' },
      );
      // Refresh token
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id },
        { expiresIn: '7d' },
      );
      expect(result.code).toBe(0);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.data).toBeDefined();
      expect(result.data).not.toHaveProperty('password');
    });

    it('should store refreshToken in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login(loginDto);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          token: 'mock-refresh-token',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new accessToken for valid refresh token', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(mockPrisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token' },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com' },
        { expiresIn: '15m' },
      );
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // expired
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for the user', async () => {
      const result = await service.logout('user-1');

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({ code: 0, message: 'Logged out successfully' });
    });

    it('should blacklist the access token when provided', async () => {
      await service.logout('user-1', 'access-token-123');

      expect(service.isTokenBlacklisted('access-token-123')).toBe(true);
      expect(service.isTokenBlacklisted('other-token')).toBe(false);
    });
  });

  describe('switchTeam', () => {
    const mockTeamMember = {
      id: 'tm-1',
      teamId: 'team-1',
      userId: 'user-1',
    };

    it('should return team if user is a member', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(mockTeamMember);
      mockPrisma.team.findUnique.mockResolvedValue(mockTeams[0]);

      const result = await service.switchTeam('user-1', 'team-1');

      expect(mockPrisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId: 'team-1', userId: 'user-1' } },
      });
      expect(mockPrisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 'team-1' },
      });
      expect(result).toEqual(mockTeams[0]);
    });

    it('should throw NotFoundException if user is not a member', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.switchTeam('user-1', 'nonexistent-team')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return false for tokens not in blacklist', () => {
      expect(service.isTokenBlacklisted('unknown-token')).toBe(false);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid JWT payload', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser({
        sub: 'user-1',
        email: 'test@example.com',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          department: true,
          roles: { include: { role: true } },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser({ sub: 'nonexistent', email: 'x@x.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
