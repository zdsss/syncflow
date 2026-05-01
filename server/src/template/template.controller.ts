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

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  async findAll(@Query('type') type?: string) {
    const templates = await this.templateService.findAll(type);
    return { code: 0, data: templates };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templateService.findOne(id);
    return { code: 0, data: template };
  }

  @Post()
  async create(@Body() body: any) {
    const template = await this.templateService.create(body);
    return { code: 0, data: template };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const template = await this.templateService.update(id, body);
    return { code: 0, data: template };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const template = await this.templateService.remove(id);
    return { code: 0, data: template };
  }
}
