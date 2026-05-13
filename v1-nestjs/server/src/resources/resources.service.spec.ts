import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let prisma: PrismaService;

  const mockResource = {
    id: 'resource-1',
    name: 'John Doe',
    type: 'human',
    description: 'Software Engineer',
    tags: ['developer', 'frontend'],
    status: 'available',
    metadata: { skills: ['React', 'TypeScript'] },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResources = [mockResource];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        {
          provide: PrismaService,
          useValue: {
            resource: {
              findMany: jest.fn().mockResolvedValue(mockResources),
              findUnique: jest.fn().mockResolvedValue(mockResource),
              create: jest.fn().mockResolvedValue(mockResource),
              update: jest.fn().mockResolvedValue(mockResource),
              delete: jest.fn().mockResolvedValue(mockResource),
              count: jest.fn().mockResolvedValue(1),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all resources', async () => {
      const result = await service.findAll({});

      expect(result.data).toEqual(mockResources);
      expect(result.total).toBe(1);
      expect(prisma.resource.findMany).toHaveBeenCalled();
    });

    it('should filter by type', async () => {
      await service.findAll({ type: 'human' });

      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'human' }),
        }),
      );
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'available' });

      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'available' }),
        }),
      );
    });

    it('should paginate with default page=1 and pageSize=20', async () => {
      const result = await service.findAll({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should paginate with custom page and pageSize', async () => {
      (prisma.resource.count as jest.Mock).mockResolvedValueOnce(55);
      const result = await service.findAll({ page: 2, pageSize: 10 });
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(55);
      expect(result.totalPages).toBe(6);
      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single resource', async () => {
      const result = await service.findOne('resource-1');

      expect(result).toEqual(mockResource);
      expect(prisma.resource.findUnique).toHaveBeenCalledWith({
        where: { id: 'resource-1' },
      });
    });
  });

  describe('create', () => {
    it('should create a new resource', async () => {
      const createDto = {
        name: 'John Doe',
        type: 'human',
        description: 'Software Engineer',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockResource);
      expect(prisma.resource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'John Doe',
          type: 'human',
          description: 'Software Engineer',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update resource fields', async () => {
      const updateDto = { name: 'Jane Doe', status: 'busy' };

      const result = await service.update('resource-1', updateDto);

      expect(result).toEqual(mockResource);
      expect(prisma.resource.update).toHaveBeenCalledWith({
        where: { id: 'resource-1' },
        data: updateDto,
      });
    });
  });

  // === Resource Type Management ===
  describe('getByType', () => {
    it('should return resources filtered by type (human)', async () => {
      const humanResources = [
        { ...mockResource, type: 'human' },
      ];
      (prisma.resource.findMany as jest.Mock).mockResolvedValue(humanResources);

      const result = await service.getByType('human');

      expect(result).toEqual(humanResources);
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        where: { type: 'human' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return resources filtered by type (equipment)', async () => {
      const equipmentResources = [
        { ...mockResource, id: 'resource-2', type: 'equipment' },
      ];
      (prisma.resource.findMany as jest.Mock).mockResolvedValue(equipmentResources);

      const result = await service.getByType('equipment');

      expect(result).toEqual(equipmentResources);
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        where: { type: 'equipment' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return resources filtered by type (supplier)', async () => {
      const supplierResources = [
        { ...mockResource, id: 'resource-3', type: 'supplier' },
      ];
      (prisma.resource.findMany as jest.Mock).mockResolvedValue(supplierResources);

      const result = await service.getByType('supplier');

      expect(result).toEqual(supplierResources);
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        where: { type: 'supplier' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array for non-existent type', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getByType('nonexistent');

      expect(result).toEqual([]);
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        where: { type: 'nonexistent' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getTypes', () => {
    it('should return distinct types from all resources', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([
        { type: 'human' },
        { type: 'equipment' },
        { type: 'supplier' },
      ]);

      const result = await service.getTypes();

      expect(result).toEqual(['human', 'equipment', 'supplier']);
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        select: { type: true },
        distinct: ['type'],
      });
    });

    it('should return empty array when no resources exist', async () => {
      (prisma.resource.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTypes();

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should delete a resource', async () => {
      const result = await service.remove('resource-1');

      expect(result).toEqual(mockResource);
      expect(prisma.resource.delete).toHaveBeenCalledWith({
        where: { id: 'resource-1' },
      });
    });
  });
});
