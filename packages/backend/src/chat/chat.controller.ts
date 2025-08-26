import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ChatService } from './chat.service.js';
import type { ChatResponseDTO } from '../agents/contracts.js';

const ChatSchema = z.object({
  message: z.string().min(1),
  user_id: z.string().min(1),
  conversation_id: z.string().min(1),
});

@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('/chat')
  async chatEndpoint(@Body() body: unknown): Promise<ChatResponseDTO> {
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpException(
        { error_code: 'INVALID_PAYLOAD' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.chat.handle(parsed.data);
    } catch {
      throw new HttpException(
        { error_code: 'INTERNAL_ERROR' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
