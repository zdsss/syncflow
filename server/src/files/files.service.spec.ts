import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      file: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  describe('findAll()', () => {
    it('should return paginated files', async () => {
      const mockFiles = [
        { id: 'f1', name: 'doc.pdf', type: 'document', size: BigInt(1024) },
        { id: 'f2', name: 'img.png', type: 'image', size: BigInt(2048) },
      ];
      prisma.file.findMany.mockResolvedValue(mockFiles);
      prisma.file.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockFiles);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should filter by type', async () => {
      prisma.file.findMany.mockResolvedValue([]);
      prisma.file.count.mockResolvedValue(0);

      await service.findAll({ type: 'document', page: 1, pageSize: 10 });

      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false, type: 'document' },
        }),
      );
    });

    it('should filter by projectId', async () => {
      prisma.file.findMany.mockResolvedValue([]);
      prisma.file.count.mockResolvedValue(0);

      await service.findAll({ projectId: 'p1', page: 1, pageSize: 10 });

      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false, projectId: 'p1' },
        }),
      );
    });
  });

  describe('findOne()', () => {
    it('should return a single file', async () => {
      const mockFile = { id: 'f1', name: 'doc.pdf', type: 'document' };
      prisma.file.findFirst.mockResolvedValue(mockFile);

      const result = await service.findOne('f1');

      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockFile);
      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { id: 'f1', isDeleted: false },
        include: { project: true, uploader: true },
      });
    });

    it('should return 404 when file not found', async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result.code).toBe(404);
    });
  });

  describe('create()', () => {
    it('should create a file record', async () => {
      const dto = {
        name: 'test.pdf',
        type: 'document',
        extension: '.pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        uploaderId: 'u1',
        projectId: 'p1',
      };
      const created = { id: 'f1', ...dto };
      prisma.file.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result.code).toBe(0);
      expect(result.data).toEqual(created);
      expect(prisma.file.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update()', () => {
    it('should update a file record', async () => {
      const updated = { id: 'f1', name: 'renamed.pdf' };
      prisma.file.update.mockResolvedValue(updated);

      const result = await service.update('f1', { name: 'renamed.pdf' });

      expect(result.code).toBe(0);
      expect(result.data).toEqual(updated);
      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { name: 'renamed.pdf' },
      });
    });
  });

  describe('remove() - soft delete', () => {
    it('should soft-delete a file', async () => {
      const deleted = { id: 'f1', isDeleted: true };
      prisma.file.update.mockResolvedValue(deleted);

      const result = await service.remove('f1');

      expect(result.code).toBe(0);
      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { isDeleted: true },
      });
    });
  });

  describe('getStats()', () => {
    it('should return storage statistics', async () => {
      prisma.file.count.mockResolvedValue(5);
      prisma.file.aggregate
        .mockResolvedValueOnce({ _sum: { size: BigInt(5000) } })  // used
        .mockResolvedValueOnce({ _sum: { size: null } });         // deleted

      const result = await service.getStats();

      expect(result.code).toBe(0);
      expect(result.data).toHaveProperty('totalFiles');
      expect(result.data).toHaveProperty('usedSpace');
      expect(result.data).toHaveProperty('totalSpace');
      expect(result.data.totalFiles).toBe(5);
      expect(result.data.usedSpace).toBe(BigInt(5000));
    });
  });

  describe('uploadFile()', () => {
    const mockMulterFile = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 2048,
      destination: '/tmp/uploads',
      filename: 'abc123.pdf',
      path: '/tmp/uploads/abc123.pdf',
      buffer: Buffer.from(''),
      stream: null as any,
    } as Express.Multer.File;

    it('should create file record in database with correct metadata', async () => {
      prisma.file.findFirst.mockResolvedValue(null); // no existing file
      prisma.file.create.mockResolvedValue({
        id: 'f-new',
        name: 'test.pdf',
        type: 'document',
        extension: '.pdf',
        size: BigInt(2048),
        path: '/uploads/abc123.pdf',
        version: 1,
        uploaderId: 'u1',
        projectId: 'p1',
      });

      const result = await service.uploadFile(mockMulterFile, {
        uploaderId: 'u1',
        projectId: 'p1',
      });

      expect(result.code).toBe(0);
      expect(result.data).toBeDefined();
      expect(prisma.file.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'test.pdf',
            extension: '.pdf',
            size: BigInt(2048),
            path: '/uploads/abc123.pdf',
            uploaderId: 'u1',
            projectId: 'p1',
            version: 1,
          }),
        }),
      );
    });

    it('should set version to 1 for new files', async () => {
      prisma.file.findFirst.mockResolvedValue(null);
      prisma.file.create.mockResolvedValue({
        id: 'f-new',
        version: 1,
      });

      const result = await service.uploadFile(mockMulterFile, {
        uploaderId: 'u1',
      });

      expect(result.code).toBe(0);
      expect(prisma.file.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 1 }),
        }),
      );
    });

    it('should increment version for same-name files in same project', async () => {
      prisma.file.findFirst.mockResolvedValue({ version: 2 });
      prisma.file.create.mockResolvedValue({
        id: 'f-new',
        version: 3,
      });

      const result = await service.uploadFile(mockMulterFile, {
        uploaderId: 'u1',
        projectId: 'p1',
      });

      expect(result.code).toBe(0);
      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { name: 'test.pdf', projectId: 'p1', isDeleted: false },
        orderBy: { version: 'desc' },
      });
      expect(prisma.file.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 3 }),
        }),
      );
    });
  });
});
