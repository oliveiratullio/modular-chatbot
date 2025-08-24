import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis.service.js';

export type AgentLog = {
  ts: string;
  level: 'INFO' | 'ERROR' | 'DEBUG';
  agent: 'RouterAgent' | 'KnowledgeAgent' | 'MathAgent' | 'HTTP' | string;
  message?: string;
  data?: Record<string, unknown>;
};

function logKey(conversationId: string) {
  return `agent:logs:${conversationId}`;
}

const LOG_TTL = Number(process.env.AGENT_LOG_TTL ?? 60 * 60 * 24 * 7);

@Injectable()
export class AgentLogsRepository {
  constructor(private readonly redis: RedisService) {}

  async push(conversationId: string, log: AgentLog): Promise<void> {
    const key = logKey(conversationId);
    await this.redis.appendList(key, JSON.stringify(log));
    await this.redis.expire(key, LOG_TTL);
  }

  async tail(conversationId: string, count = 100): Promise<AgentLog[]> {
    const key = logKey(conversationId);
    const raw = await this.redis.lrangeTail(key, count);
    return raw.map((s) => JSON.parse(s) as AgentLog);
  }
}
