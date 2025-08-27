import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Inject,
} from '@nestjs/common';
import { z } from 'zod';
import { ChatService } from './chat.service.js';

import type { ChatResponseDTO } from '../agents/contracts.js';

const MAX_LEN = Number(process.env.MSG_MAX_LEN ?? 1000);
const SAFE_CHARS = /^[\p{L}\p{N}\p{P}\p{Zs}]+$/u;

const ChatSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(MAX_LEN)
    .refine((v) => SAFE_CHARS.test(v), { message: 'INVALID_CHARS' }),
  user_id: z.string().min(1).max(200),
  conversation_id: z.string().min(1).max(200),
});

@Controller()
export class ChatController {
  constructor(@Inject(ChatService) private readonly chat: ChatService) {}

  @Post('/chat')
  async chatEndpoint(@Body() body: unknown): Promise<ChatResponseDTO> {
    // Aceita text/plain com JSON string
    const materialized =
      typeof body === 'string' ? (JSON.parse(body) as unknown) : body;
    const parsed = ChatSchema.safeParse(materialized);
    if (!parsed.success) {
      throw new HttpException(
        { error_code: 'INVALID_PAYLOAD' },
        HttpStatus.BAD_REQUEST,
      );
    }
    // Deixe exceções de domínio e HttpExceptions subirem para o filtro global
    return this.chat.handle(parsed.data);
  }
}
