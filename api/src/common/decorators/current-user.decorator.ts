import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      user?: { id: string; role: import('@prisma/client').Role };
    }>();
    return request.user;
  },
);
