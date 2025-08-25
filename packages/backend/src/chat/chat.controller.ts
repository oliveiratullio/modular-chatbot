import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ChatService } from './chat.service.js';
import type { ChatRequestDTO, ChatResponseDTO } from '../agents/contracts.js';

const ChatSchema = z.object({
  message: z.string().min(1),
  user_id: z.string().min(1),
  conversation_id: z.string().min(1),
});

@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('/chat')
  async chatEndpoint(@Body() body: ChatRequestDTO): Promise<ChatResponseDTO> {
    const parse = ChatSchema.safeParse(body);
    if (!parse.success) {
      throw new HttpException(
        { error_code: 'INVALID_PAYLOAD' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      return await this.chat.handle(parse.data);
    } catch {
      throw new HttpException(
        { error_code: 'INTERNAL_ERROR' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
