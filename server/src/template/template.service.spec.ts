import { Test, TestingModule } from '@nestjs/testing';
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
    content: { fields: ['name', 'description'] },
    usageCount: 0,
    creatorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
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
              update: jest.fn().mockResolvedValue(mockTemplate),
              delete: jest.fn().mockResolvedValue(mockTemplate),
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
      expect(result).toEqual(mockTemplate);
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
});
