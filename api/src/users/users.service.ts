import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { paginate } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const userSelect = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, q?: string, status?: string) {
    const { skip, take } = paginate(page, limit);
    const where = {
      ...(status ? { status: status as UserStatus } : {}),
      ...(q
        ? {
            OR: [
              { username: { contains: q } },
              { fullName: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit: take };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto, actorRole: Role) {
    if (dto.role === Role.SUPERUSER && actorRole !== Role.SUPERUSER) {
      throw new ForbiddenException('Only superuser can create superusers');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        username: dto.username,
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role ?? Role.USER,
        status: dto.status ?? UserStatus.ACTIVE,
        avatarUrl: dto.avatarUrl,
      },
      select: userSelect,
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actor: { id: string; role: Role },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    if (
      existing.role === Role.SUPERUSER &&
      actor.role !== Role.SUPERUSER &&
      actor.id !== id
    ) {
      throw new ForbiddenException('Cannot modify superuser');
    }
    if (dto.role === Role.SUPERUSER && actor.role !== Role.SUPERUSER) {
      throw new ForbiddenException('Only superuser can assign superuser role');
    }
    if (
      actor.role === Role.ADMIN &&
      dto.role &&
      dto.role !== existing.role &&
      existing.role !== Role.USER
    ) {
      throw new ForbiddenException('Admins cannot change admin roles');
    }

    const data: Record<string, unknown> = { ...dto };
    delete data.password;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async remove(id: string, actorRole: Role) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    if (existing.role === Role.SUPERUSER && actorRole !== Role.SUPERUSER) {
      throw new ForbiddenException('Cannot delete superuser');
    }
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DELETED },
      select: userSelect,
    });
  }
}
