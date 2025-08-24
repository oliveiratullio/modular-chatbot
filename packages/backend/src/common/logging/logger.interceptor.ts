import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { logger } from './logger.service.js';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const start = performance.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = performance.now() - start;
          logger.info({
            level: 'INFO',
            agent: 'HTTP',
            method: req.method,
            url: req.url,
            conversation_id: req.body?.conversation_id,
            user_id: req.body?.user_id,
            execution_time: ms,
          });
        },
        error: (err) => {
          const ms = performance.now() - start;
          logger.error({
            level: 'ERROR',
            agent: 'HTTP',
            method: req.method,
            url: req.url,
            error: err?.message,
            stack:
              process.env.NODE_ENV === 'production' ? undefined : err?.stack,
            execution_time: ms,
          });
        },
      }),
    );
  }
}
