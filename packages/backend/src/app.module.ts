import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { ChatModule } from './chat/chat.module.js';
import { RedisModule } from './infra/redis.module.js';

@Module({
  imports: [HealthModule, ChatModule, RedisModule],
})
export class AppModule {}
