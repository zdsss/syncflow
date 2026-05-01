import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { FilesModule } from './files/files.module';
import { ConfigManagementModule } from './config/config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BomModule } from './bom/bom.module';
import { ProcessModule } from './process/process.module';
import { QueryModule } from './query/query.module';
import { ResourcesModule } from './resources/resources.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { TemplateModule } from './template/template.module';
import { PersonalModule } from './personal/personal.module';
import { WebSocketModule } from './websocket/websocket.module';
import { ApprovalModule } from './approval/approval.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    FilesModule,
    ConfigManagementModule,
    DashboardModule,
    BomModule,
    ProcessModule,
    QueryModule,
    ResourcesModule,
    KnowledgeModule,
    TemplateModule,
    PersonalModule,
    WebSocketModule,
    ApprovalModule,
  ],
})
export class AppModule {}
