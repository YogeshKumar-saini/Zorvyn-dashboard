import pino from 'pino';

/**
 * Structured logger using Pino.
 * - Development: pretty-printed, colourised output via pino-pretty
 * - Production:  fast JSON output for log aggregation (Datadog, Loki, etc.)
 */
const options: pino.LoggerOptions = {
  level: process.env['LOG_LEVEL'] || 'info',
};

// Only enable pretty printing if explicitly in development mode
// This prevents crashes in production where pino-pretty (devDependency) is missing.
if (process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev') {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(options);
