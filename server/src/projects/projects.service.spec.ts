import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test project',
    parentId: null,
    category: 'development',
    phase: 'survey',
    status: 'in_progress',
    leaderId: 'user-1',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    actualStartDate: null,
    actualEndDate: null,
    completion: 30,
    budget: 100000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProjectWithTasks = {
    ...mockProject,
    tasks: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findMany: jest.fn().mockResolvedValue([mockProject]),
              findUnique: jest.fn().mockResolvedValue(mockProjectWithTasks),
              create: jest.fn().mockResolvedValue(mockProject),
              update: jest.fn().mockResolvedValue(mockProject),
              delete: jest.fn().mockResolvedValue(mockProject),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockProject]);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status when provided', async () => {
      await service.findAll('in_progress');

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'in_progress' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single project with tasks', async () => {
      const result = await service.findOne('proj-1');

      expect(result).toEqual(mockProjectWithTasks);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        include: { tasks: true },
      });
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createDto = {
        name: 'New Project',
        category: 'development',
        leaderId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockProject);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Project',
          category: 'development',
          leaderId: 'user-1',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto = { name: 'Updated Project' };

      const result = await service.update('proj-1', updateDto);

      expect(result).toEqual(mockProject);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      const result = await service.remove('proj-1');

      expect(result).toEqual(mockProject);
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
      });
    });
  });
});
