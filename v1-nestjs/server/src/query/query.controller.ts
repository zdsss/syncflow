import { Controller, Get, Header, Query, Param } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get('task-stats')
  async getTaskStats() {
    const data = await this.queryService.getTaskStats();
    return { code: 0, data };
  }

  @Get('project-stats')
  async getProjectStats() {
    const data = await this.queryService.getProjectStats();
    return { code: 0, data };
  }

  @Get('overdue-tasks')
  async getOverdueTasks() {
    const data = await this.queryService.getOverdueTasks();
    return { code: 0, data };
  }

  @Get('project-progress/:projectId')
  async getProjectProgress(@Param('projectId') projectId: string) {
    const data = await this.queryService.getProjectProgress(projectId);
    return { code: 0, data };
  }

  @Get('user-workload/:userId')
  async getUserWorkload(@Param('userId') userId: string) {
    const data = await this.queryService.getUserWorkload(userId);
    return { code: 0, data };
  }

  @Get('department-stats/:departmentId')
  async getDepartmentStats(@Param('departmentId') departmentId: string) {
    const data = await this.queryService.getDepartmentStats(departmentId);
    return { code: 0, data };
  }

  @Get('export/tasks')
  @Header('Content-Type', 'text/csv')
  async exportTasks(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.queryService.exportTasks({ projectId, status, priority });
  }

  @Get('export/projects')
  @Header('Content-Type', 'text/csv')
  async exportProjects(@Query('status') status?: string) {
    return this.queryService.exportProjects({ status });
  }
}
