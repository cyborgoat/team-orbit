import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PageMetaDto, UserSummaryDto } from '../../common/dto/response.dto';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBlogPostDto {
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

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}

export class BlogPostBaseDto {
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

export class BlogPostDto extends BlogPostBaseDto {
  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ type: UserSummaryDto })
  author: UserSummaryDto;
}

/** Row returned by DELETE; `tags` is the raw JSON string stored in the database. */
export class BlogPostDeletedDto extends BlogPostBaseDto {
  @ApiProperty({ description: 'JSON-encoded string array' })
  tags: string;
}

export class PaginatedBlogPostListDto extends PageMetaDto {
  @ApiProperty({ type: [BlogPostDto] })
  items: BlogPostDto[];
}
