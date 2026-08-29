import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
