import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { paginate } from '../common/utils';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateForumCommentDto,
  CreateForumPostDto,
  UpdateForumCommentDto,
  UpdateForumPostDto,
  VoteDto,
} from './dto/forum.dto';

const authorSelect = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
} as const;

type Actor = { id: string; role: Role };

@Injectable()
export class ForumService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private assertCanModerate(actor: Actor, authorId: string) {
    if (
      actor.id === authorId ||
      actor.role === Role.ADMIN ||
      actor.role === Role.SUPERUSER
    ) {
      return;
    }
    throw new ForbiddenException('Not allowed to modify this content');
  }

  async findAll(page = 1, limit = 20, q?: string) {
    const { skip, take } = paginate(page, limit);
    const where = q
      ? {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where,
        skip,
        take,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: authorSelect },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.forumPost.count({ where }),
    ]);
    const items = rows.map(({ _count, ...item }) => ({
      ...item,
      commentCount: _count.comments,
    }));
    return { items, total, page, limit: take };
  }

  async findOne(id: string, userId: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: { select: authorSelect },
        votes: { where: { userId }, select: { value: true } },
        comments: {
          where: { parentId: null },
          orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: { select: authorSelect },
            votes: { where: { userId }, select: { value: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                author: { select: authorSelect },
                votes: { where: { userId }, select: { value: true } },
              },
            },
          },
        },
      },
    });
    if (!post) throw new NotFoundException('Forum post not found');

    const mapComment = (comment: {
      id: string;
      content: string;
      score: number;
      postId: string;
      authorId: string;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
      author: {
        id: string;
        username: string;
        fullName: string;
        avatarUrl: string | null;
      };
      votes: { value: number }[];
      replies?: {
        id: string;
        content: string;
        score: number;
        postId: string;
        authorId: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        author: {
          id: string;
          username: string;
          fullName: string;
          avatarUrl: string | null;
        };
        votes: { value: number }[];
      }[];
    }) => {
      const { votes, replies, ...rest } = comment;
      return {
        ...rest,
        myVote: votes[0]?.value ?? 0,
        replies: (replies ?? []).map((r) => {
          const { votes: replyVotes, ...replyRest } = r;
          return {
            ...replyRest,
            myVote: replyVotes[0]?.value ?? 0,
          };
        }),
      };
    };

    const { votes, comments, ...rest } = post;
    return {
      ...rest,
      myVote: votes[0]?.value ?? 0,
      comments: comments.map((c) => mapComment(c)),
    };
  }

  async create(dto: CreateForumPostDto, authorId: string) {
    const item = await this.prisma.forumPost.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId,
      },
      include: { author: { select: authorSelect } },
    });
    await this.notifications.createAndBroadcast({
      type: 'forum.created',
      title: 'New forum post',
      body: item.title,
      resourceType: 'forum',
      resourceId: item.id,
    });
    return { ...item, commentCount: 0, myVote: 0 };
  }

  async update(id: string, dto: UpdateForumPostDto, actor: Actor) {
    const existing = await this.prisma.forumPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Forum post not found');
    this.assertCanModerate(actor, existing.authorId);
    return this.prisma.forumPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
      },
      include: { author: { select: authorSelect } },
    });
  }

  async remove(id: string, actor: Actor) {
    const existing = await this.prisma.forumPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Forum post not found');
    this.assertCanModerate(actor, existing.authorId);
    await this.prisma.forumPost.delete({ where: { id } });
    return { ok: true };
  }

  async createComment(
    postId: string,
    dto: CreateForumCommentDto,
    authorId: string,
  ) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Forum post not found');

    if (dto.parentId) {
      const parent = await this.prisma.forumComment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('Invalid parent comment');
      }
      if (parent.parentId) {
        throw new BadRequestException(
          'Only one level of replies is allowed',
        );
      }
    }

    const comment = await this.prisma.forumComment.create({
      data: {
        content: dto.content,
        postId,
        authorId,
        parentId: dto.parentId,
      },
      include: { author: { select: authorSelect } },
    });

    await this.notifications.createAndBroadcast({
      type: 'forum.comment.created',
      title: 'New forum comment',
      body: post.title,
      resourceType: 'forum',
      resourceId: postId,
    });

    return { ...comment, myVote: 0, replies: [] };
  }

  async updateComment(id: string, dto: UpdateForumCommentDto, actor: Actor) {
    const existing = await this.prisma.forumComment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    this.assertCanModerate(actor, existing.authorId);
    return this.prisma.forumComment.update({
      where: { id },
      data: { content: dto.content },
      include: { author: { select: authorSelect } },
    });
  }

  async removeComment(id: string, actor: Actor) {
    const existing = await this.prisma.forumComment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Comment not found');
    this.assertCanModerate(actor, existing.authorId);
    await this.prisma.forumComment.delete({ where: { id } });
    return { ok: true };
  }

  async votePost(postId: string, userId: string, dto: VoteDto) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Forum post not found');

    const existing = await this.prisma.forumPostVote.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    const prev = existing?.value ?? 0;
    const next = dto.value;
    const delta = next - prev;

    if (next === 0) {
      if (existing) {
        await this.prisma.$transaction([
          this.prisma.forumPostVote.delete({
            where: { userId_postId: { userId, postId } },
          }),
          this.prisma.forumPost.update({
            where: { id: postId },
            data: { score: { increment: delta } },
          }),
        ]);
      }
    } else if (existing) {
      await this.prisma.$transaction([
        this.prisma.forumPostVote.update({
          where: { userId_postId: { userId, postId } },
          data: { value: next },
        }),
        this.prisma.forumPost.update({
          where: { id: postId },
          data: { score: { increment: delta } },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.forumPostVote.create({
          data: { userId, postId, value: next },
        }),
        this.prisma.forumPost.update({
          where: { id: postId },
          data: { score: { increment: delta } },
        }),
      ]);
    }

    const updated = await this.prisma.forumPost.findUniqueOrThrow({
      where: { id: postId },
      select: { score: true },
    });
    return { score: updated.score, myVote: next };
  }

  async voteComment(commentId: string, userId: string, dto: VoteDto) {
    const comment = await this.prisma.forumComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.forumCommentVote.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    const prev = existing?.value ?? 0;
    const next = dto.value;
    const delta = next - prev;

    if (next === 0) {
      if (existing) {
        await this.prisma.$transaction([
          this.prisma.forumCommentVote.delete({
            where: { userId_commentId: { userId, commentId } },
          }),
          this.prisma.forumComment.update({
            where: { id: commentId },
            data: { score: { increment: delta } },
          }),
        ]);
      }
    } else if (existing) {
      await this.prisma.$transaction([
        this.prisma.forumCommentVote.update({
          where: { userId_commentId: { userId, commentId } },
          data: { value: next },
        }),
        this.prisma.forumComment.update({
          where: { id: commentId },
          data: { score: { increment: delta } },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.forumCommentVote.create({
          data: { userId, commentId, value: next },
        }),
        this.prisma.forumComment.update({
          where: { id: commentId },
          data: { score: { increment: delta } },
        }),
      ]);
    }

    const updated = await this.prisma.forumComment.findUniqueOrThrow({
      where: { id: commentId },
      select: { score: true },
    });
    return { score: updated.score, myVote: next };
  }
}
