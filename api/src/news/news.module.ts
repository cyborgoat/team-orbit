import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [NotificationsModule],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
