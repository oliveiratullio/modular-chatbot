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
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string }).message ?? message);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 404 não é erro de aplicação: logar como WARN
    const logPayload = {
      scope: 'AllExceptionsFilter',
      path: request.url,
      method: request.method,
      status,
      error: message,
    } as const;
    if (status === HttpStatus.NOT_FOUND) {
      logger.warn({ level: 'WARN', ...logPayload });
    } else {
      logger.error({ level: 'ERROR', ...logPayload });
    }

    response.status(status).send({
      statusCode: status,
      path: request.url,
      error: message,
    });
  }
}
