import { Test, TestingModule } from '@nestjs/testing';
import { BomController } from './bom.controller';
import { BomService } from './bom.service';

describe('BomController', () => {
  let controller: BomController;
  let service: BomService;

  const mockVersion = {
    id: 'bv-1',
    projectId: 'proj-1',
    version: 1,
    description: 'Initial',
    status: 'draft',
    creatorId: null,
    createdAt: new Date(),
  };

  const mockService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
    findTree: jest.fn().mockResolvedValue([]),
    createVersion: jest.fn().mockResolvedValue(mockVersion),
    getVersions: jest.fn().mockResolvedValue([mockVersion]),
    compareVersions: jest.fn().mockResolvedValue({ added: [], removed: [], modified: [] }),
    rollbackVersion: jest.fn().mockResolvedValue(mockVersion),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BomController],
      providers: [
        { provide: BomService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<BomController>(BomController);
    service = module.get<BomService>(BomService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /bom/versions', () => {
    it('should create a new version', async () => {
      const result = await controller.createVersion({
        projectId: 'proj-1',
        description: 'Initial',
      });

      expect(mockService.createVersion).toHaveBeenCalledWith('proj-1', 'Initial');
      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockVersion);
    });
  });

  describe('GET /bom/versions', () => {
    it('should return versions for a project', async () => {
      const result = await controller.getVersions('proj-1');

      expect(mockService.getVersions).toHaveBeenCalledWith('proj-1');
      expect(result.code).toBe(0);
      expect(result.data).toEqual([mockVersion]);
    });
  });

  describe('GET /bom/compare', () => {
    it('should compare two versions', async () => {
      const result = await controller.compareVersions('proj-1', '1', '2');

      expect(mockService.compareVersions).toHaveBeenCalledWith('proj-1', 1, 2);
      expect(result.code).toBe(0);
      expect(result.data).toEqual({ added: [], removed: [], modified: [] });
    });
  });

  describe('POST /bom/rollback', () => {
    it('should rollback to a target version', async () => {
      const result = await controller.rollbackVersion({
        projectId: 'proj-1',
        targetVersion: 1,
      });

      expect(mockService.rollbackVersion).toHaveBeenCalledWith('proj-1', 1);
      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockVersion);
    });
  });
});
