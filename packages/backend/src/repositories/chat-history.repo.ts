import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis.service.js';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: string;
  agent?: string;
};

function historyKey(conversationId: string) {
  return `chat:history:${conversationId}`;
}

const HISTORY_TTL = Number(process.env.CHAT_HISTORY_TTL ?? 60 * 60 * 24 * 7);

@Injectable()
export class ChatHistoryRepository {
  constructor(private readonly redis: RedisService) {}

  async append(conversationId: string, msg: ChatMessage): Promise<void> {
    const key = historyKey(conversationId);
    await this.redis.appendList(key, JSON.stringify(msg));
    await this.redis.expire(key, HISTORY_TTL);
  }

  async getLast(conversationId: string, count = 50): Promise<ChatMessage[]> {
    const key = historyKey(conversationId);
    const raw = await this.redis.lrangeTail(key, count);
    return raw.map((s) => JSON.parse(s) as ChatMessage);
  }

  async clear(conversationId: string): Promise<void> {
    const key = historyKey(conversationId);
    await this.redis.del(key);
  }
}
