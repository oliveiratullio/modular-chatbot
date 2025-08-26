import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../infra/redis.service.js';

@Controller()
export class ReadyController {
  constructor(private readonly redis: RedisService) {}

  @Get('ready')
  async ready() {
    // Se o Redis está desabilitado por configuração, considere "ready".
    if (!this.redis.isEnabled) {
      return { ready: true, redis: 'disabled' as const };
    }

    const client = this.redis.raw;
    if (!client) {
      // Proteção extra (não deveria acontecer se isEnabled === true)
      throw new HttpException(
        { ready: false, redis: 'down' as const },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      await client.ping();
      return { ready: true, redis: 'ok' as const };
    } catch {
      throw new HttpException(
        { ready: false, redis: 'down' as const },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
