import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { ReadyController } from './ready.controller.js';
import { RedisModule } from '../infra/redis.module.js';
import { LogsController } from './logs.controller.js';
import { AgentLogsRepository } from '../repositories/agent-logs.repo.js';

@Module({
  imports: [RedisModule],
  controllers: [HealthController, ReadyController, LogsController],
  providers: [AgentLogsRepository],
})
export class HealthModule {}
