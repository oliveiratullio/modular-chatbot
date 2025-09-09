import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { InjectionGuard } from '../common/security/injection.guard.js';
import { ChatHistoryRepository } from '../repositories/chat-history.repo.js';
import { UserConversationsRepository } from '../repositories/user-conversations.repo.js';
import { AgentLogsRepository } from '../repositories/agent-logs.repo.js';
import { RedisModule } from '../infra/redis.module.js';
import { agentProviders } from '../agents/index.js';
import { HistoryService } from '../services/history.service.js';

@Module({
  imports: [RedisModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    InjectionGuard,
    ChatHistoryRepository,
    UserConversationsRepository,
    AgentLogsRepository,
    HistoryService,
    ...agentProviders,
  ],
  exports: [ChatService, HistoryService],
})
export class ChatModule {}
