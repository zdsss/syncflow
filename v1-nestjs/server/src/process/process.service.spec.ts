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
              findFirst: jest.fn().mockResolvedValue(mockStep),
              findMany: jest.fn().mockResolvedValue([mockStep]),
              updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            $transaction: jest.fn().mockResolvedValue([]),
            processVersion: {
              create: jest.fn().mockResolvedValue({
                id: 'ver-1',
                routeId: 'route-1',
                version: 1,
                description: 'Initial version',
                status: 'draft',
                createdAt: new Date(),
              }),
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'ver-1',
                  routeId: 'route-1',
                  version: 2,
                  description: 'Second version',
                  status: 'draft',
                  createdAt: new Date(),
                },
                {
                  id: 'ver-0',
                  routeId: 'route-1',
                  version: 1,
                  description: 'Initial version',
                  status: 'published',
                  createdAt: new Date(),
                },
              ]),
              findUnique: jest.fn().mockResolvedValue({
                id: 'ver-1',
                routeId: 'route-1',
                version: 1,
                description: 'Initial version',
                status: 'draft',
                createdAt: new Date(),
              }),
              update: jest.fn().mockResolvedValue({
                id: 'ver-1',
                routeId: 'route-1',
                version: 1,
                description: 'Initial version',
                status: 'published',
                createdAt: new Date(),
              }),
              aggregate: jest.fn().mockResolvedValue({ _max: { version: 2 } }),
              count: jest.fn().mockResolvedValue(2),
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

  describe('removeStep', () => {
    it('should delete a step and reorder remaining steps', async () => {
      // The step to delete has sortOrder 3
      const stepToDelete = {
        id: 'step-3',
        name: 'Step 3',
        sortOrder: 3,
        routeId: 'route-1',
      };
      (prisma.processStep.findFirst as jest.Mock).mockResolvedValue(stepToDelete);
      (prisma.processStep.delete as jest.Mock).mockResolvedValue(stepToDelete);
      (prisma.processStep.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.processStep.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.removeStep('route-1', 'step-3');

      expect(result.code).toBe(0);

      // Should find the step
      expect(prisma.processStep.findFirst).toHaveBeenCalledWith({
        where: { id: 'step-3', routeId: 'route-1' },
      });

      // Should delete the step
      expect(prisma.processStep.delete).toHaveBeenCalledWith({
        where: { id: 'step-3' },
      });

      // Should decrement sortOrder for remaining steps after the deleted one
      expect(prisma.processStep.updateMany).toHaveBeenCalledWith({
        where: { routeId: 'route-1', sortOrder: { gt: 3 } },
        data: { sortOrder: { decrement: 1 } },
      });
    });

    it('should throw if step not found', async () => {
      (prisma.processStep.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.removeStep('route-1', 'nonexistent')).rejects.toThrow(
        'Step nonexistent not found in route route-1',
      );
    });
  });

  describe('updateStepParameters', () => {
    it('should update the parameters JSON field of a step', async () => {
      const parameters = [
        {
          name: 'Temperature',
          targetValue: 25,
          upperLimit: 30,
          lowerLimit: 20,
          unit: '°C',
          inspectionMethod: 'Thermometer',
        },
        {
          name: 'Pressure',
          targetValue: 101.3,
          upperLimit: 110,
          lowerLimit: 90,
          unit: 'kPa',
          inspectionMethod: 'Pressure gauge',
        },
      ];

      const updatedStep = { ...mockStep, parameters };
      (prisma.processStep.update as jest.Mock).mockResolvedValue(updatedStep);

      const result = await service.updateStepParameters('route-1', 'step-1', parameters);

      expect(result).toEqual(updatedStep);
      expect(prisma.processStep.findFirst).toHaveBeenCalledWith({
        where: { id: 'step-1', routeId: 'route-1' },
      });
      expect(prisma.processStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: { parameters },
      });
    });

    it('should throw NotFoundException if step not found', async () => {
      (prisma.processStep.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStepParameters('route-1', 'nonexistent', []),
      ).rejects.toThrow('Step not found');
    });
  });

  describe('getStepParameters', () => {
    it('should return the parameters array from a step', async () => {
      const stepWithParams = {
        ...mockStep,
        parameters: [
          { name: 'Temperature', targetValue: 25, unit: '°C' },
          { name: 'Humidity', targetValue: 60, unit: '%' },
        ],
      };
      (prisma.processStep.findFirst as jest.Mock).mockResolvedValue(stepWithParams);

      const result = await service.getStepParameters('route-1', 'step-1');

      expect(result).toEqual([
        { name: 'Temperature', targetValue: 25, unit: '°C' },
        { name: 'Humidity', targetValue: 60, unit: '%' },
      ]);
      expect(prisma.processStep.findFirst).toHaveBeenCalledWith({
        where: { id: 'step-1', routeId: 'route-1' },
      });
    });

    it('should return empty array if parameters is null', async () => {
      const stepWithoutParams = { ...mockStep, parameters: null };
      (prisma.processStep.findFirst as jest.Mock).mockResolvedValue(stepWithoutParams);

      const result = await service.getStepParameters('route-1', 'step-1');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException if step not found', async () => {
      (prisma.processStep.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getStepParameters('route-1', 'nonexistent'),
      ).rejects.toThrow('Step not found');
    });
  });

  describe('createVersion', () => {
    it('should create a new version record', async () => {
      const mockVersion = {
        id: 'ver-1',
        routeId: 'route-1',
        version: 1,
        description: 'Initial version',
        status: 'draft',
        createdAt: new Date(),
      };
      (prisma.processVersion.aggregate as jest.Mock).mockResolvedValue({ _max: { version: null } });
      (prisma.processVersion.create as jest.Mock).mockResolvedValue(mockVersion);

      const result = await service.createVersion('route-1', 'Initial version');

      expect(result).toEqual(mockVersion);
      expect(prisma.processVersion.create).toHaveBeenCalledWith({
        data: {
          routeId: 'route-1',
          version: 1,
          description: 'Initial version',
          status: 'draft',
        },
      });
    });

    it('should auto-increment version number', async () => {
      (prisma.processVersion.aggregate as jest.Mock).mockResolvedValue({ _max: { version: 3 } });
      const mockVersion = {
        id: 'ver-new',
        routeId: 'route-1',
        version: 4,
        description: 'New version',
        status: 'draft',
        createdAt: new Date(),
      };
      (prisma.processVersion.create as jest.Mock).mockResolvedValue(mockVersion);

      const result = await service.createVersion('route-1', 'New version');

      expect(result.version).toBe(4);
      expect(prisma.processVersion.create).toHaveBeenCalledWith({
        data: {
          routeId: 'route-1',
          version: 4,
          description: 'New version',
          status: 'draft',
        },
      });
    });

    it('should work without description', async () => {
      (prisma.processVersion.aggregate as jest.Mock).mockResolvedValue({ _max: { version: 1 } });
      const mockVersion = {
        id: 'ver-new',
        routeId: 'route-1',
        version: 2,
        description: null,
        status: 'draft',
        createdAt: new Date(),
      };
      (prisma.processVersion.create as jest.Mock).mockResolvedValue(mockVersion);

      const result = await service.createVersion('route-1');

      expect(result).toEqual(mockVersion);
      expect(prisma.processVersion.create).toHaveBeenCalledWith({
        data: {
          routeId: 'route-1',
          version: 2,
          description: undefined,
          status: 'draft',
        },
      });
    });
  });

  describe('getVersions', () => {
    it('should return all versions for a route ordered by version desc', async () => {
      const mockVersions = [
        { id: 'ver-2', routeId: 'route-1', version: 2, status: 'draft' },
        { id: 'ver-1', routeId: 'route-1', version: 1, status: 'published' },
      ];
      (prisma.processVersion.findMany as jest.Mock).mockResolvedValue(mockVersions);

      const result = await service.getVersions('route-1');

      expect(result).toEqual(mockVersions);
      expect(prisma.processVersion.findMany).toHaveBeenCalledWith({
        where: { routeId: 'route-1' },
        orderBy: { version: 'desc' },
      });
    });
  });

  describe('publishVersion', () => {
    it('should set version status to published', async () => {
      const mockVersion = {
        id: 'ver-1',
        routeId: 'route-1',
        version: 1,
        status: 'published',
        createdAt: new Date(),
      };
      (prisma.processVersion.findUnique as jest.Mock).mockResolvedValue(mockVersion);
      (prisma.processVersion.update as jest.Mock).mockResolvedValue(mockVersion);

      const result = await service.publishVersion('route-1', 'ver-1');

      expect(result).toEqual(mockVersion);
      expect(prisma.processVersion.findUnique).toHaveBeenCalledWith({
        where: { id: 'ver-1' },
      });
      expect(prisma.processVersion.update).toHaveBeenCalledWith({
        where: { id: 'ver-1' },
        data: { status: 'published' },
      });
    });

    it('should throw if version does not belong to route', async () => {
      (prisma.processVersion.findUnique as jest.Mock).mockResolvedValue({
        id: 'ver-1',
        routeId: 'other-route',
        version: 1,
        status: 'draft',
      });

      await expect(service.publishVersion('route-1', 'ver-1')).rejects.toThrow(
        'Version not found',
      );
    });

    it('should throw if version not found', async () => {
      (prisma.processVersion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.publishVersion('route-1', 'nonexistent')).rejects.toThrow(
        'Version not found',
      );
    });
  });

  describe('getRouteVisualization', () => {
    it('should return route with steps ordered by sortOrder including stepCount and totalParameters', async () => {
      const routeWithSteps = {
        ...mockRoute,
        steps: [
          { id: 'step-1', name: 'Step 1', sortOrder: 1, parameters: [{ name: 'Temp' }, { name: 'Pressure' }] },
          { id: 'step-2', name: 'Step 2', sortOrder: 2, parameters: [{ name: 'Speed' }] },
        ],
      };
      (prisma.processRoute.findUnique as jest.Mock).mockResolvedValue(routeWithSteps);

      const result = await service.getRouteVisualization('route-1');

      expect(result).not.toBeNull();
      expect(result!.stepCount).toBe(2);
      expect(result!.totalParameters).toBe(3);
      expect(result!.steps).toEqual(routeWithSteps.steps);
      expect(prisma.processRoute.findUnique).toHaveBeenCalledWith({
        where: { id: 'route-1' },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    it('should handle steps with null parameters', async () => {
      const routeWithNullParams = {
        ...mockRoute,
        steps: [
          { id: 'step-1', name: 'Step 1', sortOrder: 1, parameters: null },
          { id: 'step-2', name: 'Step 2', sortOrder: 2, parameters: [{ name: 'Temp' }] },
        ],
      };
      (prisma.processRoute.findUnique as jest.Mock).mockResolvedValue(routeWithNullParams);

      const result = await service.getRouteVisualization('route-1');

      expect(result).not.toBeNull();
      expect(result!.stepCount).toBe(2);
      expect(result!.totalParameters).toBe(1);
    });

    it('should return null if route not found', async () => {
      (prisma.processRoute.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getRouteVisualization('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getRouteStats', () => {
    it('should return route with step count, version count, and latest version', async () => {
      const routeWithStepIds = {
        id: 'route-1',
        name: '电芯组装工艺',
        steps: [{ id: 'step-1' }, { id: 'step-2' }],
      };
      (prisma.processRoute.findUnique as jest.Mock).mockResolvedValue(routeWithStepIds);
      (prisma.processVersion.count as jest.Mock).mockResolvedValue(3);

      const result = await service.getRouteStats('route-1');

      expect(result).not.toBeNull();
      expect(result!.routeId).toBe('route-1');
      expect(result!.name).toBe('电芯组装工艺');
      expect(result!.stepCount).toBe(2);
      expect(result!.versionCount).toBe(3);
      expect(prisma.processRoute.findUnique).toHaveBeenCalledWith({
        where: { id: 'route-1' },
        include: { steps: { select: { id: true } } },
      });
      expect(prisma.processVersion.count).toHaveBeenCalledWith({
        where: { routeId: 'route-1' },
      });
    });

    it('should return null if route not found', async () => {
      (prisma.processRoute.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getRouteStats('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('reorderSteps', () => {
    it('should update sortOrder for multiple steps', async () => {
      const stepOrders = [
        { id: 'step-1', sortOrder: 2 },
        { id: 'step-2', sortOrder: 1 },
        { id: 'step-3', sortOrder: 3 },
      ];

      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: 'step-1' },
        { id: 'step-2' },
        { id: 'step-3' },
      ]);

      const result = await service.reorderSteps('route-1', stepOrders);

      expect(result.code).toBe(0);

      // Should call $transaction with an array of 3 update operations
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const txArg = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(txArg).toHaveLength(3);

      // Each update call should have been made with correct args
      expect(prisma.processStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: { sortOrder: 2 },
      });
      expect(prisma.processStep.update).toHaveBeenCalledWith({
        where: { id: 'step-2' },
        data: { sortOrder: 1 },
      });
      expect(prisma.processStep.update).toHaveBeenCalledWith({
        where: { id: 'step-3' },
        data: { sortOrder: 3 },
      });
    });
  });
});
