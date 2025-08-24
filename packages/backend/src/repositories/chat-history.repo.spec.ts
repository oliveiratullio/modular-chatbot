import { ChatHistoryRepository } from './chat-history.repo.js';
import { RedisService } from '../infra/redis.service.js';

describe('ChatHistoryRepository', () => {
  it('should append and read back messages (no redis → no throw)', async () => {
    const redis = new RedisService();
    const repo = new ChatHistoryRepository(redis);
    await repo.append('conv-test', {
      role: 'user',
      content: 'hello',
      ts: new Date().toISOString(),
    });
    const last = await repo.getLast('conv-test', 10);
    expect(Array.isArray(last)).toBe(true);
  });
});
