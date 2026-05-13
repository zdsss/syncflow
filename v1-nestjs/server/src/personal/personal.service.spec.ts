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

  const mockNote = {
    id: 'note-1',
    userId: 'user-1',
    title: 'My Note',
    content: 'Note content here',
    category: 'work',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNote2 = {
    id: 'note-2',
    userId: 'user-1',
    title: 'Another Note',
    content: 'More content',
    category: 'personal',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      file: {
        findMany: jest.fn().mockResolvedValue([mockFile]),
        create: jest.fn().mockResolvedValue(mockFile),
        update: jest.fn().mockResolvedValue(mockFile),
      },
      note: {
        create: jest.fn().mockResolvedValue(mockNote),
        findMany: jest.fn().mockResolvedValue([mockNote]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(mockNote),
        delete: jest.fn().mockResolvedValue(mockNote),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
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
      expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
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
      expect(mockPrisma.file.create).toHaveBeenCalledWith({
        data: { ...createDto, projectId: null },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete a personal file', async () => {
      const result = await service.remove('file-1');
      expect(result).toEqual(mockFile);
      expect(mockPrisma.file.update).toHaveBeenCalledWith({
        where: { id: 'file-1' },
        data: { isDeleted: true },
      });
    });
  });

  // === Notes Tests ===

  describe('createNote', () => {
    it('should create a note for a user', async () => {
      const result = await service.createNote('user-1', 'My Note', 'Note content here', 'work');

      expect(result).toEqual(mockNote);
      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          title: 'My Note',
          content: 'Note content here',
          category: 'work',
        },
      });
    });

    it('should create a note without category', async () => {
      const noteNoCategory = { ...mockNote, category: null };
      mockPrisma.note.create.mockResolvedValue(noteNoCategory);

      const result = await service.createNote('user-1', 'My Note', 'Note content here');

      expect(result).toEqual(noteNoCategory);
      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          title: 'My Note',
          content: 'Note content here',
          category: undefined,
        },
      });
    });
  });

  describe('getNotes', () => {
    it('should return notes for a user with default pagination', async () => {
      mockPrisma.note.findMany.mockResolvedValue([mockNote, mockNote2]);
      mockPrisma.note.count.mockResolvedValue(2);

      const result = await service.getNotes('user-1');

      expect(result).toEqual({
        items: [mockNote, mockNote2],
        total: 2,
        page: 1,
        pageSize: 20,
      });
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should support pagination with page and pageSize', async () => {
      mockPrisma.note.findMany.mockResolvedValue([mockNote2]);
      mockPrisma.note.count.mockResolvedValue(2);

      const result = await service.getNotes('user-1', { page: 2, pageSize: 1 });

      expect(result).toEqual({
        items: [mockNote2],
        total: 2,
        page: 2,
        pageSize: 1,
      });
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        skip: 1,
        take: 1,
      });
    });

    it('should filter notes by category', async () => {
      mockPrisma.note.findMany.mockResolvedValue([mockNote]);
      mockPrisma.note.count.mockResolvedValue(1);

      const result = await service.getNotes('user-1', { category: 'work' });

      expect(result.items).toEqual([mockNote]);
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', category: 'work' },
        orderBy: { updatedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('updateNote', () => {
    it('should update note title and content', async () => {
      const updated = { ...mockNote, title: 'Updated Title', content: 'Updated content' };
      mockPrisma.note.update.mockResolvedValue(updated);

      const result = await service.updateNote('note-1', {
        title: 'Updated Title',
        content: 'Updated content',
      });

      expect(result).toEqual(updated);
      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: { title: 'Updated Title', content: 'Updated content' },
      });
    });

    it('should update note category', async () => {
      const updated = { ...mockNote, category: 'personal' };
      mockPrisma.note.update.mockResolvedValue(updated);

      const result = await service.updateNote('note-1', { category: 'personal' });

      expect(result).toEqual(updated);
      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: { category: 'personal' },
      });
    });

    it('should allow partial updates (only title)', async () => {
      const updated = { ...mockNote, title: 'New Title' };
      mockPrisma.note.update.mockResolvedValue(updated);

      const result = await service.updateNote('note-1', { title: 'New Title' });

      expect(result).toEqual(updated);
      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: { title: 'New Title' },
      });
    });
  });

  describe('removeNote', () => {
    it('should delete a note', async () => {
      const result = await service.removeNote('note-1');

      expect(result).toEqual(mockNote);
      expect(mockPrisma.note.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' },
      });
    });
  });
});
