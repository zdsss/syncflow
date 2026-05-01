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
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    const projects = await this.projectsService.findAll(status);
    return { code: 0, data: projects };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(id);
    return { code: 0, data: project };
  }

  @Post()
  async create(@Body() body: any) {
    const project = await this.projectsService.create(body);
    return { code: 0, data: project };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const project = await this.projectsService.update(id, body);
    return { code: 0, data: project };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const project = await this.projectsService.remove(id);
    return { code: 0, data: project };
  }
}
