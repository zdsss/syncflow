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
import { BomService } from './bom.service';

@Controller('bom')
export class BomController {
  constructor(private readonly bomService: BomService) {}

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    const items = await this.bomService.findAll(projectId);
    return { code: 0, data: items };
  }

  @Get('tree')
  async findTree(@Query('projectId') projectId: string) {
    const tree = await this.bomService.findTree(projectId);
    return { code: 0, data: tree };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.bomService.findOne(id);
    return { code: 0, data: item };
  }

  @Post()
  async create(@Body() body: any) {
    const item = await this.bomService.create(body);
    return { code: 0, data: item };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const item = await this.bomService.update(id, body);
    return { code: 0, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const item = await this.bomService.remove(id);
    return { code: 0, data: item };
  }
}
