import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PersonalService } from './personal.service';

@Controller('personal')
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}

  @Get('files')
  async findAll(@Query('userId') userId: string) {
    const files = await this.personalService.findAll(userId);
    return { code: 0, data: files };
  }

  @Post('files')
  async create(@Body() body: any) {
    const file = await this.personalService.create(body);
    return { code: 0, data: file };
  }

  @Delete('files/:id')
  async remove(@Param('id') id: string) {
    const file = await this.personalService.remove(id);
    return { code: 0, data: file };
  }
}
