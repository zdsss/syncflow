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

  const mockBomVersion = {
    id: 'bv-1',
    projectId: 'proj-1',
    version: 1,
    description: 'Initial version',
    status: 'draft',
    creatorId: null,
    createdAt: new Date(),
  };

  const mockBomVersion2 = {
    id: 'bv-2',
    projectId: 'proj-1',
    version: 2,
    description: 'Second version',
    status: 'draft',
    creatorId: null,
    createdAt: new Date(),
  };

  // Mock PrismaService with bomVersion model
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      bomItem: {
        findMany: jest.fn().mockResolvedValue([mockBomItem, mockChildItem]),
        findUnique: jest.fn().mockResolvedValue(mockBomItem),
        create: jest.fn().mockResolvedValue(mockBomItem),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        update: jest.fn().mockResolvedValue(mockBomItem),
        delete: jest.fn().mockResolvedValue(mockBomItem),
      },
      bomVersion: {
        findMany: jest.fn().mockResolvedValue([mockBomVersion]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockBomVersion),
        update: jest.fn().mockResolvedValue(mockBomVersion),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        aggregate: jest.fn().mockResolvedValue({ _max: { version: null } }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BomService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
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

  // === Version Management Tests ===

  describe('createVersion', () => {
    it('should create the first version (version=1) when no versions exist', async () => {
      // _max version is null => no versions yet
      mockPrisma.bomVersion.aggregate.mockResolvedValue({ _max: { version: null } });
      mockPrisma.bomVersion.create.mockResolvedValue(mockBomVersion);
      mockPrisma.bomItem.findMany.mockResolvedValue([mockBomItem, mockChildItem]);
      mockPrisma.bomItem.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createVersion('proj-1', 'Initial version');

      expect(mockPrisma.bomVersion.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          version: 1,
          description: 'Initial version',
          status: 'draft',
        },
      });
      // Should deep copy all current BOM items
      expect(mockPrisma.bomItem.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
      });
      expect(mockPrisma.bomItem.createMany).toHaveBeenCalled();
      expect(result).toEqual(mockBomVersion);
    });

    it('should create version N+1 when N versions already exist', async () => {
      mockPrisma.bomVersion.aggregate.mockResolvedValue({ _max: { version: 3 } });
      const newVersion = { ...mockBomVersion, version: 4, id: 'bv-4' };
      mockPrisma.bomVersion.create.mockResolvedValue(newVersion);
      mockPrisma.bomItem.findMany.mockResolvedValue([mockBomItem]);
      mockPrisma.bomItem.createMany.mockResolvedValue({ count: 1 });

      const result = await service.createVersion('proj-1');

      expect(mockPrisma.bomVersion.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          version: 4,
          description: undefined,
          status: 'draft',
        },
      });
      expect(result.version).toBe(4);
    });

    it('should deep copy BOM items with correct version number', async () => {
      mockPrisma.bomVersion.aggregate.mockResolvedValue({ _max: { version: 1 } });
      mockPrisma.bomVersion.create.mockResolvedValue(mockBomVersion2);
      mockPrisma.bomItem.findMany.mockResolvedValue([mockBomItem, mockChildItem]);
      mockPrisma.bomItem.createMany.mockResolvedValue({ count: 2 });

      await service.createVersion('proj-1', 'Snapshot');

      // Should copy items with version=2 (the new version number)
      const createManyCall = mockPrisma.bomItem.createMany.mock.calls[0][0];
      expect(createManyCall.data).toHaveLength(2);
      expect(createManyCall.data[0]).toMatchObject({
        name: mockBomItem.name,
        partNumber: mockBomItem.partNumber,
        projectId: 'proj-1',
        version: 2,
      });
      // Copied items should have no id (new copies)
      expect(createManyCall.data[0].id).toBeUndefined();
    });
  });

  describe('getVersions', () => {
    it('should return all versions for a project ordered by version desc', async () => {
      mockPrisma.bomVersion.findMany.mockResolvedValue([mockBomVersion2, mockBomVersion]);

      const result = await service.getVersions('proj-1');

      expect(mockPrisma.bomVersion.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { version: 'desc' },
      });
      expect(result).toEqual([mockBomVersion2, mockBomVersion]);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no versions exist', async () => {
      mockPrisma.bomVersion.findMany.mockResolvedValue([]);

      const result = await service.getVersions('proj-1');

      expect(result).toEqual([]);
    });
  });

  describe('compareVersions', () => {
    it('should return added items (in B but not in A)', async () => {
      const itemsA = [
        { ...mockBomItem, partNumber: 'CELL-001', version: 1 },
      ];
      const itemsB = [
        { ...mockBomItem, partNumber: 'CELL-001', version: 2 },
        { ...mockChildItem, partNumber: 'TAB-001', version: 2 },
      ];

      mockPrisma.bomItem.findMany
        .mockResolvedValueOnce(itemsA) // version A
        .mockResolvedValueOnce(itemsB); // version B

      const result = await service.compareVersions('proj-1', 1, 2);

      expect(result.added).toHaveLength(1);
      expect(result.added[0].partNumber).toBe('TAB-001');
      expect(result.removed).toHaveLength(0);
      expect(result.modified).toHaveLength(0);
    });

    it('should return removed items (in A but not in B)', async () => {
      const itemsA = [
        { ...mockBomItem, partNumber: 'CELL-001', version: 1 },
        { ...mockChildItem, partNumber: 'TAB-001', version: 1 },
      ];
      const itemsB = [
        { ...mockBomItem, partNumber: 'CELL-001', version: 2 },
      ];

      mockPrisma.bomItem.findMany
        .mockResolvedValueOnce(itemsA)
        .mockResolvedValueOnce(itemsB);

      const result = await service.compareVersions('proj-1', 1, 2);

      expect(result.removed).toHaveLength(1);
      expect(result.removed[0].partNumber).toBe('TAB-001');
      expect(result.added).toHaveLength(0);
    });

    it('should return modified items (in both but with different fields)', async () => {
      const itemsA = [
        { ...mockBomItem, partNumber: 'CELL-001', version: 1, quantity: 100, unitPrice: 120.50 },
      ];
      const itemsB = [
        { ...mockBomItem, partNumber: 'CELL-001', version: 2, quantity: 200, unitPrice: 150.00 },
      ];

      mockPrisma.bomItem.findMany
        .mockResolvedValueOnce(itemsA)
        .mockResolvedValueOnce(itemsB);

      const result = await service.compareVersions('proj-1', 1, 2);

      expect(result.modified).toHaveLength(1);
      expect(result.modified[0].partNumber).toBe('CELL-001');
      expect(result.modified[0].changes).toBeDefined();
      expect(result.modified[0].changes.quantity).toEqual({ old: 100, new: 200 });
      expect(result.modified[0].changes.unitPrice).toBeDefined();
      expect(result.added).toHaveLength(0);
      expect(result.removed).toHaveLength(0);
    });

    it('should handle empty versions', async () => {
      mockPrisma.bomItem.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.compareVersions('proj-1', 1, 2);

      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
      expect(result.modified).toEqual([]);
    });
  });

  describe('rollbackVersion', () => {
    it('should rollback to a target version', async () => {
      const targetVersion = { ...mockBomVersion, version: 1, status: 'draft' };
      const archivedVersion = { ...mockBomVersion2, version: 2, status: 'archived' };
      const newVersion = { ...mockBomVersion, id: 'bv-new', version: 3, description: 'Rollback to version 1' };

      mockPrisma.bomVersion.findFirst.mockResolvedValue(targetVersion);
      mockPrisma.bomVersion.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.bomItem.findMany.mockResolvedValue([mockBomItem, mockChildItem]);
      mockPrisma.bomVersion.aggregate.mockResolvedValue({ _max: { version: 2 } });
      mockPrisma.bomVersion.create.mockResolvedValue(newVersion);
      mockPrisma.bomItem.createMany.mockResolvedValue({ count: 2 });

      const result = await service.rollbackVersion('proj-1', 1);

      // Should find the target version
      expect(mockPrisma.bomVersion.findFirst).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', version: 1 },
      });
      // Should archive the current draft version
      expect(mockPrisma.bomVersion.updateMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', status: 'draft' },
        data: { status: 'archived' },
      });
      // Should deep copy items from target version
      expect(mockPrisma.bomItem.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', version: 1 },
      });
      // Should create new version
      expect(mockPrisma.bomVersion.create).toHaveBeenCalled();
      expect(mockPrisma.bomItem.createMany).toHaveBeenCalled();
    });

    it('should throw if target version not found', async () => {
      mockPrisma.bomVersion.findFirst.mockResolvedValue(null);

      await expect(service.rollbackVersion('proj-1', 99))
        .rejects.toThrow('Version 99 not found for project proj-1');
    });
  });

  // === Import / Export Tests ===

  describe('importFromData', () => {
    it('should import multiple BOM items from data array', async () => {
      const items = [
        { name: 'Battery Cell', partNumber: 'CELL-001', specification: '3.7V', unit: 'pcs', unitPrice: 120.50, quantity: 100 },
        { name: 'Terminal', partNumber: 'TERM-001', specification: 'Al tab', unit: 'pcs', unitPrice: 2.50, quantity: 200 },
      ];

      const createdItems = items.map((item, i) => ({ ...item, id: `bom-new-${i}`, projectId: 'proj-1', version: 1 }));

      // Mock $transaction to execute the array of promises
      mockPrisma.$transaction = jest.fn().mockImplementation((ops: any[]) => {
        return Promise.all(ops.map((_: any, i: number) => createdItems[i]));
      });

      const result = await service.importFromData('proj-1', items);

      expect(result).toEqual({ importedCount: 2 });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should validate required fields (name and partNumber)', async () => {
      const items = [
        { name: '', partNumber: 'CELL-001', specification: '3.7V' },
      ];

      await expect(service.importFromData('proj-1', items))
        .rejects.toThrow('Each item must have a name and partNumber');
    });

    it('should validate required fields when partNumber is missing', async () => {
      const items = [
        { name: 'Battery Cell', partNumber: '', specification: '3.7V' },
      ];

      await expect(service.importFromData('proj-1', items))
        .rejects.toThrow('Each item must have a name and partNumber');
    });

    it('should handle empty items array', async () => {
      mockPrisma.$transaction = jest.fn().mockResolvedValue([]);

      const result = await service.importFromData('proj-1', []);

      expect(result).toEqual({ importedCount: 0 });
    });
  });

  describe('exportToData', () => {
    it('should return all BOM items for a project ordered by partNumber', async () => {
      const items = [mockChildItem, mockBomItem];
      mockPrisma.bomItem.findMany.mockResolvedValue(items);

      const result = await service.exportToData('proj-1');

      expect(result).toEqual(items);
      expect(mockPrisma.bomItem.findMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        orderBy: { partNumber: 'asc' },
      });
    });

    it('should return empty array when no items exist', async () => {
      mockPrisma.bomItem.findMany.mockResolvedValue([]);

      const result = await service.exportToData('proj-1');

      expect(result).toEqual([]);
    });
  });
});
