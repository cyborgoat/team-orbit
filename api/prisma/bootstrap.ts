import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function bootstrapAdmin(
  prisma: PrismaClient,
  credentials: {
    username?: string;
    fullName?: string;
    password?: string;
    email?: string;
  },
) {
  const username = credentials.username?.trim();
  const fullName = credentials.fullName?.trim();
  if (
    !username ||
    username.length < 3 ||
    !fullName ||
    !credentials.password ||
    credentials.password.length < 6
  ) {
    throw new Error(
      'Set BOOTSTRAP_ADMIN_USERNAME (min 3 characters), BOOTSTRAP_ADMIN_NAME, and BOOTSTRAP_ADMIN_PASSWORD (min 6 characters). No default accounts are created.',
    );
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    if (
      existing.role !== Role.SUPERUSER ||
      existing.status !== UserStatus.ACTIVE
    ) {
      throw new Error(
        'The configured bootstrap username already belongs to an account that is not an active superuser.',
      );
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      username,
      fullName,
      passwordHash: await bcrypt.hash(credentials.password, 10),
      email: credentials.email?.trim() || null,
      role: Role.SUPERUSER,
      status: UserStatus.ACTIVE,
    },
  });
}
