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
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    const templates = await this.templateService.findAll(type);
    return { code: 0, data: templates };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.templateService.getCategories();
    return { code: 0, data: categories };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templateService.findOne(id);
    return { code: 0, data: template };
  }

  @Get(':id/export')
  async exportTemplate(@Param('id') id: string) {
    const data = await this.templateService.exportTemplate(id);
    return { code: 0, data };
  }

  @Get(':id/preview')
  async preview(@Param('id') id: string) {
    const content = await this.templateService.previewTemplate(id);
    return { code: 0, data: content };
  }

  @Post('import')
  async importTemplate(@Body() body: Record<string, any>) {
    const creatorId = body.creatorId || 'system';
    const template = await this.templateService.importTemplate(body, creatorId);
    return { code: 0, data: template };
  }

  @Post()
  async create(@Body() body: CreateTemplateDto) {
    const template = await this.templateService.create(body);
    return { code: 0, data: template };
  }

  @Post(':id/apply')
  async apply(
    @Param('id') id: string,
    @Body() body: { name: string; leaderId: string; startDate: string },
  ) {
    const result = await this.templateService.applyTemplate(id, body);
    return { code: 0, data: result };
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string) {
    const template = await this.templateService.duplicateTemplate(id);
    return { code: 0, data: template };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTemplateDto) {
    const template = await this.templateService.update(id, body as any);
    return { code: 0, data: template };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const template = await this.templateService.remove(id);
    return { code: 0, data: template };
  }
}
