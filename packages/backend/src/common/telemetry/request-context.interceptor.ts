import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { correlationStore } from './correlation.store.js';
import { logger } from '../logging/logger.service.js';
import { randomUUID } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

type ChatBody = {
  conversation_id?: string;
  user_id?: string;
  [k: string]: unknown;
};

type Req = FastifyRequest<{ Body: ChatBody }> & { id?: string };
type Res = FastifyReply;

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Req>();
    const res = http.getResponse<Res>();

    const reqId: string = req.id ?? randomUUID();
    const conversation_id = req.body?.conversation_id;
    const user_id = req.body?.user_id;

    res.header('X-Request-Id', reqId);

    const start = performance.now();

    return correlationStore.run({ reqId, conversation_id, user_id }, () =>
      next.handle().pipe(
        tap({
          next: () => {
            const ms = performance.now() - start;
            logger.info({
              level: 'INFO',
              agent: 'HTTP',
              method: req.method,
              url: req.url,
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
      ),
    );
  }
}
