import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
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
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockPrisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue(mockUser),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    team: {
      findMany: jest.fn().mockResolvedValue(mockTeams),
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
      expect(result.department).toBeDefined();
      expect(result.department.name).toBe('Engineering');
      expect(result.roles).toHaveLength(1);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        include: {
          department: true,
          roles: { include: { role: true } },
        },
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

    it('should return JWT token for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        '$2b$10$hashedpassword',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result.code).toBe(0);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.data).toBeDefined();
      expect(result.data).not.toHaveProperty('password');
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
