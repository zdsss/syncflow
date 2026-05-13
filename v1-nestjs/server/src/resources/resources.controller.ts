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
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.resourcesService.findAll({
      type,
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, ...data };
  }

  @Get('types')
  async getTypes() {
    const data = await this.resourcesService.getTypes();
    return { code: 0, data };
  }

  @Get('by-type/:type')
  async getByType(@Param('type') type: string) {
    const data = await this.resourcesService.getByType(type);
    return { code: 0, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.resourcesService.findOne(id);
    return { code: 0, data };
  }

  @Post()
  async create(@Body() body: CreateResourceDto) {
    const data = await this.resourcesService.create(body);
    return { code: 0, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateResourceDto) {
    const data = await this.resourcesService.update(id, body);
    return { code: 0, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.resourcesService.remove(id);
    return { code: 0, data };
  }
}
