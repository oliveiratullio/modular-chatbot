import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  HttpCode,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Inject,
} from '@nestjs/common';
import { z } from 'zod';
import { ChatService } from './chat.service.js';
import { HistoryService } from '../services/history.service.js';

import type { ChatResponseDTO } from '../agents/contracts.js';
import type { HistoryQuestion } from '../services/history.service.js';

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
  constructor(
    @Inject(ChatService) private readonly chat: ChatService,
    @Inject(HistoryService) private readonly historyService: HistoryService,
  ) {}

  @Post('/chat')
  @HttpCode(200)
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

  @Get('/history/:userId')
  @HttpCode(200)
  async getHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ): Promise<{ questions: HistoryQuestion[] }> {
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new HttpException(
        { error_code: 'INVALID_LIMIT' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const questions = await this.historyService.getUserHistory(
      userId,
      limitNum,
    );
    return { questions };
  }

  @Delete('/history/:userId/question/:questionId')
  @HttpCode(200)
  async removeQuestion(
    @Param('userId') userId: string,
    @Param('questionId') questionId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.historyService.removeQuestion(
      questionId,
      userId,
    );
    return { success };
  }

  @Delete('/history/:userId')
  @HttpCode(200)
  async clearHistory(
    @Param('userId') userId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.historyService.clearUserHistory(userId);
    return { success };
  }
}
