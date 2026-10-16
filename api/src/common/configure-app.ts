import { INestApplication, ValidationPipe } from '@nestjs/common';
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api', { exclude: ['metrics'] });
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
}
