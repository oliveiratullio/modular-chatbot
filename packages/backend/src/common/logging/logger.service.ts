import pino from 'pino';
import { getCorrelation } from '../telemetry/correlation.store.js';

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

export const logger = {
  info(event: Record<string, unknown>) {
    const corr = getCorrelation();
    baseLogger.info({ ...corr, ...event });
  },
  error(event: Record<string, unknown>) {
    const corr = getCorrelation();
    baseLogger.error({ ...corr, ...event });
  },
  debug(event: Record<string, unknown>) {
    const corr = getCorrelation();
    baseLogger.debug({ ...corr, ...event });
  },
};
