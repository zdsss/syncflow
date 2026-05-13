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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { RequirePermissions } from '../common/decorators/roles.decorator';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async findAll(@Query('status') status?: string) {
    const projects = await this.projectsService.findAll(status);
    return { code: 0, data: projects };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search projects by keyword' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiQuery({ name: 'q', required: true, description: 'Search keyword' })
  async search(@Query('q') q: string) {
    const projects = await this.projectsService.searchProjects(q);
    return { code: 0, data: projects };
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get project tree structure' })
  @ApiResponse({ status: 200, description: 'Project tree' })
  async getTree() {
    const projects = await this.projectsService.getProjectTree();
    return { code: 0, data: projects };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project found' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(id);
    return { code: 0, data: project };
  }

  @Post('import')
  @RequirePermissions('project:create')
  @ApiOperation({ summary: 'Import projects from CSV data' })
  @ApiResponse({ status: 201, description: 'Import results' })
  async importProjects(@Body() body: { data: any[] }) {
    const result = await this.projectsService.importProjects(body.data || []);
    return { code: 0, data: result };
  }

  @Post()
  @RequirePermissions('project:create')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(@Body() body: CreateProjectDto) {
    const project = await this.projectsService.create(body);
    return { code: 0, data: project };
  }

  @Post(':id/duplicate')
  @RequirePermissions('project:create')
  @ApiOperation({ summary: 'Duplicate a project with its tasks' })
  @ApiResponse({ status: 201, description: 'Project duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async duplicate(@Param('id') id: string) {
    const project = await this.projectsService.duplicateProject(id);
    return { code: 0, data: project };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(@Param('id') id: string, @Body() body: UpdateProjectDto) {
    const project = await this.projectsService.update(id, body);
    return { code: 0, data: project };
  }

  @Delete(':id')
  @RequirePermissions('project:delete')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id') id: string) {
    const project = await this.projectsService.remove(id);
    return { code: 0, data: project };
  }

  @Get(':id/milestones')
  @ApiOperation({ summary: 'Get milestones for a project' })
  @ApiResponse({ status: 200, description: 'List of milestone tasks' })
  async getMilestones(@Param('id') id: string) {
    const milestones = await this.projectsService.getMilestones(id);
    return { code: 0, data: milestones };
  }

  @Patch(':id/milestones/:taskId')
  @ApiOperation({ summary: 'Set or unset a task as milestone' })
  @ApiResponse({ status: 200, description: 'Task milestone updated' })
  async setMilestone(
    @Param('taskId') taskId: string,
    @Body() body: { isMilestone: boolean },
  ) {
    const task = await this.projectsService.setMilestone(taskId, body.isMilestone);
    return { code: 0, data: task };
  }
}
