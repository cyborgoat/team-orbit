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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPERUSER)
  findAll(@Query() query: PaginationQueryDto) {
    return this.users.findAll(query.page, query.limit, query.q, query.status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERUSER)
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERUSER)
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: { role: Role },
  ) {
    return this.users.create(dto, user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERUSER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.users.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERUSER)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { role: Role },
  ) {
    return this.users.remove(id, user.role);
  }
}
