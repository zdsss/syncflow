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
import { PersonalService } from './personal.service';
import { CreatePersonalFileDto } from './dto/create-personal-file.dto';

@Controller('personal')
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}

  @Get('files')
  async findAll(@Query('userId') userId: string) {
    const files = await this.personalService.findAll(userId);
    return { code: 0, data: files };
  }

  @Post('files')
  async create(@Body() body: CreatePersonalFileDto) {
    const file = await this.personalService.create(body);
    return { code: 0, data: file };
  }

  @Delete('files/:id')
  async remove(@Param('id') id: string) {
    const file = await this.personalService.remove(id);
    return { code: 0, data: file };
  }

  // === Notes ===

  @Post('notes')
  async createNote(@Body() body: { userId: string; title: string; content: string; category?: string }) {
    const note = await this.personalService.createNote(body.userId, body.title, body.content, body.category);
    return { code: 0, data: note };
  }

  @Get('notes')
  async getNotes(
    @Query('userId') userId: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.personalService.getNotes(userId, {
      category,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
    return { code: 0, data: result };
  }

  @Patch('notes/:id')
  async updateNote(@Param('id') id: string, @Body() body: { title?: string; content?: string; category?: string }) {
    const note = await this.personalService.updateNote(id, body);
    return { code: 0, data: note };
  }

  @Delete('notes/:id')
  async removeNote(@Param('id') id: string) {
    const note = await this.personalService.removeNote(id);
    return { code: 0, data: note };
  }
}
