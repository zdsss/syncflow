import { Test, TestingModule } from '@nestjs/testing';
import { PersonalController } from './personal.controller';
import { PersonalService } from './personal.service';

describe('PersonalController', () => {
  let controller: PersonalController;
  let service: PersonalService;

  const mockFile = { id: 'file-1', name: 'doc.pdf', userId: 'user-1' };
  const mockNote = { id: 'note-1', title: 'My Note', content: 'Hello' };

  const mockService = {
    findAll: jest.fn().mockResolvedValue([mockFile]),
    create: jest.fn().mockResolvedValue(mockFile),
    remove: jest.fn().mockResolvedValue(mockFile),
    createNote: jest.fn().mockResolvedValue(mockNote),
    getNotes: jest.fn().mockResolvedValue({ data: [mockNote], total: 1 }),
    updateNote: jest.fn().mockResolvedValue(mockNote),
    removeNote: jest.fn().mockResolvedValue(mockNote),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalController],
      providers: [{ provide: PersonalService, useValue: mockService }],
    }).compile();

    controller = module.get<PersonalController>(PersonalController);
    service = module.get<PersonalService>(PersonalService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return personal files', async () => {
      const result = await controller.findAll('user-1');
      expect(service.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ code: 0, data: [mockFile] });
    });
  });

  describe('create', () => {
    it('should create a personal file', async () => {
      const dto = { userId: 'user-1', name: 'doc.pdf' };
      const result = await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ code: 0, data: mockFile });
    });
  });

  describe('remove', () => {
    it('should delete a personal file', async () => {
      const result = await controller.remove('file-1');
      expect(service.remove).toHaveBeenCalledWith('file-1');
      expect(result).toEqual({ code: 0, data: mockFile });
    });

    it('should propagate errors', async () => {
      (service.remove as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      await expect(controller.remove('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('createNote', () => {
    it('should create a note', async () => {
      const body = { userId: 'user-1', title: 'My Note', content: 'Hello', category: 'work' };
      const result = await controller.createNote(body);
      expect(service.createNote).toHaveBeenCalledWith('user-1', 'My Note', 'Hello', 'work');
      expect(result).toEqual({ code: 0, data: mockNote });
    });
  });

  describe('getNotes', () => {
    it('should return notes', async () => {
      const result = await controller.getNotes('user-1');
      expect(service.getNotes).toHaveBeenCalledWith('user-1', { category: undefined, page: undefined, pageSize: undefined });
      expect(result).toEqual({ code: 0, data: { data: [mockNote], total: 1 } });
    });

    it('should pass pagination and category filters', async () => {
      await controller.getNotes('user-1', 'work', '2', '10');
      expect(service.getNotes).toHaveBeenCalledWith('user-1', { category: 'work', page: 2, pageSize: 10 });
    });
  });

  describe('updateNote', () => {
    it('should update a note', async () => {
      const body = { title: 'Updated' };
      const result = await controller.updateNote('note-1', body);
      expect(service.updateNote).toHaveBeenCalledWith('note-1', body);
      expect(result).toEqual({ code: 0, data: mockNote });
    });
  });

  describe('removeNote', () => {
    it('should delete a note', async () => {
      const result = await controller.removeNote('note-1');
      expect(service.removeNote).toHaveBeenCalledWith('note-1');
      expect(result).toEqual({ code: 0, data: mockNote });
    });
  });
});
