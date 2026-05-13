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
import { CreateBomItemDto } from './dto/create-bom-item.dto';
import { UpdateBomItemDto } from './dto/update-bom-item.dto';

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

  @Get('versions')
  async getVersions(@Query('projectId') projectId: string) {
    const versions = await this.bomService.getVersions(projectId);
    return { code: 0, data: versions };
  }

  @Get('compare')
  async compareVersions(
    @Query('projectId') projectId: string,
    @Query('v1') v1: string,
    @Query('v2') v2: string,
  ) {
    const result = await this.bomService.compareVersions(
      projectId,
      parseInt(v1, 10),
      parseInt(v2, 10),
    );
    return { code: 0, data: result };
  }

  @Get('export')
  async exportToData(@Query('projectId') projectId: string) {
    const items = await this.bomService.exportToData(projectId);
    return { code: 0, data: items };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.bomService.findOne(id);
    return { code: 0, data: item };
  }

  @Post()
  async create(@Body() body: CreateBomItemDto) {
    const item = await this.bomService.create(body);
    return { code: 0, data: item };
  }

  @Post('import')
  async importFromData(@Body() body: { projectId: string; items: Array<{ name: string; partNumber: string; specification?: string; supplier?: string; unit?: string; unitPrice?: number; quantity?: number }> }) {
    const result = await this.bomService.importFromData(body.projectId, body.items);
    return { code: 0, data: result };
  }

  @Post('versions')
  async createVersion(
    @Body() body: { projectId: string; description?: string },
  ) {
    const version = await this.bomService.createVersion(
      body.projectId,
      body.description,
    );
    return { code: 0, data: version };
  }

  @Post('rollback')
  async rollbackVersion(
    @Body() body: { projectId: string; targetVersion: number },
  ) {
    const version = await this.bomService.rollbackVersion(
      body.projectId,
      body.targetVersion,
    );
    return { code: 0, data: version };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateBomItemDto) {
    const item = await this.bomService.update(id, body);
    return { code: 0, data: item };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const item = await this.bomService.remove(id);
    return { code: 0, data: item };
  }
}
