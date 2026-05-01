import { Test, TestingModule } from '@nestjs/testing';
import { PersonalService } from './personal.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PersonalService', () => {
  let service: PersonalService;
  let prisma: PrismaService;

  const mockFile = {
    id: 'file-1',
    name: 'personal-doc.pdf',
    type: 'document',
    extension: '.pdf',
    size: BigInt(1024),
    path: '/uploads/personal-doc.pdf',
    parentFolderId: null,
    uploaderId: 'user-1',
    version: 1,
    projectId: null,
    downloadCount: 0,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalService,
        {
          provide: PrismaService,
          useValue: {
            file: {
              findMany: jest.fn().mockResolvedValue([mockFile]),
              create: jest.fn().mockResolvedValue(mockFile),
              update: jest.fn().mockResolvedValue(mockFile),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PersonalService>(PersonalService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return personal files for a user', async () => {
      const result = await service.findAll('user-1');
      expect(result).toEqual([mockFile]);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          uploaderId: 'user-1',
          projectId: null,
          isDeleted: false,
        },
        include: { uploader: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create a personal file record', async () => {
      const createDto = {
        name: 'new-file.pdf',
        type: 'document',
        size: 2048,
        path: '/uploads/new-file.pdf',
        uploaderId: 'user-1',
      };
      const result = await service.create(createDto);
      expect(result).toEqual(mockFile);
      expect(prisma.file.create).toHaveBeenCalledWith({
        data: { ...createDto, projectId: null },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete a personal file', async () => {
      const result = await service.remove('file-1');
      expect(result).toEqual(mockFile);
      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: 'file-1' },
        data: { isDeleted: true },
      });
    });
  });
});
