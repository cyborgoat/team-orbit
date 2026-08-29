import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '../common/utils';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(page = 1, limit = 20, q?: string) {
    const { skip, take } = paginate(page, limit);
    const where = q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return { items, total, page, limit: take };
  }

  async findOne(id: string) {
    const item = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    if (!item) throw new NotFoundException('Announcement not found');
    return item;
  }

  async create(dto: CreateAnnouncementDto, authorId: string) {
    const item = await this.prisma.announcement.create({
      data: { ...dto, authorId },
      include: {
        author: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    await this.notifications.createAndBroadcast({
      type: 'announcement.created',
      title: 'New announcement',
      body: item.title,
      resourceType: 'announcement',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.findOne(id);
    return this.prisma.announcement.update({
      where: { id },
      data: dto,
      include: {
        author: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.delete({ where: { id } });
  }
}
