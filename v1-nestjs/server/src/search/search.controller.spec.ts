import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let service: SearchService;

  const mockResults = {
    tasks: [{ id: 't1', title: 'Found Task' }],
    projects: [],
    articles: [],
  };

  const mockService = {
    searchAll: jest.fn().mockResolvedValue(mockResults),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockService }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should search with query', async () => {
    const result = await controller.searchAll('bug');
    expect(service.searchAll).toHaveBeenCalledWith('bug');
    expect(result).toEqual({ code: 0, data: mockResults });
  });

  it('should default to empty string when no query', async () => {
    const result = await controller.searchAll(undefined as any);
    expect(service.searchAll).toHaveBeenCalledWith('');
    expect(result).toEqual({ code: 0, data: mockResults });
  });

  it('should propagate service errors', async () => {
    (service.searchAll as jest.Mock).mockRejectedValueOnce(new Error('Search failed'));
    await expect(controller.searchAll('test')).rejects.toThrow('Search failed');
  });
});
