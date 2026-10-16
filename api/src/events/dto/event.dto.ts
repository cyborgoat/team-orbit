import { MediaInput } from '../../common/media';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PageMetaDto, UserSummaryDto } from '../../common/dto/response.dto';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsDateString()
  startAt: string;

  @ApiProperty()
  @IsDateString()
  endAt: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsOptional()
  @MediaInput()
  coverImageUrl?: string | null;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class EventRecordDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  startAt: Date;

  @ApiProperty()
  endAt: Date;

  @ApiProperty()
  location: string;

  @ApiProperty({ type: String, nullable: true })
  coverImageUrl: string | null;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EventDto extends EventRecordDto {
  @ApiProperty({ type: UserSummaryDto })
  createdBy: UserSummaryDto;
}

export class PaginatedEventsDto extends PageMetaDto {
  @ApiProperty({ type: [EventDto] })
  items: EventDto[];
}
