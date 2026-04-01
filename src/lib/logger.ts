import pino from 'pino';

/**
 * Structured logger using Pino.
 * - Development: pretty-printed, colourised output via pino-pretty
 * - Production:  fast JSON output for log aggregation (Datadog, Loki, etc.)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export default logger;
