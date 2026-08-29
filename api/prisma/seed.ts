import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const superuser = await prisma.user.upsert({
    where: { email: 'super@teamorbit.local' },
    update: {},
    create: {
      username: 'superadmin',
      fullName: 'Super Admin',
      email: 'super@teamorbit.local',
      passwordHash,
      role: Role.SUPERUSER,
      status: UserStatus.ACTIVE,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@teamorbit.local' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'Team Admin',
      email: 'admin@teamorbit.local',
      passwordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@teamorbit.local' },
    update: {},
    create: {
      username: 'member',
      fullName: 'Team Member',
      email: 'user@teamorbit.local',
      passwordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Seeded users:', {
    superuser: superuser.email,
    admin: admin.email,
    user: user.email,
    password: 'password123',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
