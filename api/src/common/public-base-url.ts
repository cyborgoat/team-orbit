import { ConfigService } from '@nestjs/config';
export function publicBaseUrl(config: ConfigService) {
  return config.getOrThrow<string>('PUBLIC_BASE_URL');
}
