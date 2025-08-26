import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { logger } from '../common/logging/logger.service.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client?: RedisClientType;
  private enabled = false;

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      logger.info({
        level: 'INFO',
        agent: 'Redis',
        message: 'REDIS_URL not set → Redis disabled',
      });
      return;
    }
    try {
      this.client = createClient({ url });
      this.client.on('error', (err) =>
        logger.error({
          level: 'ERROR',
          agent: 'Redis',
          error: String(err?.message),
        }),
      );
      await this.client.connect();
      this.enabled = true;
      logger.info({ level: 'INFO', agent: 'Redis', message: 'Connected' });
    } catch (err) {
      logger.error({
        level: 'ERROR',
        agent: 'Redis',
        message: 'Failed to connect, continuing without Redis',
        error: String((err as Error).message),
      });
      this.enabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.disconnect().catch(() => void 0);
  }

  /** Exposição de status para /ready e outros checks */
  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Acesso bruto opcional (use com cuidado) */
  get raw(): RedisClientType | undefined {
    return this.require();
  }

  private require(): RedisClientType | undefined {
    return this.enabled && this.client ? this.client : undefined;
  }

  // ------------- Helpers usados no projeto -------------

  async appendList(key: string, value: string): Promise<void> {
    const c = this.require();
    if (!c) return;
    await c.rPush(key, value);
  }

  async lrangeTail(key: string, count: number): Promise<string[]> {
    const c = this.require();
    if (!c) return [];
    const len = await c.lLen(key);
    const start = Math.max(0, Number(len) - count);
    return c.lRange(key, start, -1);
  }

  async expire(key: string, seconds: number): Promise<void> {
    const c = this.require();
    if (!c) return;
    await c.expire(key, seconds);
  }

  async sadd(key: string, member: string): Promise<void> {
    const c = this.require();
    if (!c) return;
    await c.sAdd(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    const c = this.require();
    if (!c) return [];
    return c.sMembers(key);
  }

  async del(key: string): Promise<void> {
    const c = this.require();
    if (!c) return;
    await c.del(key);
  }

  // ------------- Key/Value utilitários (cache simples) -------------

  async get(key: string): Promise<string | null> {
    const c = this.require();
    if (!c) return null;
    return c.get(key);
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    const c = this.require();
    if (!c) return;
    await c.setEx(key, seconds, value);
  }
}
