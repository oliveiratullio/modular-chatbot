import { ValidationPipe as NestValidationPipe } from '@nestjs/common';
export const ValidationPipe = new NestValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});
