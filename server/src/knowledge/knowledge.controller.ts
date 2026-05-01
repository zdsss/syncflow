import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    const articles = await this.knowledgeService.findAll({ category, status, keyword });
    return { code: 0, data: articles };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const article = await this.knowledgeService.findOne(id);
    return { code: 0, data: article };
  }

  @Post()
  async create(@Body() body: any) {
    const article = await this.knowledgeService.create(body);
    return { code: 0, data: article };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const article = await this.knowledgeService.update(id, body);
    return { code: 0, data: article };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const article = await this.knowledgeService.remove(id);
    return { code: 0, data: article };
  }
}
