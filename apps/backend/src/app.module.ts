import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { AttachmentModule } from './attachment/attachment.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { NotificationModule } from './notification/notification.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TicketModule,
    ChatModule,
    AiModule,
    AttachmentModule,
    AnalyticsModule,
    AdminModule,
    NotificationModule,
    SearchModule,
  ],
})
export class AppModule {}
