import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis.service.js';

function indexKey(userId: string) {
  return `user:convs:${userId}`;
}

const INDEX_TTL = Number(process.env.USER_CONV_INDEX_TTL ?? 60 * 60 * 24 * 30);

@Injectable()
export class UserConversationsRepository {
  constructor(private readonly redis: RedisService) {}

  async add(userId: string, conversationId: string): Promise<void> {
    const key = indexKey(userId);
    await this.redis.sadd(key, conversationId);
    await this.redis.expire(key, INDEX_TTL);
  }

  async list(userId: string): Promise<string[]> {
    return this.redis.smembers(indexKey(userId));
  }
}
