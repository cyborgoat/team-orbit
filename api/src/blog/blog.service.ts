import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginate,
  parseTags,
  stringifyTags,
} from '../common/utils';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private map(item: { tags: string; [key: string]: unknown }) {
    return { ...item, tags: parseTags(item.tags) };
  }

  async findAll(page = 1, limit = 20, q?: string, tag?: string) {
    const { skip, take } = paginate(page, limit);
    const where = {
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { content: { contains: q } },
            ],
          }
        : {}),
      ...(tag ? { tags: { contains: tag } } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.blogPost.findMany({
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
      this.prisma.blogPost.count({ where }),
    ]);
    return {
      items: rows.map((r) => this.map(r)),
      total,
      page,
      limit: take,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    if (!item) throw new NotFoundException('Blog post not found');
    return this.map(item);
  }

  async create(dto: CreateBlogPostDto, authorId: string) {
    const item = await this.prisma.blogPost.create({
      data: {
        title: dto.title,
        content: dto.content,
        tags: stringifyTags(dto.tags),
        coverImageUrl: dto.coverImageUrl,
        authorId,
      },
      include: {
        author: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    await this.notifications.createAndBroadcast({
      type: 'blog.created',
      title: 'New blog post',
      body: item.title,
      resourceType: 'blog',
      resourceId: item.id,
    });
    return this.map(item);
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    await this.findOne(id);
    const item = await this.prisma.blogPost.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        ...(dto.tags ? { tags: stringifyTags(dto.tags) } : {}),
      },
      include: {
        author: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });
    return this.map(item);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.blogPost.delete({ where: { id } });
  }
}
