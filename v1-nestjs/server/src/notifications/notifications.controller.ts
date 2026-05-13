import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for a user' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  @ApiQuery({ name: 'isRead', required: false, description: 'Filter by read status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Page size' })
  async findAll(
    @Query('userId') userId: string,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const options: { isRead?: boolean; page?: number; pageSize?: number } = {};
    if (isRead !== undefined) options.isRead = isRead === 'true';
    if (page) options.page = parseInt(page, 10);
    if (pageSize) options.pageSize = parseInt(pageSize, 10);

    const result = await this.notificationsService.findAll(userId, options);
    return { code: 0, data: result };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  async getUnreadCount(@Query('userId') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { code: 0, data: { count } };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id);
    return { code: 0, data: notification };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  async markAllAsRead(@Query('userId') userId: string) {
    const result = await this.notificationsService.markAllAsRead(userId);
    return { code: 0, data: result };
  }
}
