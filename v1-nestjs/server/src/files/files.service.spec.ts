import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketService } from '../websocket/websocket.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: any;
  let wsService: WebSocketService;
  let auditService: AuditService;

  beforeEach(async () => {
    prisma = {
      file: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn(),
      },
      fileVersion: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (fns: any[]) => {
        const results = [];
        for (const fn of fns) {
          results.push(await fn(prisma));
        }
        return results;
      }),
    };

    const mockWsService = {
      emitTaskStatusChanged: jest.fn(),
      emitTaskAssigned: jest.fn(),
      emitNotification: jest.fn(),
      emitApprovalUpdated: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: WebSocketService, useValue: mockWsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    wsService = module.get<WebSocketService>(WebSocketService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('findAll()', () => {
    it('should return paginated files', async () => {
      const mockFiles = [
        { id: 'f1', name: 'doc.pdf', type: 'DOCUMENT', size: 1024 },
        { id: 'f2', name: 'img.png', type: 'IMAGE', size: 2048 },
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
      const mockFile = { id: 'f1', name: 'doc.pdf', type: 'DOCUMENT' };
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
        type: 'DOCUMENT',
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
        .mockResolvedValueOnce({ _sum: { size: 5000 } })  // used
        .mockResolvedValueOnce({ _sum: { size: null } });         // deleted

      const result = await service.getStats();

      expect(result.code).toBe(0);
      expect(result.data).toHaveProperty('totalFiles');
      expect(result.data).toHaveProperty('usedSpace');
      expect(result.data).toHaveProperty('totalSpace');
      expect(result.data.totalFiles).toBe(5);
      expect(result.data.usedSpace).toBe(5000);
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
        type: 'DOCUMENT',
        extension: '.pdf',
        size: 2048,
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
            size: 2048,
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

    it('should emit notification when file is uploaded', async () => {
      prisma.file.findFirst.mockResolvedValue(null);
      prisma.file.create.mockResolvedValue({
        id: 'f-new',
        name: 'test.pdf',
        type: 'DOCUMENT',
        extension: '.pdf',
        size: 2048,
        path: '/uploads/abc123.pdf',
        version: 1,
        uploaderId: 'u1',
        projectId: 'p1',
      });
      prisma.fileVersion.create.mockResolvedValue({});

      await service.uploadFile(mockMulterFile, {
        uploaderId: 'u1',
        projectId: 'p1',
      });

      expect(wsService.emitNotification).toHaveBeenCalledWith(
        'u1',
        {
          title: 'File Uploaded',
          desc: 'File "test.pdf" has been uploaded',
          type: 'file_uploaded',
        },
      );
    });

    it('should create a FileVersion record on upload', async () => {
      prisma.file.findFirst.mockResolvedValue(null);
      prisma.file.create.mockResolvedValue({
        id: 'f-new',
        name: 'test.pdf',
        type: 'DOCUMENT',
        extension: '.pdf',
        size: 2048,
        path: '/uploads/abc123.pdf',
        version: 1,
        uploaderId: 'u1',
        projectId: 'p1',
      });
      prisma.fileVersion.create.mockResolvedValue({});

      await service.uploadFile(mockMulterFile, {
        uploaderId: 'u1',
        projectId: 'p1',
      });

      expect(prisma.fileVersion.create).toHaveBeenCalledWith({
        data: {
          fileId: 'f-new',
          version: 1,
          size: 2048,
          path: '/uploads/abc123.pdf',
          uploaderId: 'u1',
          comment: null,
        },
      });
    });

    it('should create an audit log entry on file upload', async () => {
      prisma.file.findFirst.mockResolvedValue(null);
      prisma.file.create.mockResolvedValue({
        id: 'f-new',
        name: 'test.pdf',
        type: 'DOCUMENT',
        extension: '.pdf',
        size: 2048,
        path: '/uploads/abc123.pdf',
        version: 1,
        uploaderId: 'u1',
        projectId: 'p1',
      });
      prisma.fileVersion.create.mockResolvedValue({});

      await service.uploadFile(mockMulterFile, {
        uploaderId: 'u1',
        projectId: 'p1',
      });

      expect(auditService.log).toHaveBeenCalledWith('u1', 'upload', 'file', 'f-new', {
        fileName: 'test.pdf',
        size: 2048,
        version: 1,
      });
    });

    it('should reject files with dangerous extensions', async () => {
      const dangerousFile = {
        ...mockMulterFile,
        originalname: 'malware.exe',
        filename: 'malware.exe',
      } as Express.Multer.File;

      await expect(
        service.uploadFile(dangerousFile, { uploaderId: 'u1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFileVersions()', () => {
    it('should return list of versions for a file, ordered by version desc', async () => {
      const mockVersions = [
        { id: 'fv3', fileId: 'f1', version: 3, size: 3072, path: '/uploads/v3.pdf' },
        { id: 'fv2', fileId: 'f1', version: 2, size: 2048, path: '/uploads/v2.pdf' },
        { id: 'fv1', fileId: 'f1', version: 1, size: 1024, path: '/uploads/v1.pdf' },
      ];
      prisma.fileVersion.findMany.mockResolvedValue(mockVersions);

      const result = await service.getFileVersions('f1');

      expect(result.code).toBe(0);
      expect(result.data).toEqual(mockVersions);
      expect(prisma.fileVersion.findMany).toHaveBeenCalledWith({
        where: { fileId: 'f1' },
        orderBy: { version: 'desc' },
      });
    });
  });

  describe('rollbackVersion()', () => {
    it('should rollback to a target version', async () => {
      const targetVersion = {
        id: 'fv1',
        fileId: 'f1',
        version: 1,
        size: 1024,
        path: '/uploads/v1.pdf',
        uploaderId: 'u1',
      };
      const updatedFile = {
        id: 'f1',
        name: 'doc.pdf',
        version: 2,
        size: 1024,
        path: '/uploads/v1.pdf',
      };

      prisma.fileVersion.findFirst.mockResolvedValue(targetVersion);
      prisma.file.update.mockResolvedValue(updatedFile);
      prisma.fileVersion.create.mockResolvedValue({});

      const result = await service.rollbackVersion('f1', 1);

      expect(result.code).toBe(0);
      expect(result.data).toEqual(updatedFile);

      // Should find the target version
      expect(prisma.fileVersion.findFirst).toHaveBeenCalledWith({
        where: { fileId: 'f1', version: 1 },
      });

      // Should update the file's path and size to match target version
      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: {
          path: '/uploads/v1.pdf',
          size: 1024,
          version: 2, // incremented
        },
      });

      // Should create a new version record for the rollback
      expect(prisma.fileVersion.create).toHaveBeenCalledWith({
        data: {
          fileId: 'f1',
          version: 2,
          size: 1024,
          path: '/uploads/v1.pdf',
          uploaderId: 'u1',
          comment: 'Rollback to version 1',
        },
      });
    });

    it('should throw if target version not found', async () => {
      prisma.fileVersion.findFirst.mockResolvedValue(null);

      await expect(service.rollbackVersion('f1', 99)).rejects.toThrow(
        'Version 99 not found for file f1',
      );
    });
  });

  // === Fix A: File Breadcrumbs ===
  describe('getBreadcrumbs()', () => {
    it('should return breadcrumb chain from root to current file', async () => {
      // Path: root > folder1 > folder2 > file
      // When traversing file -> folder2 -> folder1 -> root (parentFolderId = null)
      const file = { id: 'file1', name: 'doc.pdf', parentFolderId: 'folder2' };
      const folder2 = { id: 'folder2', name: 'folder2', parentFolderId: 'folder1' };
      const folder1 = { id: 'folder1', name: 'folder1', parentFolderId: 'root1' };
      const root = { id: 'root1', name: 'root', parentFolderId: null };

      prisma.file.findUnique
        .mockResolvedValueOnce(file)
        .mockResolvedValueOnce(folder2)
        .mockResolvedValueOnce(folder1)
        .mockResolvedValueOnce(root);

      const result = await service.getBreadcrumbs('file1');

      expect(result).toEqual([
        { id: 'root1', name: 'root' },
        { id: 'folder1', name: 'folder1' },
        { id: 'folder2', name: 'folder2' },
        { id: 'file1', name: 'doc.pdf' },
      ]);
      expect(prisma.file.findUnique).toHaveBeenCalledTimes(4);
    });

    it('should return single-item array if file has no parentFolderId', async () => {
      const file = { id: 'file1', name: 'doc.pdf', parentFolderId: null };
      prisma.file.findUnique.mockResolvedValueOnce(file);

      const result = await service.getBreadcrumbs('file1');

      expect(result).toEqual([{ id: 'file1', name: 'doc.pdf' }]);
      expect(prisma.file.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return empty array if file not found', async () => {
      prisma.file.findUnique.mockResolvedValueOnce(null);

      const result = await service.getBreadcrumbs('nonexistent');

      expect(result).toEqual([]);
    });
  });

  // === Fix B: File Permissions ===
  describe('setPermission()', () => {
    it('should create or update a permission and return the record', async () => {
      const perm = { id: 'fp1', fileId: 'f1', userId: 'u1', level: 'edit' };
      (prisma as any).filePermission = { upsert: jest.fn().mockResolvedValue(perm) };

      const result = await service.setPermission('f1', 'u1', 'edit');

      expect(result).toEqual(perm);
      expect((prisma as any).filePermission.upsert).toHaveBeenCalledWith({
        where: { fileId_userId: { fileId: 'f1', userId: 'u1' } },
        update: { level: 'edit' },
        create: { fileId: 'f1', userId: 'u1', level: 'edit' },
      });
    });
  });

  describe('getPermission()', () => {
    it('should return the permission for a user on a file', async () => {
      const perm = { id: 'fp1', fileId: 'f1', userId: 'u1', level: 'edit' };
      (prisma as any).filePermission = { findUnique: jest.fn().mockResolvedValue(perm) };

      const result = await service.getPermission('f1', 'u1');

      expect(result).toEqual(perm);
      expect((prisma as any).filePermission.findUnique).toHaveBeenCalledWith({
        where: { fileId_userId: { fileId: 'f1', userId: 'u1' } },
      });
    });

    it('should return null if no permission exists', async () => {
      (prisma as any).filePermission = { findUnique: jest.fn().mockResolvedValue(null) };

      const result = await service.getPermission('f1', 'u1');

      expect(result).toBeNull();
    });
  });

  describe('removePermission()', () => {
    it('should remove a user permission on a file', async () => {
      const perm = { id: 'fp1', fileId: 'f1', userId: 'u1', level: 'view' };
      (prisma as any).filePermission = { delete: jest.fn().mockResolvedValue(perm) };

      const result = await service.removePermission('f1', 'u1');

      expect(result).toEqual(perm);
      expect((prisma as any).filePermission.delete).toHaveBeenCalledWith({
        where: { fileId_userId: { fileId: 'f1', userId: 'u1' } },
      });
    });

    it('should throw if no permission exists to remove', async () => {
      (prisma as any).filePermission = {
        delete: jest.fn().mockRejectedValue(new Error('Record to delete does not exist')),
      };

      await expect(service.removePermission('f1', 'u1')).rejects.toThrow(
        'Permission not found',
      );
    });
  });

  describe('getFilePermissions()', () => {
    it('should return all permissions for a file', async () => {
      const perms = [
        { id: 'fp1', fileId: 'f1', userId: 'u1', level: 'edit' },
        { id: 'fp2', fileId: 'f1', userId: 'u2', level: 'view' },
      ];
      (prisma as any).filePermission = { findMany: jest.fn().mockResolvedValue(perms) };

      const result = await service.getFilePermissions('f1');

      expect(result).toEqual(perms);
      expect((prisma as any).filePermission.findMany).toHaveBeenCalledWith({
        where: { fileId: 'f1' },
      });
    });
  });

  // === Fix A: File preview - getFileInfo ===
  describe('getFileInfo()', () => {
    it('should return file metadata with permissions and recent versions', async () => {
      const mockFile = {
        id: 'f1',
        name: 'doc.pdf',
        type: 'DOCUMENT',
        extension: '.pdf',
        size: 1024,
        path: '/uploads/doc.pdf',
        version: 2,
        uploaderId: 'u1',
        projectId: 'p1',
        createdAt: new Date('2024-01-15'),
        downloadCount: 5,
        isDeleted: false,
        permissions: [
          { userId: 'u1', level: 'edit' },
          { userId: 'u2', level: 'view' },
        ],
        versions: [
          { id: 'fv2', fileId: 'f1', version: 2, size: 2048, path: '/uploads/doc2.pdf' },
          { id: 'fv1', fileId: 'f1', version: 1, size: 1024, path: '/uploads/doc1.pdf' },
        ],
      };
      prisma.file.findUnique.mockResolvedValue(mockFile);

      const result = await service.getFileInfo('f1');

      expect(result).toEqual(mockFile);
      expect(result.id).toBe('f1');
      expect(result.name).toBe('doc.pdf');
      expect(result.type).toBe('DOCUMENT');
      expect(result.extension).toBe('.pdf');
      expect(result.size).toBe(1024);
      expect(result.path).toBe('/uploads/doc.pdf');
      expect(result.version).toBe(2);
      expect(result.uploaderId).toBe('u1');
      expect(result.projectId).toBe('p1');
      expect(result.createdAt).toBeDefined();
      expect(result.downloadCount).toBe(5);
      expect(result.permissions).toHaveLength(2);
      expect(result.versions).toHaveLength(2);
      expect(prisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: 'f1' },
        include: {
          permissions: { select: { userId: true, level: true } },
          versions: { orderBy: { version: 'desc' }, take: 5 },
        },
      });
    });

    it('should throw NotFoundException for soft-deleted files', async () => {
      const mockDeletedFile = { id: 'f1', isDeleted: true };
      prisma.file.findUnique.mockResolvedValue(mockDeletedFile);

      await expect(service.getFileInfo('f1')).rejects.toThrow('File not found');
    });

    it('should throw NotFoundException if file not found', async () => {
      prisma.file.findUnique.mockResolvedValue(null);

      await expect(service.getFileInfo('nonexistent')).rejects.toThrow('File not found');
    });
  });

  describe('getFilePath()', () => {
    it('should return the file path, name, and type for download', async () => {
      const mockFile = {
        id: 'f1',
        name: 'doc.pdf',
        type: 'DOCUMENT',
        path: '/uploads/doc.pdf',
        isDeleted: false,
        downloadCount: 0,
      };
      prisma.file.findUnique.mockResolvedValue(mockFile);
      prisma.file.update.mockResolvedValue({ ...mockFile, downloadCount: 1 });

      const result = await service.getFilePath('f1');

      expect(result).toEqual({
        path: '/uploads/doc.pdf',
        name: 'doc.pdf',
        type: 'DOCUMENT',
      });
      expect(prisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: 'f1' },
      });
    });

    it('should increment downloadCount', async () => {
      const mockFile = {
        id: 'f1',
        name: 'doc.pdf',
        type: 'DOCUMENT',
        path: '/uploads/doc.pdf',
        isDeleted: false,
        downloadCount: 5,
      };
      prisma.file.findUnique.mockResolvedValue(mockFile);
      prisma.file.update.mockResolvedValue({ ...mockFile, downloadCount: 6 });

      await service.getFilePath('f1');

      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: 'f1' },
        data: { downloadCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException if file is soft-deleted', async () => {
      prisma.file.findUnique.mockResolvedValue({
        id: 'f1',
        isDeleted: true,
      });

      await expect(service.getFilePath('f1')).rejects.toThrow('File not found');
    });

    it('should throw NotFoundException if file not found', async () => {
      prisma.file.findUnique.mockResolvedValue(null);

      await expect(service.getFilePath('nonexistent')).rejects.toThrow('File not found');
    });
  });

  // === Batch Operations ===
  describe('getBatchDownloadInfo()', () => {
    it('should return file info for multiple files with total size', async () => {
      const mockFiles = [
        { id: 'f1', name: 'doc.pdf', path: '/uploads/doc.pdf', size: 1024 },
        { id: 'f2', name: 'img.png', path: '/uploads/img.png', size: 2048 },
      ];
      prisma.file.findMany.mockResolvedValue(mockFiles);

      const result = await service.getBatchDownloadInfo(['f1', 'f2']);

      expect(result.files).toEqual(mockFiles);
      expect(result.totalSize).toBe(3072);
      expect(result.count).toBe(2);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['f1', 'f2'] }, isDeleted: false },
        select: { id: true, name: true, path: true, size: true },
      });
    });

    it('should exclude soft-deleted files', async () => {
      const mockFiles = [
        { id: 'f1', name: 'doc.pdf', path: '/uploads/doc.pdf', size: 1024 },
      ];
      prisma.file.findMany.mockResolvedValue(mockFiles);

      const result = await service.getBatchDownloadInfo(['f1', 'f-deleted']);

      expect(result.count).toBe(1);
      expect(result.files).toEqual(mockFiles);
      expect(prisma.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['f1', 'f-deleted'] }, isDeleted: false },
        }),
      );
    });

    it('should return zero total size and count when no files match', async () => {
      prisma.file.findMany.mockResolvedValue([]);

      const result = await service.getBatchDownloadInfo(['nonexistent']);

      expect(result.files).toEqual([]);
      expect(result.totalSize).toBe(0);
      expect(result.count).toBe(0);
    });
  });

  describe('batchDelete()', () => {
    it('should soft-delete multiple files at once', async () => {
      prisma.file.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.batchDelete(['f1', 'f2', 'f3']);

      expect(result).toEqual({ deletedCount: 3 });
      expect(prisma.file.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['f1', 'f2', 'f3'] }, isDeleted: false },
        data: { isDeleted: true },
      });
    });

    it('should return count 0 when no files match', async () => {
      prisma.file.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.batchDelete(['nonexistent']);

      expect(result).toEqual({ deletedCount: 0 });
    });
  });

  // === Encryption placeholder roundtrip ===
  describe('encryptFile() / decryptFile()', () => {
    it('should return the same data after encrypt-then-decrypt roundtrip', () => {
      const original = Buffer.from('Hello, SyncFlow!');
      const encrypted = service.encryptFile(original);
      const decrypted = service.decryptFile(encrypted);

      expect(encrypted).toBeInstanceOf(Buffer);
      expect(decrypted).toEqual(original);
      // Placeholder returns input unchanged
      expect(encrypted).toBe(original);
    });
  });

  describe('batchGetFiles()', () => {
    it('should return multiple files by IDs excluding soft-deleted', async () => {
      const mockFiles = [
        { id: 'f1', name: 'doc.pdf', type: 'DOCUMENT', isDeleted: false },
        { id: 'f2', name: 'img.png', type: 'IMAGE', isDeleted: false },
      ];
      prisma.file.findMany.mockResolvedValue(mockFiles);

      const result = await service.batchGetFiles(['f1', 'f2']);

      expect(result).toEqual(mockFiles);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['f1', 'f2'] }, isDeleted: false },
      });
    });

    it('should return empty array when no files match', async () => {
      prisma.file.findMany.mockResolvedValue([]);

      const result = await service.batchGetFiles(['nonexistent']);

      expect(result).toEqual([]);
    });
  });
});
