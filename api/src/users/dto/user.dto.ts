import { MediaInput } from '../../common/media';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PageMetaDto } from '../../common/dto/response.dto';
import { Transform } from 'class-transformer';
import { Role, UserStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Custom avatar URL; null restores the default animal avatar.',
  })
  @IsOptional()
  @MediaInput()
  avatarUrl?: string | null;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({
    type: String,
    description:
      'Absolute effective avatar URL, including the default when unset.',
  })
  avatarUrl: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedUsersDto extends PageMetaDto {
  @ApiProperty({ type: [UserDto] })
  items: UserDto[];
}
