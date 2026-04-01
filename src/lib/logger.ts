import pino from 'pino';

/**
 * Structured logger using Pino.
 * - Development: pretty-printed, colourised output via pino-pretty
 * - Production:  fast JSON output for log aggregation (Datadog, Loki, etc.)
 */
const options: pino.LoggerOptions = {
  level: process.env['LOG_LEVEL'] || 'info',
};

// Defensive transport initialization: only attempt pino-pretty if in dev AND module is available
if (process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'dev') {
  try {
    // Verify module availability before assigning as transport
    require.resolve('pino-pretty');
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    };
  } catch (err) {
    // Fall back to JSON logging if transport fails to load
    console.warn('⚠️ pino-pretty requested but not found, falling back to JSON.');
  }
}

export const logger = pino(options);
