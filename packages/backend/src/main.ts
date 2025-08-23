import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors, { type FastifyCorsOptions } from '@fastify/cors';
import { ValidationPipe, type INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // instância Fastify tipada (para registrar plugins)
  const fastify = app
    .getHttpAdapter()
    .getInstance() as unknown as FastifyInstance;
  await fastify.register(fastifyHelmet);

  const corsOpts: FastifyCorsOptions = {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : true,
    methods: ['GET', 'POST', 'OPTIONS'],
  };
  await fastify.register(fastifyCors, corsOpts);

  // ✅ cast seguro p/ interface do Nest (expõe useGlobalPipes)
  const nestApp = app as unknown as INestApplication;
  nestApp.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');

  console.log(`Backend up on http://localhost:${port}`);
}
bootstrap();
