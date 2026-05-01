import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn().mockResolvedValue(mockUser),
            },
            team: {
              findMany: jest.fn().mockResolvedValue(mockTeams),
            },
          },
        },
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
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
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
      expect(prisma.team.findMany).toHaveBeenCalled();
    });
  });
});
