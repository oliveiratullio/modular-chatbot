import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../logging/logger.service.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: unknown = { error: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      payload = exception.getResponse();
    } else if (exception instanceof Error) {
      payload = { error: exception.message };
    }

    // 404 não é erro de aplicação: logar como WARN
    const logPayload = {
      scope: 'AllExceptionsFilter',
      path: request.url,
      method: request.method,
      status,
      error:
        typeof payload === 'string'
          ? payload
          : ((payload as { error?: string; message?: string })?.error ??
            (payload as { message?: string })?.message),
    } as const;
    if (status === HttpStatus.NOT_FOUND) {
      logger.warn({ level: 'WARN', ...logPayload });
    } else {
      logger.error({ level: 'ERROR', ...logPayload });
    }

    response
      .status(status)
      .send(
        typeof payload === 'string'
          ? { statusCode: status, path: request.url, error: payload }
          : { statusCode: status, path: request.url, ...(payload as object) },
      );
  }
}
