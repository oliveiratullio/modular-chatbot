import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AgentLogsRepository } from '../repositories/agent-logs.repo.js';

@Controller('logs')
export class LogsController {
  constructor(private readonly repo: AgentLogsRepository) {}

  @Get(':conversation_id')
  async tail(
    @Param('conversation_id') conversation_id: string,
    @Query('n', ParseIntPipe) n = 100,
  ) {
    const items = await this.repo.tail(conversation_id, n);
    return { conversation_id, count: items.length, items };
  }
}
