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
import { ResourcesService } from './resources.service';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.resourcesService.findAll({ type, status });
    return { code: 0, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.resourcesService.findOne(id);
    return { code: 0, data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.resourcesService.create(body);
    return { code: 0, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.resourcesService.update(id, body);
    return { code: 0, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.resourcesService.remove(id);
    return { code: 0, data };
  }
}
