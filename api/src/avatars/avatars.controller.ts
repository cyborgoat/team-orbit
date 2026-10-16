import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { publicBaseUrl } from '../common/public-base-url';
import { avatarPresets } from './presets';

class AvatarPresetDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Absolute public image URL.' }) url: string;
  @ApiProperty() isDefault: boolean;
}

class AvatarPresetsDto {
  @ApiProperty({ type: [AvatarPresetDto] }) items: AvatarPresetDto[];
}

@ApiTags('avatars')
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  @ApiOkResponse({
    type: AvatarPresetsDto,
    description:
      'Available product avatar presets. Public endpoint; no authentication required.',
  })
  list(): AvatarPresetsDto {
    const base = publicBaseUrl(this.config);
    return {
      items: avatarPresets.map(({ path, ...preset }) => ({
        ...preset,
        url: `${base}${path}`,
      })),
    };
  }
}
