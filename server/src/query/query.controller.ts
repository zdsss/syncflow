import { Controller, Get } from '@nestjs/common';
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
}
