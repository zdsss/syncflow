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
import { ProcessService } from './process.service';
import { CreateProcessRouteDto } from './dto/create-process-route.dto';
import { UpdateProcessRouteDto } from './dto/update-process-route.dto';
import { CreateProcessStepDto } from './dto/create-process-step.dto';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Get()
  async findAll(@Query('projectId') projectId: string) {
    const routes = await this.processService.findAll(projectId);
    return { code: 0, data: routes };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const route = await this.processService.findOne(id);
    return { code: 0, data: route };
  }

  @Post()
  async create(@Body() body: CreateProcessRouteDto) {
    const route = await this.processService.create(body);
    return { code: 0, data: route };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateProcessRouteDto) {
    const route = await this.processService.update(id, body);
    return { code: 0, data: route };
  }

  @Post(':id/steps')
  async addStep(@Param('id') id: string, @Body() body: CreateProcessStepDto) {
    const step = await this.processService.addStep(id, body);
    return { code: 0, data: step };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const route = await this.processService.remove(id);
    return { code: 0, data: route };
  }

  @Delete(':routeId/steps/:stepId')
  async removeStep(
    @Param('routeId') routeId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.processService.removeStep(routeId, stepId);
  }

  @Patch(':routeId/steps/reorder')
  async reorderSteps(
    @Param('routeId') routeId: string,
    @Body() body: { id: string; sortOrder: number }[],
  ) {
    return this.processService.reorderSteps(routeId, body);
  }

  @Get(':routeId/steps/:stepId/parameters')
  async getStepParameters(
    @Param('routeId') routeId: string,
    @Param('stepId') stepId: string,
  ) {
    const data = await this.processService.getStepParameters(routeId, stepId);
    return { code: 0, data };
  }

  @Patch(':routeId/steps/:stepId/parameters')
  async updateStepParameters(
    @Param('routeId') routeId: string,
    @Param('stepId') stepId: string,
    @Body()
    body: Array<{
      name: string;
      targetValue: string | number;
      upperLimit?: string | number;
      lowerLimit?: string | number;
      unit?: string;
      inspectionMethod?: string;
    }>,
  ) {
    const data = await this.processService.updateStepParameters(routeId, stepId, body);
    return { code: 0, data };
  }

  @Post(':routeId/versions')
  async createVersion(
    @Param('routeId') routeId: string,
    @Body() body: { description?: string },
  ) {
    const version = await this.processService.createVersion(routeId, body.description);
    return { code: 0, data: version };
  }

  @Get(':routeId/versions')
  async getVersions(@Param('routeId') routeId: string) {
    const versions = await this.processService.getVersions(routeId);
    return { code: 0, data: versions };
  }

  @Patch(':routeId/versions/:versionId/publish')
  async publishVersion(
    @Param('routeId') routeId: string,
    @Param('versionId') versionId: string,
  ) {
    const version = await this.processService.publishVersion(routeId, versionId);
    return { code: 0, data: version };
  }

  @Get(':id/visualization')
  async getRouteVisualization(@Param('id') id: string) {
    const data = await this.processService.getRouteVisualization(id);
    return { code: 0, data };
  }

  @Get(':id/stats')
  async getRouteStats(@Param('id') id: string) {
    const data = await this.processService.getRouteStats(id);
    return { code: 0, data };
  }
}
