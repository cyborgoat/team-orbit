import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateForumPostDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ description: 'Markdown body; embed images as ![](/uploads/...)' })
  @IsString()
  @MinLength(1)
  content: string;
}

export class UpdateForumPostDto extends PartialType(CreateForumPostDto) {}

export class CreateForumCommentDto {
  @ApiProperty({ description: 'Markdown body' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description: 'Top-level comment id to reply to (one-level nesting only)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateForumCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  content: string;
}

export class VoteDto {
  @ApiProperty({
    description: '1 = upvote, -1 = downvote, 0 = clear vote',
    enum: [1, -1, 0],
  })
  @Type(() => Number)
  @IsInt()
  @IsIn([1, -1, 0])
  value: 1 | -1 | 0;
}
