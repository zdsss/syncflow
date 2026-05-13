import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
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
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { ActivityModule } from './activity/activity.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
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
    SearchModule,
    NotificationsModule,
    AuditModule,
    ActivityModule,
    CommentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
