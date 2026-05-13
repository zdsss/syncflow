import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

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
  createRole(@Body() body: CreateRoleDto) {
    return this.configService.createRole(body);
  }

  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.configService.updateRole(id, body);
  }

  @Delete('roles/:id')
  removeRole(@Param('id') id: string) {
    return this.configService.removeRole(id);
  }

  @Post('departments')
  createDepartment(@Body() body: CreateDepartmentDto) {
    return this.configService.createDepartment(body);
  }

  @Patch('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() body: UpdateDepartmentDto) {
    return this.configService.updateDepartment(id, body);
  }

  @Delete('departments/:id')
  removeDepartment(@Param('id') id: string) {
    return this.configService.removeDepartment(id);
  }

  @Post('members')
  addMember(@Body() body: AddMemberDto) {
    return this.configService.addMember(body);
  }

  @Delete('members/:id')
  removeMember(@Param('id') id: string) {
    return this.configService.removeMember(id);
  }

  @Get('system-params')
  async getSystemParams() {
    return this.configService.getSystemParams();
  }

  @Put('system-params')
  async updateSystemParams(@Body() body: any[]) {
    return this.configService.updateSystemParams(body);
  }

  @Get('permissions')
  async getPermissions() {
    return this.configService.getPermissions();
  }

  @Put('permissions')
  async updatePermissions(@Body() body: { roleId: string; modules: string[]; dataPermission: string }[]) {
    return this.configService.updatePermissions(body);
  }

  @Get('notification-settings/:userId')
  async getNotificationSettings(@Param('userId') userId: string) {
    const data = await this.configService.getNotificationSettings(userId);
    return { code: 0, data };
  }

  @Patch('notification-settings/:userId')
  async updateNotificationSettings(
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    const data = await this.configService.updateNotificationSettings(userId, body);
    return { code: 0, data };
  }
}
