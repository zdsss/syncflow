import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [WebSocketModule, AuditModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
