import { Test, TestingModule } from '@nestjs/testing';
import { BomService } from './bom.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BomService', () => {
  let service: BomService;
  let prisma: PrismaService;

  const mockBomItem = {
    id: 'bom-1',
    name: '电芯模组',
    partNumber: 'CELL-001',
    specification: '3.7V 5000mAh',
    supplier: 'CATL',
    unit: 'pcs',
    unitPrice: 120.50,
    quantity: 100,
    parentId: null,
    projectId: 'proj-1',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChildItem = {
    id: 'bom-2',
    name: '极耳',
    partNumber: 'TAB-001',
    specification: 'Al tab',
    supplier: null,
    unit: 'pcs',
    unitPrice: 2.50,
    quantity: 200,
    parentId: 'bom-1',
    projectId: 'proj-1',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BomService,
        {
          provide: PrismaService,
          useValue: {
            bomItem: {
              findMany: jest.fn().mockResolvedValue([mockBomItem, mockChildItem]),
              findUnique: jest.fn().mockResolvedValue(mockBomItem),
              create: jest.fn().mockResolvedValue(mockBomItem),
              update: jest.fn().mockResolvedValue(mockBomItem),
              delete: jest.fn().mockResolvedValue(mockBomItem),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BomService>(BomService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return BOM items for a project', async () => {
      const result = await service.findAll('proj-1');

      expect(result).toEqual([mockBomItem, mockChildItem]);
      expect(prisma.bomItem.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single BOM item', async () => {
      const result = await service.findOne('bom-1');

      expect(result).toEqual(mockBomItem);
      expect(prisma.bomItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'bom-1' },
      });
    });
  });

  describe('create', () => {
    it('should create a new BOM item', async () => {
      const createDto = {
        name: '电芯模组',
        partNumber: 'CELL-001',
        specification: '3.7V 5000mAh',
        supplier: 'CATL',
        unit: 'pcs',
        unitPrice: 120.50,
        quantity: 100,
        projectId: 'proj-1',
      };

      const result = await service.create(createDto);

      expect(result).toEqual(mockBomItem);
      expect(prisma.bomItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '电芯模组',
          partNumber: 'CELL-001',
          projectId: 'proj-1',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update a BOM item', async () => {
      const updateDto = { name: '更新的电芯', unitPrice: 150.00 };

      const result = await service.update('bom-1', updateDto);

      expect(result).toEqual(mockBomItem);
      expect(prisma.bomItem.update).toHaveBeenCalledWith({
        where: { id: 'bom-1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a BOM item', async () => {
      const result = await service.remove('bom-1');

      expect(result).toEqual(mockBomItem);
      expect(prisma.bomItem.delete).toHaveBeenCalledWith({
        where: { id: 'bom-1' },
      });
    });
  });

  describe('tree structure', () => {
    it('should build a tree from flat BOM items', async () => {
      const items = [mockBomItem, mockChildItem];
      (prisma.bomItem.findMany as jest.Mock).mockResolvedValue(items);

      const result = await service.findTree('proj-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bom-1');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('bom-2');
    });
  });
});
