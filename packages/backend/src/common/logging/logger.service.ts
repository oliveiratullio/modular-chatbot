import pino from 'pino';
import { getCorrelation } from '../telemetry/correlation.store.js';

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  messageKey: 'message',
});

type LogPayload = Record<string, unknown>;

function withCorrelation(event: LogPayload): LogPayload {
  // request_id, user_id, conversation_id, etc.
  const corr = getCorrelation();
  return { ...corr, ...event };
}

export const logger = {
  info(event: LogPayload) {
    baseLogger.info(withCorrelation({ level: 'INFO', ...event }));
  },
  warn(event: LogPayload) {
    baseLogger.warn(withCorrelation({ level: 'WARN', ...event }));
  },
  error(event: LogPayload) {
    baseLogger.error(withCorrelation({ level: 'ERROR', ...event }));
  },
  debug(event: LogPayload) {
    baseLogger.debug(withCorrelation({ level: 'DEBUG', ...event }));
  },
};
