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
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.knowledgeService.findAll({
      category,
      status,
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, ...data };
  }

  @Get('search')
  async searchArticles(@Query('q') q: string) {
    const articles = await this.knowledgeService.searchArticles(q);
    return { code: 0, data: articles };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.knowledgeService.getCategories();
    return { code: 0, data: categories };
  }

  @Get('by-category/:category')
  async getByCategory(@Param('category') category: string) {
    const articles = await this.knowledgeService.getByCategory(category);
    return { code: 0, data: articles };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const article = await this.knowledgeService.findOne(id);
    return { code: 0, data: article };
  }

  @Post()
  async create(@Body() body: CreateArticleDto) {
    const article = await this.knowledgeService.create(body);
    return { code: 0, data: article };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateArticleDto) {
    const article = await this.knowledgeService.update(id, body as any);
    return { code: 0, data: article };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const article = await this.knowledgeService.updateStatus(id, body.status);
    return { code: 0, data: article };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const article = await this.knowledgeService.remove(id);
    return { code: 0, data: article };
  }

  @Get(':id/comments')
  async getArticleComments(@Param('id') id: string) {
    const comments = await this.knowledgeService.getArticleComments(id);
    return { code: 0, data: comments };
  }

  @Post(':id/comments')
  async addArticleComment(
    @Param('id') id: string,
    @Body() body: { authorId: string; content: string },
  ) {
    const comment = await this.knowledgeService.addArticleComment(
      id,
      body.authorId,
      body.content,
    );
    return { code: 0, data: comment };
  }
}
