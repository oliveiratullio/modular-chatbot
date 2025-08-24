import { stripHtml } from '../../utils/sanitize.js';
import { FastifyRequest } from 'fastify';

type ReqWithBody = FastifyRequest & { body?: Record<string, unknown> };

export async function sanitizeMiddleware(req: ReqWithBody): Promise<void> {
  if (
    req.method === 'POST' &&
    req.body &&
    typeof req.body.message === 'string'
  ) {
    req.body.message = stripHtml(req.body.message);
  }
}
