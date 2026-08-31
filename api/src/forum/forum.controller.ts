import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  CreateForumCommentDto,
  CreateForumPostDto,
  UpdateForumCommentDto,
  UpdateForumPostDto,
  VoteDto,
} from './dto/forum.dto';
import { ForumService } from './forum.service';

@ApiTags('forum-posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ForumController {
  constructor(private forum: ForumService) {}

  @Get('forum-posts')
  findAll(@Query() query: PaginationQueryDto) {
    return this.forum.findAll(query.page, query.limit, query.q);
  }

  @Get('forum-posts/:id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.forum.findOne(id, user.id);
  }

  @Post('forum-posts')
  create(
    @Body() dto: CreateForumPostDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.forum.create(dto, user.id);
  }

  @Patch('forum-posts/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateForumPostDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.forum.update(id, dto, user);
  }

  @Delete('forum-posts/:id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.forum.remove(id, user);
  }

  @Post('forum-posts/:id/comments')
  createComment(
    @Param('id') id: string,
    @Body() dto: CreateForumCommentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.forum.createComment(id, dto, user.id);
  }

  @Put('forum-posts/:id/vote')
  votePost(
    @Param('id') id: string,
    @Body() dto: VoteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.forum.votePost(id, user.id, dto);
  }

  @Patch('forum-comments/:id')
  updateComment(
    @Param('id') id: string,
    @Body() dto: UpdateForumCommentDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.forum.updateComment(id, dto, user);
  }

  @Delete('forum-comments/:id')
  removeComment(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.forum.removeComment(id, user);
  }

  @Put('forum-comments/:id/vote')
  voteComment(
    @Param('id') id: string,
    @Body() dto: VoteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.forum.voteComment(id, user.id, dto);
  }
}
