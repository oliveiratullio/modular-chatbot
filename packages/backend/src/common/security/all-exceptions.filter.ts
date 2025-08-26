import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../logging/logger.service.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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

    // log estruturado
    logger.error({
      level: 'ERROR',
      scope: 'AllExceptionsFilter',
      path: request.url,
      method: request.method,
      status,
      error: message,
    });

    response.status(status).json({
      statusCode: status,
      path: request.url,
      error: message,
    });
  }
}
