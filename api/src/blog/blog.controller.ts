import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiDefaultResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ArticleQueryDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { BlogService } from './blog.service';
import {
  BlogPostDto,
  CreateBlogPostDto,
  PaginatedBlogPostListDto,
  UpdateBlogPostDto,
} from './dto/blog.dto';
import { OkDto, ErrorDto } from '../common/dto/response.dto';

@ApiDefaultResponse({ type: ErrorDto })
@ApiTags('blog-posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blog-posts')
export class BlogController {
  constructor(private blog: BlogService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedBlogPostListDto })
  findAll(@Query() query: ArticleQueryDto) {
    return this.blog.findAll(query.page, query.limit, query.q, query.tag);
  }

  @Get(':id')
  @ApiOkResponse({ type: BlogPostDto })
  findOne(@Param('id') id: string) {
    return this.blog.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERUSER)
  @ApiCreatedResponse({ type: BlogPostDto })
  create(@Body() dto: CreateBlogPostDto, @CurrentUser() user: { id: string }) {
    return this.blog.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERUSER)
  @ApiOkResponse({ type: BlogPostDto })
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blog.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERUSER)
  @ApiOkResponse({ type: OkDto })
  remove(@Param('id') id: string) {
    return this.blog.remove(id);
  }
}
