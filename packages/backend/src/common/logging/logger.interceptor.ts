import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { logger } from './logger.service.js';

function pickString(obj: unknown, key: string): string | undefined {
  if (
    obj &&
    typeof obj === 'object' &&
    key in (obj as Record<string, unknown>)
  ) {
    const v = (obj as Record<string, unknown>)[key];
    if (typeof v === 'string') return v;
  }
  return undefined;
}

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const start = performance.now();

    // Tipagem segura do body
    const body: unknown = req?.body;
    const conversationId = pickString(body, 'conversation_id');
    const userId = pickString(body, 'user_id');

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = performance.now() - start;
          logger.info({
            level: 'INFO',
            agent: 'HTTP',
            method: req.method,
            url: req.url,
            conversation_id: conversationId,
            user_id: userId,
            execution_time: ms,
          });
        },
        error: (err: unknown) => {
          const ms = performance.now() - start;
          logger.error({
            level: 'ERROR',
            agent: 'HTTP',
            method: req.method,
            url: req.url,
            error: err instanceof Error ? err.message : String(err),
            stack:
              process.env.NODE_ENV === 'production'
                ? undefined
                : err instanceof Error
                  ? err.stack
                  : undefined,
            conversation_id: conversationId,
            user_id: userId,
            execution_time: ms,
          });
        },
      }),
    );
  }
}
