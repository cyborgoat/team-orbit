import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OkDto {
  @ApiProperty({ example: true })
  ok: boolean;
}

export class PageMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class UserSummaryDto {
  @ApiProperty()
  avatarUrl: string;
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;
}

export class ErrorDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({
    description: 'Error message, or a list of validation messages',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiPropertyOptional({ example: 'Unauthorized' })
  error?: string;
}
