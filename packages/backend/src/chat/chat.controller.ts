import type { ChatRequestDTO, ChatResponseDTO } from '@app/shared';

import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ChatService } from './chat.service.js';

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
      const { message, user_id, conversation_id } = parse.data;

      // chama o serviço no formato atual (message + meta)
      const result = await this.chat.handle(message, {
        userId: user_id,
        conversationId: conversation_id,
      });

      return {
        response: result.response,
        source_agent_response: result.source_agent_response ?? '',
        agent_workflow: result.agent_workflow,
      };
    } catch {
      throw new HttpException(
        { error_code: 'INTERNAL_ERROR' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
