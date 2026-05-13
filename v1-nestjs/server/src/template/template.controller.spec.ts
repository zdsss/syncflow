import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

describe('TemplateController', () => {
  let controller: TemplateController;
  let service: TemplateService;

  const mockTemplate = { id: 'tpl-1', name: 'Standard Assembly', type: 'process' };
  const mockCategory = { id: 'cat-1', name: 'Manufacturing' };

  const mockService = {
    findAll: jest.fn().mockResolvedValue([mockTemplate]),
    getCategories: jest.fn().mockResolvedValue([mockCategory]),
    findOne: jest.fn().mockResolvedValue(mockTemplate),
    exportTemplate: jest.fn().mockResolvedValue({ data: 'exported' }),
    previewTemplate: jest.fn().mockResolvedValue({ content: 'preview' }),
    importTemplate: jest.fn().mockResolvedValue(mockTemplate),
    create: jest.fn().mockResolvedValue(mockTemplate),
    applyTemplate: jest.fn().mockResolvedValue({ projectId: 'proj-1' }),
    duplicateTemplate: jest.fn().mockResolvedValue({ ...mockTemplate, id: 'tpl-2' }),
    update: jest.fn().mockResolvedValue(mockTemplate),
    remove: jest.fn().mockResolvedValue(mockTemplate),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [{ provide: TemplateService, useValue: mockService }],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
    service = module.get<TemplateService>(TemplateService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return templates', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ code: 0, data: [mockTemplate] });
    });

    it('should filter by type', async () => {
      await controller.findAll('process');
      expect(service.findAll).toHaveBeenCalledWith('process');
    });
  });

  describe('getCategories', () => {
    it('should return categories', async () => {
      const result = await controller.getCategories();
      expect(service.getCategories).toHaveBeenCalled();
      expect(result).toEqual({ code: 0, data: [mockCategory] });
    });
  });

  describe('findOne', () => {
    it('should return a template', async () => {
      const result = await controller.findOne('tpl-1');
      expect(service.findOne).toHaveBeenCalledWith('tpl-1');
      expect(result).toEqual({ code: 0, data: mockTemplate });
    });
  });

  describe('exportTemplate', () => {
    it('should export a template', async () => {
      const result = await controller.exportTemplate('tpl-1');
      expect(service.exportTemplate).toHaveBeenCalledWith('tpl-1');
      expect(result).toEqual({ code: 0, data: { data: 'exported' } });
    });
  });

  describe('preview', () => {
    it('should preview a template', async () => {
      const result = await controller.preview('tpl-1');
      expect(service.previewTemplate).toHaveBeenCalledWith('tpl-1');
      expect(result).toEqual({ code: 0, data: { content: 'preview' } });
    });
  });

  describe('importTemplate', () => {
    it('should import a template', async () => {
      const body = { name: 'Imported', creatorId: 'user-1' };
      const result = await controller.importTemplate(body);
      expect(service.importTemplate).toHaveBeenCalledWith(body, 'user-1');
      expect(result).toEqual({ code: 0, data: mockTemplate });
    });

    it('should default creatorId to system', async () => {
      const body = { name: 'Imported' };
      await controller.importTemplate(body);
      expect(service.importTemplate).toHaveBeenCalledWith(body, 'system');
    });
  });

  describe('create', () => {
    it('should create a template', async () => {
      const dto = { name: 'New Template', type: 'process' };
      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ code: 0, data: mockTemplate });
    });
  });

  describe('apply', () => {
    it('should apply a template', async () => {
      const body = { name: 'New Project', leaderId: 'user-1', startDate: '2024-01-01' };
      const result = await controller.apply('tpl-1', body);
      expect(service.applyTemplate).toHaveBeenCalledWith('tpl-1', body);
      expect(result).toEqual({ code: 0, data: { projectId: 'proj-1' } });
    });
  });

  describe('duplicate', () => {
    it('should duplicate a template', async () => {
      const result = await controller.duplicate('tpl-1');
      expect(service.duplicateTemplate).toHaveBeenCalledWith('tpl-1');
      expect(result).toEqual({ code: 0, data: { ...mockTemplate, id: 'tpl-2' } });
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update('tpl-1', dto as any);
      expect(service.update).toHaveBeenCalledWith('tpl-1', dto);
      expect(result).toEqual({ code: 0, data: mockTemplate });
    });
  });

  describe('remove', () => {
    it('should delete a template', async () => {
      const result = await controller.remove('tpl-1');
      expect(service.remove).toHaveBeenCalledWith('tpl-1');
      expect(result).toEqual({ code: 0, data: mockTemplate });
    });
  });
});
