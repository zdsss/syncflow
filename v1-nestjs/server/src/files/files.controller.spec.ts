import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  const mockFile = { id: 'file-1', name: 'doc.pdf', type: 'pdf' };
  const mockPaginated = { data: [mockFile], total: 1, page: 1, pageSize: 10 };
  const mockVersions = [{ id: 'v1', version: 1 }];
  const mockBreadcrumbs = [{ id: 'root', name: 'Root' }];
  const mockPermissions = [{ userId: 'user-1', level: 'read' }];
  const mockStats = { totalFiles: 100, totalSize: 1024 };

  const mockService = {
    getStats: jest.fn().mockResolvedValue(mockStats),
    getFilePath: jest.fn().mockResolvedValue({ path: '/uploads/doc.pdf' }),
    getFileInfo: jest.fn().mockResolvedValue(mockFile),
    findAll: jest.fn().mockResolvedValue(mockPaginated),
    findOne: jest.fn().mockResolvedValue(mockFile),
    uploadFile: jest.fn().mockResolvedValue(mockFile),
    create: jest.fn().mockResolvedValue(mockFile),
    update: jest.fn().mockResolvedValue(mockFile),
    remove: jest.fn().mockResolvedValue(mockFile),
    getFileVersions: jest.fn().mockResolvedValue(mockVersions),
    rollbackVersion: jest.fn().mockResolvedValue(mockFile),
    getBreadcrumbs: jest.fn().mockResolvedValue(mockBreadcrumbs),
    getFilePermissions: jest.fn().mockResolvedValue(mockPermissions),
    setPermission: jest.fn().mockResolvedValue(mockPermissions[0]),
    removePermission: jest.fn().mockResolvedValue({ deleted: true }),
    getBatchDownloadInfo: jest.fn().mockResolvedValue([mockFile]),
    batchDelete: jest.fn().mockResolvedValue({ count: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: mockService }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return file stats', async () => {
      const result = await controller.getStats();
      expect(service.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('downloadFile', () => {
    it('should return file path', async () => {
      const result = await controller.downloadFile('file-1');
      expect(service.getFilePath).toHaveBeenCalledWith('file-1');
      expect(result).toEqual({ path: '/uploads/doc.pdf' });
    });
  });

  describe('getFileInfo', () => {
    it('should return file info', async () => {
      const result = await controller.getFileInfo('file-1');
      expect(service.getFileInfo).toHaveBeenCalledWith('file-1');
      expect(result).toEqual(mockFile);
    });
  });

  describe('findAll', () => {
    it('should return files with defaults', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith({ type: undefined, projectId: undefined, page: 1, pageSize: 10 });
      expect(result).toEqual(mockPaginated);
    });

    it('should pass filters', async () => {
      await controller.findAll('pdf', 'proj-1', '2', '20');
      expect(service.findAll).toHaveBeenCalledWith({ type: 'pdf', projectId: 'proj-1', page: 2, pageSize: 20 });
    });
  });

  describe('findOne', () => {
    it('should return a file', async () => {
      const result = await controller.findOne('file-1');
      expect(service.findOne).toHaveBeenCalledWith('file-1');
      expect(result).toEqual(mockFile);
    });
  });

  describe('upload', () => {
    it('should upload a file', async () => {
      const multerFile = { originalname: 'test.pdf' } as any;
      const body = { uploaderId: 'user-1', projectId: 'proj-1' };
      const result = await controller.upload(multerFile, body);
      expect(service.uploadFile).toHaveBeenCalledWith(multerFile, body);
      expect(result).toEqual(mockFile);
    });
  });

  describe('create', () => {
    it('should create a file record', async () => {
      const body = { name: 'doc.pdf', type: 'pdf', size: 1024, path: '/uploads/doc.pdf', uploaderId: 'user-1' };
      const result = await controller.create(body);
      expect(service.create).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockFile);
    });
  });

  describe('update', () => {
    it('should update a file', async () => {
      const body = { name: 'renamed.pdf' };
      const result = await controller.update('file-1', body);
      expect(service.update).toHaveBeenCalledWith('file-1', body);
      expect(result).toEqual(mockFile);
    });
  });

  describe('remove', () => {
    it('should delete a file', async () => {
      const result = await controller.remove('file-1');
      expect(service.remove).toHaveBeenCalledWith('file-1');
      expect(result).toEqual(mockFile);
    });
  });

  describe('getFileVersions', () => {
    it('should return file versions', async () => {
      const result = await controller.getFileVersions('file-1');
      expect(service.getFileVersions).toHaveBeenCalledWith('file-1');
      expect(result).toEqual(mockVersions);
    });
  });

  describe('rollbackVersion', () => {
    it('should rollback to a version', async () => {
      const result = await controller.rollbackVersion('file-1', { version: 1 });
      expect(service.rollbackVersion).toHaveBeenCalledWith('file-1', 1);
      expect(result).toEqual(mockFile);
    });
  });

  describe('getBreadcrumbs', () => {
    it('should return breadcrumbs', async () => {
      const result = await controller.getBreadcrumbs('file-1');
      expect(service.getBreadcrumbs).toHaveBeenCalledWith('file-1');
      expect(result).toEqual(mockBreadcrumbs);
    });
  });

  describe('getFilePermissions', () => {
    it('should return permissions', async () => {
      const result = await controller.getFilePermissions('file-1');
      expect(service.getFilePermissions).toHaveBeenCalledWith('file-1');
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('setPermission', () => {
    it('should set a permission', async () => {
      const result = await controller.setPermission('file-1', { userId: 'user-1', level: 'read' });
      expect(service.setPermission).toHaveBeenCalledWith('file-1', 'user-1', 'read');
      expect(result).toEqual(mockPermissions[0]);
    });
  });

  describe('removePermission', () => {
    it('should remove a permission', async () => {
      const result = await controller.removePermission('file-1', 'user-1');
      expect(service.removePermission).toHaveBeenCalledWith('file-1', 'user-1');
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('batchDownloadInfo', () => {
    it('should return batch download info', async () => {
      const result = await controller.batchDownloadInfo({ fileIds: ['file-1'] });
      expect(service.getBatchDownloadInfo).toHaveBeenCalledWith(['file-1']);
      expect(result).toEqual([mockFile]);
    });
  });

  describe('batchDelete', () => {
    it('should batch delete files', async () => {
      const result = await controller.batchDelete({ fileIds: ['file-1'] });
      expect(service.batchDelete).toHaveBeenCalledWith(['file-1']);
      expect(result).toEqual({ count: 1 });
    });
  });
});
