import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PageMetaDto, UserSummaryDto } from '../../common/dto/response.dto';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ description: 'Markdown content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}

export class UpdateNewsDto extends PartialType(CreateNewsDto) {}

export class NewsBaseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ description: 'Markdown content' })
  content: string;

  @ApiProperty({ type: String, nullable: true })
  coverImageUrl: string | null;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class NewsDto extends NewsBaseDto {
  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ type: UserSummaryDto })
  author: UserSummaryDto;
}

/** Row returned by DELETE; `tags` is the raw JSON string stored in the database. */
export class NewsDeletedDto extends NewsBaseDto {
  @ApiProperty({ description: 'JSON-encoded string array' })
  tags: string;
}

export class PaginatedNewsListDto extends PageMetaDto {
  @ApiProperty({ type: [NewsDto] })
  items: NewsDto[];
}
