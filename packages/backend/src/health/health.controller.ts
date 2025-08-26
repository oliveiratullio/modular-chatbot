import { Controller, Get } from '@nestjs/common';

const VERSION = process.env.APP_VERSION ?? '0.1.0';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', version: VERSION };
  }
}
