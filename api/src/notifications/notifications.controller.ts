import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { NotificationsService } from './notifications.service';
import {
  NotificationReadDto,
  PaginatedNotificationsDto,
} from './dto/notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedNotificationsDto })
  list(
    @CurrentUser() user: { id: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.notifications.listForUser(user.id, query.page, query.limit);
  }

  @Post(':id/read')
  @ApiCreatedResponse({ type: NotificationReadDto })
  markRead(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }
}
