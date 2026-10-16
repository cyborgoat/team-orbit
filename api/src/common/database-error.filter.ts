import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
@Catch(Prisma.PrismaClientKnownRequestError)
export class DatabaseErrorFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const mappings: Record<string, [number, string]> = {
      P2002: [409, 'A record with those unique fields already exists'],
      P2025: [404, 'Record not found'],
      P2003: [400, 'Invalid related record'],
    };
    const [statusCode, message] = mappings[error.code] ?? [
      500,
      'Database operation failed',
    ];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ statusCode, message });
  }
}
