import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findActivities(
    @Query('projectId') projectId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pagination = {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };

    if (projectId) {
      return this.activityService.getByProject(projectId, pagination);
    }

    if (userId) {
      return this.activityService.getByUser(userId, pagination);
    }

    // Default: return empty result when no filter
    return { data: [], total: 0, page: 1, pageSize: 20 };
  }
}
