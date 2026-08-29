import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '../common/utils';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
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
            { location: { contains: q } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: { startAt: 'asc' },
        include: {
          createdBy: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total, page, limit: take };
  }

  async findOne(id: string) {
    const item = await this.prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    if (!item) throw new NotFoundException('Event not found');
    return item;
  }

  async create(dto: CreateEventDto, createdById: string) {
    const item = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        location: dto.location,
        coverImageUrl: dto.coverImageUrl,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    await this.notifications.createAndBroadcast({
      type: 'event.created',
      title: 'New event',
      body: item.title,
      resourceType: 'event',
      resourceId: item.id,
    });
    return item;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startAt ? { startAt: new Date(dto.startAt) } : {}),
        ...(dto.endAt ? { endAt: new Date(dto.endAt) } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.event.delete({ where: { id } });
  }
}
