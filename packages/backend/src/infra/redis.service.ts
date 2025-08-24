import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });
    this.client.on('error', (err) => console.error('Redis error', err));
    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) await this.client.disconnect();
  }

  // exemplos a usar no passo 3
  async appendHistory(key: string, value: string) {
    await this.client.rPush(key, value);
  }

  async getHistory(key: string, count = 20) {
    const len = await this.client.lLen(key);
    const start = Math.max(0, Number(len) - count);
    return this.client.lRange(key, start, -1);
  }
}
