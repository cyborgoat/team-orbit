import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ForumController],
  providers: [ForumService],
})
export class ForumModule {}
