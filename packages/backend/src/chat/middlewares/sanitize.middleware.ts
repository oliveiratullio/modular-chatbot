import { FastifyReply, FastifyRequest } from 'fastify';
import xss from 'xss';

const MAX_LEN = Number(process.env.MSG_MAX_LEN ?? 1000);

// remove tags e normaliza espaços
function clean(s: string) {
  const noTags = xss(s, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
  return noTags.replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
}

export async function sanitizeMiddleware(
  req: FastifyRequest,
  _res: FastifyReply,
) {
  const b = (req.body as { message?: string }) ?? {};
  if (b && typeof b.message === 'string') {
    // @ts-expect-error mutação controlada
    req.body.message = clean(b.message);
  }
}
