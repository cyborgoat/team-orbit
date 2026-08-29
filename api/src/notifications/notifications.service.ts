import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createAndBroadcast(input: {
    type: string;
    title: string;
    body: string;
    resourceType: string;
    resourceId: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: input,
    });
    this.gateway.broadcastNew(notification);
    return notification;
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
