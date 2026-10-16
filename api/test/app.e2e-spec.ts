import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerStorage } from '@nestjs/throttler';
import { PrismaService } from '../src/prisma/prisma.service';
import type { UserDto } from '../src/users/dto/user.dto';
import type { LoginResponseDto } from '../src/auth/dto/auth.dto';
import { AppModule } from '../src/app.module';

const bodyOf = (response: { body: unknown }) =>
  response.body as UserDto & LoginResponseDto;

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const createdIds: string[] = [];
  const prefix = `auth-test-${Date.now()}`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 1,
            timeToExpire: 60,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(bodyOf(res).status).toBe('ok');
      });
  });

  it('/auth/login (POST) with seed admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@teamorbit.local', password: 'password123' })
      .expect(201);
    expect(bodyOf(res).accessToken).toBeDefined();
  });

  it('logs in with the seed admin username', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password })
      .expect(201);
    expect(bodyOf(res).user.username).toBe('admin');
    expect(bodyOf(res).accessToken).toBeDefined();
  });

  it.each([
    { password: 'password123' },
    {
      username: 'admin',
      email: 'admin@teamorbit.local',
      password: 'password123',
    },
    { username: '', password: 'password123' },
    { email: 'not-an-email', password: 'password123' },
  ])(
    'rejects missing, ambiguous, or invalid login identifiers: %j',
    async (payload) => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)
        .expect(400);
    },
  );

  it.each([
    { username: 'admin', password: 'wrong-password' },
    { username: 'no-such-user', password: 'password123' },
    { email: 'nobody@teamorbit.local', password: 'password123' },
  ])('rejects invalid credentials: %j', async (payload) => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(payload)
      .expect(401);
  });

  it('allows multiple registrations without email, preserving approval and username uniqueness', async () => {
    const register = async (suffix: string, email?: string | null) => {
      const result = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: `${prefix}-${suffix}`,
          fullName: 'No Email Member',
          password,
          ...(email !== undefined ? { email } : {}),
        })
        .expect(201);
      createdIds.push(bodyOf(result).id);
      expect(bodyOf(result).email).toBeNull();
      expect(bodyOf(result).status).toBe('PENDING');
      return bodyOf(result);
    };
    const first = await register('omitted');
    await register('empty', '');
    await register('null', null);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: first.username, password })
      .expect(401);
    await prisma.user.update({
      where: { id: first.id },
      data: { status: 'ACTIVE' },
    });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: first.username, password })
      .expect(201);
    expect(bodyOf(login).user.email).toBeNull();
    await request(app.getHttpServer())
      .get('/auth/me')
      .auth(bodyOf(login).accessToken, { type: 'bearer' })
      .expect(200)
      .expect((res) => expect(bodyOf(res).email).toBeNull());
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: first.username, fullName: 'Duplicate', password })
      .expect(409);
  });

  it('validates optional email, keeps it unique, and allows adding and removing it', async () => {
    const payload = {
      username: `${prefix}-email`,
      fullName: 'Email Member',
      password,
      email: `${prefix}@example.com`,
    };
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...payload, email: 'invalid-email' })
      .expect(400);
    const result = await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);
    createdIds.push(bodyOf(result).id);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...payload, username: `${prefix}-duplicate-email` })
      .expect(409);
    await prisma.user.update({
      where: { id: bodyOf(result).id },
      data: { status: 'ACTIVE' },
    });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password })
      .expect(201);
    const token = bodyOf(login).accessToken;
    await request(app.getHttpServer())
      .patch('/auth/me')
      .auth(token, { type: 'bearer' })
      .send({ email: null })
      .expect(200)
      .expect((res) => expect(bodyOf(res).email).toBeNull());
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: payload.username, password })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/auth/me')
      .auth(token, { type: 'bearer' })
      .send({ email: payload.email })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/auth/me')
      .auth(token, { type: 'bearer' })
      .send({ email: '' })
      .expect(200)
      .expect((res) => expect(bodyOf(res).email).toBeNull());
  });

  it('allows an admin to create an active account without email', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password })
      .expect(201);
    const result = await request(app.getHttpServer())
      .post('/users')
      .auth(bodyOf(login).accessToken, { type: 'bearer' })
      .send({
        username: `${prefix}-admin-created`,
        fullName: 'Admin Created',
        password,
      })
      .expect(201);
    createdIds.push(bodyOf(result).id);
    expect(bodyOf(result).email).toBeNull();
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: bodyOf(result).username, password })
      .expect(201);
  });

  it.each(['INACTIVE', 'SUSPENDED', 'DELETED'] as const)(
    'continues to reject %s accounts',
    async (status) => {
      const username = `${prefix}-${status.toLowerCase()}`;
      const user = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, fullName: 'Blocked Member', password })
        .expect(201);
      createdIds.push(bodyOf(user).id);
      await prisma.user.update({
        where: { id: bodyOf(user).id },
        data: { status },
      });
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password })
        .expect(401);
    },
  );
});
