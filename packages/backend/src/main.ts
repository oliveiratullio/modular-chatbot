// packages/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import fastifyHelmet, { type FastifyHelmetOptions } from '@fastify/helmet';
import fastifyCors, { type FastifyCorsOptions } from '@fastify/cors';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Pega a instância tipada do Fastify
  const fastify: FastifyInstance = app.getHttpAdapter().getInstance();

  // Helmet
  const helmetOpts: FastifyHelmetOptions = {};
  await fastify.register(fastifyHelmet, helmetOpts);

  // CORS
  const corsOpts: FastifyCorsOptions = { origin: true };
  await fastify.register(fastifyCors, corsOpts);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(8080, '0.0.0.0');

  console.log('Backend up on http://localhost:8080');
}
bootstrap();
