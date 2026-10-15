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
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateNewsDto,
  NewsDeletedDto,
  NewsDto,
  PaginatedNewsListDto,
  UpdateNewsDto,
} from './dto/news.dto';
import { NewsService } from './news.service';

@ApiTags('news')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('news')
export class NewsController {
  constructor(private news: NewsService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedNewsListDto })
  findAll(@Query() query: PaginationQueryDto) {
    return this.news.findAll(query.page, query.limit, query.q, query.tag);
  }

  @Get(':id')
  @ApiOkResponse({ type: NewsDto })
  findOne(@Param('id') id: string) {
    return this.news.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERUSER)
  @ApiCreatedResponse({ type: NewsDto })
  create(@Body() dto: CreateNewsDto, @CurrentUser() user: { id: string }) {
    return this.news.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERUSER)
  @ApiOkResponse({ type: NewsDto })
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.news.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERUSER)
  @ApiOkResponse({ type: NewsDeletedDto })
  remove(@Param('id') id: string) {
    return this.news.remove(id);
  }
}
