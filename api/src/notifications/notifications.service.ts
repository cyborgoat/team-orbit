import { Prisma } from '@prisma/client';
import { paginate } from '../common/utils';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createWithNotification<T>(
    create: (tx: Prisma.TransactionClient) => Promise<T>,
    input: (item: T) => {
      type: string;
      title: string;
      body: string;
      resourceType: string;
      resourceId: string;
    },
  ) {
    const { item, notification } = await this.prisma.$transaction(
      async (tx) => {
        const item = await create(tx);
        const notification = await tx.notification.create({
          data: input(item),
        });
        return { item, notification };
      },
    );
    try {
      await this.gateway.broadcastNew(notification);
    } catch {
      this.logger.warn(
        `Notification ${notification.id} persisted, but live delivery failed`,
      );
    }
    return item;
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const { skip, take } = paginate(page, limit);
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          reads: { where: { userId }, take: 1 },
        },
      }),
      this.prisma.notification.count(),
    ]);
    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        resourceType: n.resourceType,
        resourceId: n.resourceId,
        createdAt: n.createdAt,
        read: n.reads.length > 0,
      })),
      total,
      page: Math.max(page, 1),
      limit: take,
    };
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notificationRead.upsert({
      where: {
        userId_notificationId: { userId, notificationId },
      },
      create: { userId, notificationId },
      update: { readAt: new Date() },
    });
  }
}
