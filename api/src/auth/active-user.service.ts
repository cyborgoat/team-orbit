import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { userSelect } from '../common/media';
@Injectable()
export class ActiveUserService {
  constructor(private readonly prisma: PrismaService) {}
  async find(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    return user?.status === 'ACTIVE' ? user : null;
  }
}
