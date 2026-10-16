import { UserStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  q?: string;
}

export class ArticleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  tag?: string;
}

export class UsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
