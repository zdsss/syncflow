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
import { CreateApprovalDto } from './dto/create-approval.dto';

@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.approvalService.findAll({
      status,
      userId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, ...data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.approvalService.findOne(id);
    return { code: 0, data };
  }

  @Post()
  async create(@Body() body: CreateApprovalDto) {
    const data = await this.approvalService.create(body);
    return { code: 0, data };
  }

  @Post(':id/chain')
  async createChain(
    @Param('id') id: string,
    @Body() body: { approverIds: string[] },
  ) {
    const data = await this.approvalService.createChain(id, body.approverIds);
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

  @Patch(':id/transfer')
  async transfer(
    @Param('id') id: string,
    @Body() body: { fromUserId: string; toUserId: string; comment?: string },
  ) {
    const data = await this.approvalService.transferApproval(id, body.fromUserId, body.toUserId, body.comment);
    return { code: 0, data };
  }
}
