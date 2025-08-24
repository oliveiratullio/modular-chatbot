import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { InjectionGuard } from '../common/security/injection.guard.js';

@Module({
  controllers: [ChatController],
  providers: [ChatService, InjectionGuard],
  exports: [ChatService],
})
export class ChatModule {}
