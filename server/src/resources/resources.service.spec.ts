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

      expect(result).toEqual(mockResources);
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
