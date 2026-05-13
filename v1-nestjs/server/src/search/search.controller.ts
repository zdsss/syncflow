import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async searchAll(@Query('q') q: string) {
    const results = await this.searchService.searchAll(q || '');
    return { code: 0, data: results };
  }
}
