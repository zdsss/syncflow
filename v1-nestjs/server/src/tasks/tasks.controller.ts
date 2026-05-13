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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent task ID' })
  @ApiQuery({ name: 'rootOnly', required: false, description: 'Return only root tasks' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Page size' })
  async findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('keyword') keyword?: string,
    @Query('projectId') projectId?: string,
    @Query('parentId') parentId?: string,
    @Query('rootOnly') rootOnly?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.tasksService.findAll({
      status,
      priority,
      keyword,
      projectId,
      parentId,
      rootOnly: rootOnly === 'true',
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

  @Get(':id/dependencies')
  @ApiOperation({ summary: 'Get task dependencies' })
  @ApiResponse({ status: 200, description: 'List of dependency tasks' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getDependencies(@Param('id') id: string) {
    const deps = await this.tasksService.getDependencies(id);
    return { code: 0, data: deps };
  }

  @Post(':id/dependencies')
  @ApiOperation({ summary: 'Add a dependency to a task' })
  @ApiResponse({ status: 201, description: 'Dependency added' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async addDependency(
    @Param('id') id: string,
    @Body() body: { dependencyId: string; type?: string },
  ) {
    const task = await this.tasksService.addDependency(id, body.dependencyId, body.type);
    return { code: 0, data: task };
  }

  @Delete(':id/dependencies/:depId')
  @ApiOperation({ summary: 'Remove a dependency from a task' })
  @ApiResponse({ status: 200, description: 'Dependency removed' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async removeDependency(
    @Param('id') id: string,
    @Param('depId') depId: string,
  ) {
    const task = await this.tasksService.removeDependency(id, depId);
    return { code: 0, data: task };
  }

  @Get(':id/tags')
  @ApiOperation({ summary: 'Get tags for a task' })
  @ApiResponse({ status: 200, description: 'List of tags' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTags(@Param('id') id: string) {
    const tags = await this.tasksService.getTags(id);
    return { code: 0, data: tags };
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add a tag to a task' })
  @ApiResponse({ status: 201, description: 'Tag added' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async addTag(
    @Param('id') id: string,
    @Body() body: { tag: string },
  ) {
    const task = await this.tasksService.addTag(id, body.tag);
    return { code: 0, data: task };
  }

  @Delete(':id/tags/:tag')
  @ApiOperation({ summary: 'Remove a tag from a task' })
  @ApiResponse({ status: 200, description: 'Tag removed' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async removeTag(
    @Param('id') id: string,
    @Param('tag') tag: string,
  ) {
    const task = await this.tasksService.removeTag(id, tag);
    return { code: 0, data: task };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task found' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string) {
    const task = await this.tasksService.findOne(id);
    return { code: 0, data: task };
  }

  @Post()
  @RequirePermissions('task:create')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(@Body() body: CreateTaskDto) {
    const task = await this.tasksService.create(body);
    return { code: 0, data: task };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(@Param('id') id: string, @Body() body: UpdateTaskDto) {
    const task = await this.tasksService.update(id, body);
    return { code: 0, data: task };
  }

  @Delete(':id')
  @RequirePermissions('task:delete')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Param('id') id: string) {
    const task = await this.tasksService.remove(id);
    return { code: 0, data: task };
  }
}
