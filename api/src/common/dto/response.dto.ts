import { ApiProperty } from '@nestjs/swagger';

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
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  fullName: string;
}
