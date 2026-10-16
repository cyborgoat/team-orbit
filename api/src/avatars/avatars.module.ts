import { Module } from '@nestjs/common';
import { AvatarsController } from './avatars.controller';

@Module({ controllers: [AvatarsController] })
export class AvatarsModule {}
