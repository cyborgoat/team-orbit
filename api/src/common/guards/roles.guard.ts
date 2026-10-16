import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role: Role } }>();
    if (!user) return false;
    if (user.role === Role.SUPERUSER) return true;
    return requiredRoles.includes(user.role);
  }
}
