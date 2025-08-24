import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { InjectionGuard } from '../common/security/injection.guard.js';
import { ChatHistoryRepository } from '../repositories/chat-history.repo.js';
import { UserConversationsRepository } from '../repositories/user-conversations.repo.js';
import { AgentLogsRepository } from '../repositories/agent-logs.repo.js';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    InjectionGuard,
    ChatHistoryRepository,
    UserConversationsRepository,
    AgentLogsRepository,
  ],
  exports: [ChatService],
})
export class ChatModule {}
