import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 'proj-1', name: 'Test' }),
    create: jest.fn().mockResolvedValue({ id: 'proj-1', name: 'New' }),
    update: jest.fn().mockResolvedValue({ id: 'proj-1', name: 'Updated' }),
    remove: jest.fn().mockResolvedValue({ id: 'proj-1' }),
    searchProjects: jest.fn().mockResolvedValue([]),
    getProjectTree: jest.fn().mockResolvedValue([]),
    duplicateProject: jest.fn().mockResolvedValue({ id: 'proj-2', name: 'Copy' }),
    getMilestones: jest.fn().mockResolvedValue([]),
    setMilestone: jest.fn().mockResolvedValue({}),
    importProjects: jest.fn().mockResolvedValue({ imported: 0, errors: [] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /projects/import', () => {
    it('should call importProjects with data array', async () => {
      const body = {
        data: [
          { name: 'Project A', description: 'Desc A' },
          { name: 'Project B', description: 'Desc B' },
        ],
      };
      mockService.importProjects.mockResolvedValueOnce({ imported: 2, errors: [] });

      const result = await controller.importProjects(body);

      expect(service.importProjects).toHaveBeenCalledWith(body.data);
      expect(result.code).toBe(0);
      expect(result.data.imported).toBe(2);
      expect(result.data.errors).toHaveLength(0);
    });

    it('should return errors for invalid rows', async () => {
      const body = {
        data: [
          { name: 'Valid', description: 'OK' },
          { description: 'No name' },
        ],
      };
      mockService.importProjects.mockResolvedValueOnce({
        imported: 1,
        errors: ['Row 2: missing required field "name"'],
      });

      const result = await controller.importProjects(body);

      expect(result.data.imported).toBe(1);
      expect(result.data.errors).toHaveLength(1);
    });

    it('should handle empty data', async () => {
      mockService.importProjects.mockResolvedValueOnce({ imported: 0, errors: [] });

      const result = await controller.importProjects({ data: [] });

      expect(service.importProjects).toHaveBeenCalledWith([]);
      expect(result.data.imported).toBe(0);
    });

    it('should handle missing data field', async () => {
      mockService.importProjects.mockResolvedValueOnce({ imported: 0, errors: [] });

      const result = await controller.importProjects({} as any);

      expect(service.importProjects).toHaveBeenCalledWith([]);
    });
  });
});
