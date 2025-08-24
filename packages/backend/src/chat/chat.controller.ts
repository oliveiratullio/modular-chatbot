import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ChatRequestDto } from './chat.dto.js';
import { ChatService } from './chat.service.js';
import { InjectionGuard } from '../common/security/injection.guard.js';
import { ValidationPipe } from '../common/security/validation.pipe.js';

@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('chat')
  @UseGuards(InjectionGuard)
  @UsePipes(ValidationPipe)
  async chatbot(@Body() dto: ChatRequestDto) {
    const result = await this.chat.handle(dto.message);
    // Formato exatamente como o desafio pede
    return {
      response: result.response,
      source_agent_response: result.source_agent_response,
      agent_workflow: result.agent_workflow,
    };
  }
}
