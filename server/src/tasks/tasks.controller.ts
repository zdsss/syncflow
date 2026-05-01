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
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('keyword') keyword?: string,
    @Query('projectId') projectId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.tasksService.findAll({
      status,
      priority,
      keyword,
      projectId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });

    return {
      code: 0,
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const task = await this.tasksService.findOne(id);
    return { code: 0, data: task };
  }

  @Post()
  async create(@Body() body: any) {
    const task = await this.tasksService.create(body);
    return { code: 0, data: task };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const task = await this.tasksService.update(id, body);
    return { code: 0, data: task };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const task = await this.tasksService.remove(id);
    return { code: 0, data: task };
  }
}
