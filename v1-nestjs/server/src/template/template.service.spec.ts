import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplateService } from './template.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let prisma: PrismaService;

  const mockTemplate = {
    id: 'template-1',
    name: 'Project Template',
    type: 'project',
    description: 'A test template',
    content: {
      phases: [
        {
          name: 'Planning',
          tasks: [
            { name: 'Define requirements', priority: 'HIGH' },
            { name: 'Create timeline', priority: 'MEDIUM' },
          ],
        },
        {
          name: 'Development',
          tasks: [
            { name: 'Implement core features', priority: 'HIGH' },
          ],
        },
      ],
    },
    usageCount: 0,
    creatorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'project-1',
    name: 'New Project',
    leaderId: 'user-1',
    startDate: new Date('2025-01-01'),
    status: 'NOT_STARTED',
    phase: 'PLANNING',
    completion: 0,
    category: 'default',
    endDate: new Date('2025-12-31'),
  };

  const mockTask = {
    id: 'task-1',
    name: 'Define requirements',
    projectId: 'project-1',
    priority: 'HIGH',
    status: 'NOT_STARTED',
    progress: 0,
    assigneeId: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: PrismaService,
          useValue: {
            template: {
              findMany: jest.fn().mockResolvedValue([mockTemplate]),
              findUnique: jest.fn().mockResolvedValue(mockTemplate),
              create: jest.fn().mockResolvedValue(mockTemplate),
              update: jest.fn().mockResolvedValue({ ...mockTemplate, usageCount: 1 }),
              delete: jest.fn().mockResolvedValue(mockTemplate),
            },
            project: {
              create: jest.fn().mockResolvedValue(mockProject),
            },
            task: {
              create: jest.fn().mockImplementation((args) =>
        Promise.resolve({ ...mockTask, ...args.data }),
      ),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockTemplate]);
      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by type', async () => {
      await service.findAll('project');
      expect(prisma.template.findMany).toHaveBeenCalledWith({
        where: { type: 'project' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single template', async () => {
      const result = await service.findOne('template-1');
      expect(result).toEqual(mockTemplate);
      expect(prisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });
  });

  describe('create', () => {
    it('should create a new template', async () => {
      const createDto = {
        name: 'New Template',
        type: 'task',
        content: { fields: ['priority'] },
        creatorId: 'user-1',
      };
      const result = await service.create(createDto);
      expect(result).toEqual(mockTemplate);
      expect(prisma.template.create).toHaveBeenCalledWith({ data: createDto });
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const updateDto = { name: 'Updated Template' };
      const result = await service.update('template-1', updateDto);
      expect(result).toEqual({ ...mockTemplate, usageCount: 1 });
      expect(prisma.template.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a template', async () => {
      const result = await service.remove('template-1');
      expect(result).toEqual(mockTemplate);
      expect(prisma.template.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });
  });

  describe('applyTemplate', () => {
    it('should find the template', async () => {
      await service.applyTemplate('template-1', {
        name: 'New Project',
        leaderId: 'user-1',
        startDate: '2025-01-01',
      });

      expect(prisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });

    it('should throw if template not found', async () => {
      (prisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.applyTemplate('nonexistent', {
          name: 'New Project',
          leaderId: 'user-1',
          startDate: '2025-01-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should parse template content JSON and create a new project', async () => {
      await service.applyTemplate('template-1', {
        name: 'New Project',
        leaderId: 'user-1',
        startDate: '2025-01-01',
      });

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Project',
          leaderId: 'user-1',
          startDate: new Date('2025-01-01'),
          status: 'NOT_STARTED',
          phase: 'PLANNING',
          completion: 0,
        }),
      });
    });

    it('should create default tasks from template phases', async () => {
      await service.applyTemplate('template-1', {
        name: 'New Project',
        leaderId: 'user-1',
        startDate: '2025-01-01',
      });

      // Template has 3 tasks total across 2 phases
      expect(prisma.task.create).toHaveBeenCalledTimes(3);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Define requirements',
          projectId: 'project-1',
          priority: 'HIGH',
          status: 'NOT_STARTED',
          progress: 0,
        }),
      });
    });

    it('should return the created project with tasks', async () => {
      const result = await service.applyTemplate('template-1', {
        name: 'New Project',
        leaderId: 'user-1',
        startDate: '2025-01-01',
      });

      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('tasks');
      expect(result.project).toEqual(mockProject);
      expect(result.tasks).toHaveLength(3);
    });

    it('should increment template usage count', async () => {
      await service.applyTemplate('template-1', {
        name: 'New Project',
        leaderId: 'user-1',
        startDate: '2025-01-01',
      });

      expect(prisma.template.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { usageCount: { increment: 1 } },
      });
    });
  });

  describe('getCategories', () => {
    it('should return distinct types from all templates', async () => {
      (prisma.template.findMany as jest.Mock).mockResolvedValue([
        { type: 'project' },
        { type: 'task' },
        { type: 'document' },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual(['project', 'task', 'document']);
      expect(prisma.template.findMany).toHaveBeenCalledWith({
        select: { type: true },
        distinct: ['type'],
      });
    });

    it('should return empty array when no templates', async () => {
      (prisma.template.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCategories();

      expect(result).toEqual([]);
    });
  });

  describe('duplicateTemplate', () => {
    it('should create a copy of an existing template with incremented name', async () => {
      const duplicatedTemplate = {
        ...mockTemplate,
        id: 'template-2',
        name: 'Project Template (副本)',
        usageCount: 0,
      };
      (prisma.template.create as jest.Mock).mockResolvedValue(duplicatedTemplate);

      const result = await service.duplicateTemplate('template-1');

      expect(result.name).toBe('Project Template (副本)');
      expect(prisma.template.create).toHaveBeenCalledWith({
        data: {
          name: 'Project Template (副本)',
          type: 'project',
          description: 'A test template',
          content: mockTemplate.content,
          usageCount: 0,
          creatorId: 'user-1',
        },
      });
    });

    it('should copy all fields except id, usageCount, creatorId', async () => {
      const duplicatedTemplate = {
        ...mockTemplate,
        id: 'template-2',
        name: 'Project Template (副本)',
        usageCount: 0,
      };
      (prisma.template.create as jest.Mock).mockResolvedValue(duplicatedTemplate);

      await service.duplicateTemplate('template-1');

      const createCall = (prisma.template.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data).not.toHaveProperty('id');
      expect(createCall.data.creatorId).toBe('user-1');
      expect(createCall.data.usageCount).toBe(0);
      expect(createCall.data.type).toBe(mockTemplate.type);
      expect(createCall.data.description).toBe(mockTemplate.description);
      expect(createCall.data.content).toEqual(mockTemplate.content);
    });

    it('should throw if template not found', async () => {
      (prisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.duplicateTemplate('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exportTemplate', () => {
    it('should return template data formatted for JSON export', async () => {
      const result = await service.exportTemplate('template-1');

      expect(prisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });

      expect(result).toHaveProperty('name', 'Project Template');
      expect(result).toHaveProperty('type', 'project');
      expect(result).toHaveProperty('description', 'A test template');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('exportVersion', '1.0');
      expect(result).toHaveProperty('exportedAt');
      // Should NOT include id, usageCount, creatorId, createdAt, updatedAt
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('usageCount');
      expect(result).not.toHaveProperty('creatorId');
    });

    it('should throw if template not found', async () => {
      (prisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.exportTemplate('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('importTemplate', () => {
    it('should create a template from JSON import data', async () => {
      const importData = {
        name: 'Imported Template',
        type: 'project',
        description: 'An imported template',
        content: { phases: [{ name: 'Phase 1', tasks: [{ name: 'Task 1' }] }] },
        exportVersion: '1.0',
      };

      const result = await service.importTemplate(importData, 'user-2');

      expect(prisma.template.create).toHaveBeenCalledWith({
        data: {
          name: 'Imported Template',
          type: 'project',
          description: 'An imported template',
          content: importData.content,
          usageCount: 0,
          creatorId: 'user-2',
        },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw if required fields are missing', async () => {
      const invalidData = { type: 'project' }; // missing name and content

      await expect(service.importTemplate(invalidData, 'user-2')).rejects.toThrow(
        'Invalid template data: missing required fields (name, type, content)',
      );
    });

    it('should throw if content is not an object', async () => {
      const invalidData = { name: 'Test', type: 'project', content: 'not-an-object' };

      await expect(service.importTemplate(invalidData, 'user-2')).rejects.toThrow(
        'Invalid template data: content must be an object',
      );
    });
  });

  describe('previewTemplate', () => {
    it('should find the template', async () => {
      await service.previewTemplate('template-1');

      expect(prisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });

    it('should throw if template not found', async () => {
      (prisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.previewTemplate('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the template content (phases, tasks, milestones)', async () => {
      const result = await service.previewTemplate('template-1') as any;

      expect(result).toEqual(mockTemplate.content);
      expect(result).toHaveProperty('phases');
      expect(result.phases).toHaveLength(2);
    });
  });
});
