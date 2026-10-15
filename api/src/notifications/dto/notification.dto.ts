import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../common/dto/response.dto';

export class NotificationDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'forum.created' })
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  resourceType: string;

  @ApiProperty()
  resourceId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ description: 'Whether the current user has read it' })
  read: boolean;
}

export class PaginatedNotificationsDto extends PageMetaDto {
  @ApiProperty({ type: [NotificationDto] })
  items: NotificationDto[];
}

export class NotificationReadDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  notificationId: string;

  @ApiProperty()
  readAt: Date;
}
