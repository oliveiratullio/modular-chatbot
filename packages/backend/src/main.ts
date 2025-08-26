// packages/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { LoggerInterceptor } from './common/logging/logger.interceptor.js';
import { AllExceptionsFilter } from './common/security/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  await app.register(fastifyHelmet);

  const allowed = process.env.CORS_ORIGIN?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  await app.register(fastifyCors, { origin: allowed?.length ? allowed : true });

  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 120), // 120 req/janela
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute', // janela
    allowList: (req) => {
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
      return (process.env.RATE_LIMIT_ALLOWLIST ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .includes(ip);
    },
  });

  app.useGlobalInterceptors(new LoggerInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
  console.log('Server running on port: ' + port);
}
bootstrap();
