import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';
import { extname } from 'path';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('stats')
  getStats() {
    return this.filesService.getStats();
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('projectId') projectId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.filesService.findAll({
      type,
      projectId,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      uploaderId: string;
      projectId?: string;
      parentFolderId?: string;
    },
  ) {
    return this.filesService.uploadFile(file, body);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      type: string;
      extension?: string;
      size: number;
      path: string;
      uploaderId: string;
      projectId?: string;
    },
  ) {
    return this.filesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.filesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
