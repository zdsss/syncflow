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
import { RequirePermissions } from '../common/decorators/roles.decorator';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('stats')
  getStats() {
    return this.filesService.getStats();
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string) {
    return this.filesService.getFilePath(id);
  }

  @Get(':id/info')
  getFileInfo(@Param('id') id: string) {
    return this.filesService.getFileInfo(id);
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
  @RequirePermissions('file:upload')
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

  @Get(':id/versions')
  getFileVersions(@Param('id') id: string) {
    return this.filesService.getFileVersions(id);
  }

  @Post(':id/rollback')
  rollbackVersion(
    @Param('id') id: string,
    @Body() body: { version: number },
  ) {
    return this.filesService.rollbackVersion(id, body.version);
  }

  @Get(':id/breadcrumbs')
  getBreadcrumbs(@Param('id') id: string) {
    return this.filesService.getBreadcrumbs(id);
  }

  @Get(':id/permissions')
  getFilePermissions(@Param('id') id: string) {
    return this.filesService.getFilePermissions(id);
  }

  @Post(':id/permissions')
  setPermission(
    @Param('id') id: string,
    @Body() body: { userId: string; level: string },
  ) {
    return this.filesService.setPermission(id, body.userId, body.level);
  }

  @Delete(':id/permissions/:userId')
  removePermission(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.filesService.removePermission(id, userId);
  }

  @Post('batch-download-info')
  batchDownloadInfo(@Body() body: { fileIds: string[] }) {
    return this.filesService.getBatchDownloadInfo(body.fileIds);
  }

  @Post('batch-delete')
  batchDelete(@Body() body: { fileIds: string[] }) {
    return this.filesService.batchDelete(body.fileIds);
  }
}
