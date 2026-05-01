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
import { ProcessService } from './process.service';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    const routes = await this.processService.findAll(projectId);
    return { code: 0, data: routes };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const route = await this.processService.findOne(id);
    return { code: 0, data: route };
  }

  @Post()
  async create(@Body() body: any) {
    const route = await this.processService.create(body);
    return { code: 0, data: route };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const route = await this.processService.update(id, body);
    return { code: 0, data: route };
  }

  @Post(':id/steps')
  async addStep(@Param('id') id: string, @Body() body: any) {
    const step = await this.processService.addStep(id, body);
    return { code: 0, data: step };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const route = await this.processService.remove(id);
    return { code: 0, data: route };
  }
}
