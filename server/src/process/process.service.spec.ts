import { Test, TestingModule } from '@nestjs/testing';
import { ProcessService } from './process.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProcessService', () => {
  let service: ProcessService;
  let prisma: PrismaService;

  const mockStep = {
    id: 'step-1',
    name: '配料',
    description: '按配方称量原材料',
    sortOrder: 1,
    routeId: 'route-1',
    parameters: { temperature: 25, duration: 30 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRoute = {
    id: 'route-1',
    name: '电芯组装工艺',
    description: '标准电芯组装流程',
    projectId: 'proj-1',
    status: 'draft',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [mockStep],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessService,
        {
          provide: PrismaService,
          useValue: {
            processRoute: {
              findMany: jest.fn().mockResolvedValue([mockRoute]),
              findUnique: jest.fn().mockResolvedValue(mockRoute),
              create: jest.fn().mockResolvedValue(mockRoute),
              update: jest.fn().mockResolvedValue(mockRoute),
              delete: jest.fn().mockResolvedValue(mockRoute),
            },
            processStep: {
              create: jest.fn().mockResolvedValue(mockStep),
              delete: jest.fn().mockResolvedValue(mockStep),
              update: jest.fn().mockResolvedValue(mockStep),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProcessService>(ProcessService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return process routes for a project', async () => {
      const result = await service.findAll('proj-1');

      expect(result).toEqual([mockRoute]);
      expect(prisma.processRoute.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single route with steps', async () => {
      const result = await service.findOne('route-1');

      expect(result).toEqual(mockRoute);
      expect(prisma.processRoute.findUnique).toHaveBeenCalledWith({
        where: { id: 'route-1' },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  });

  describe('create', () => {
    it('should create a new process route', async () => {
      const createDto = {
        name: '电芯组装工艺',
        description: '标准电芯组装流程',
        projectId: 'proj-1',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockRoute);
      expect(prisma.processRoute.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '电芯组装工艺',
          projectId: 'proj-1',
        }),
        include: { steps: true },
      });
    });
  });

  describe('addStep', () => {
    it('should add a step to an existing route', async () => {
      const stepDto = {
        name: '涂布',
        description: '将浆料涂覆到集流体上',
        sortOrder: 2,
        parameters: { speed: 10 },
      };

      const result = await service.addStep('route-1', stepDto);

      expect(result).toEqual(mockStep);
      expect(prisma.processStep.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '涂布',
          routeId: 'route-1',
          sortOrder: 2,
        }),
      });
    });
  });

  describe('update', () => {
    it('should update a process route', async () => {
      const updateDto = { name: '更新的工艺', status: 'active' };

      const result = await service.update('route-1', updateDto);

      expect(result).toEqual(mockRoute);
      expect(prisma.processRoute.update).toHaveBeenCalledWith({
        where: { id: 'route-1' },
        data: updateDto,
        include: { steps: true },
      });
    });
  });

  describe('remove', () => {
    it('should delete a process route', async () => {
      const result = await service.remove('route-1');

      expect(result).toEqual(mockRoute);
      expect(prisma.processRoute.delete).toHaveBeenCalledWith({
        where: { id: 'route-1' },
      });
    });
  });
});
