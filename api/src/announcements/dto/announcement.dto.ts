import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PageMetaDto, UserSummaryDto } from '../../common/dto/response.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  description: string;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

export class AnnouncementRecordDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AnnouncementDto extends AnnouncementRecordDto {
  @ApiProperty({ type: UserSummaryDto })
  author: UserSummaryDto;
}

export class PaginatedAnnouncementsDto extends PageMetaDto {
  @ApiProperty({ type: [AnnouncementDto] })
  items: AnnouncementDto[];
}
