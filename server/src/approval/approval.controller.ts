import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';

@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const data = await this.approvalService.findAll({ status, userId });
    return { code: 0, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.approvalService.findOne(id);
    return { code: 0, data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.approvalService.create(body);
    return { code: 0, data };
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Body() body: { approverId: string }) {
    const data = await this.approvalService.approve(id, body.approverId);
    return { code: 0, data };
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { approverId: string; comment: string },
  ) {
    const data = await this.approvalService.reject(id, body.approverId, body.comment);
    return { code: 0, data };
  }
}
