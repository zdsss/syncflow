import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('departments')
  getDepartments() {
    return this.configService.getDepartments();
  }

  @Get('roles')
  getRoles(@Query('departmentId') departmentId?: string) {
    return this.configService.getRoles(departmentId);
  }

  @Get('members')
  getMembers(@Query('roleId') roleId: string) {
    return this.configService.getMembers(roleId);
  }

  @Post('roles')
  createRole(@Body() body: {
    name: string;
    departmentId: string;
    description?: string;
    permissions?: string[];
  }) {
    return this.configService.createRole(body);
  }

  @Post('members')
  addMember(@Body() body: { userId: string; roleId: string }) {
    return this.configService.addMember(body);
  }

  @Delete('members/:id')
  removeMember(@Param('id') id: string) {
    return this.configService.removeMember(id);
  }
}
