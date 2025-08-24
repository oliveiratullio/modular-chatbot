import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      version: process.env.npm_package_version ?? '0.1.0',
    };
  }
}
