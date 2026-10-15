import { ApiProperty } from '@nestjs/swagger';

export class UploadResultDto {
  @ApiProperty({ example: '/uploads/3f2a...png' })
  url: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  size: number;
}
