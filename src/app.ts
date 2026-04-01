import crypto from 'crypto';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

import compression from 'compression';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env, allowedOrigins } from './config/env';
import { API_PREFIX } from './constants';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';
import { requestId } from './middleware/requestId.middleware';
import { globalLimiter } from './middleware/rateLimiter.middleware';
import authRouter from './modules/auth/auth.router';
import dashboardRouter from './modules/dashboard/dashboard.router';
import recordsRouter from './modules/records/records.router';
import usersRouter from './modules/users/users.router';

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.disable('x-powered-by');
app.use(helmet({
  frameguard: { action: 'deny' },
}));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  })
);

// ─── Request Tracing ─────────────────────────────────────────────────────────
app.use((req, res, next) => { requestId(req, res, next); });

// ─── HTTP Request Logging (enriched structured Pino) ──────────────────────────
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
    customProps: (req: Request) => ({
      reqId: req.reqId,
      userAgent: req.headers['user-agent'],
      host: req.headers['host'],
      remoteAddress: req.ip,
    }),
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (err || (res.statusCode && res.statusCode >= 500)) return 'error';
      if (res.statusCode && res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req: IncomingMessage & { query?: Record<string, unknown> }) => ({
        method: req.method,
        url: req.url,
        query: req.query,
      }),
      res: (res: ServerResponse) => ({
        statusCode: res.statusCode,
      }),
      err: (err: Error & { type?: string }) => ({
        type: err.type || err.name,
        message: err.message,
        stack: err.stack,
      }),
    },
  })
);

// ─── Body Parsing & Compression ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
app.use((req, res, next) => { void globalLimiter(req, res, next); });

// ─── Swagger ─────────────────────────────────────────────────────────────────
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zorvyn Finance Backend API',
      version: '1.0.0',
      description: 'Finance Data Processing & Role-Based Access Control API',
      contact: { name: 'Zorvyn Team' },
    },
    servers: [
      { url: `http://localhost:${env.PORT}`, description: 'Development' },
      { url: 'https://zorvyn-dashboard.onrender.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // In production, the routers are compiled to .js files in the dist directory
  apis: [
    path.join(__dirname, './modules/**/*.router.js'),
    path.join(__dirname, './modules/**/*.router.ts'),
  ],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions) as Record<string, unknown>;
app.use('/api/docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  swaggerUi.setup(swaggerDocs)(req, res, next);
});

// ─── API v1 Routes ───────────────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/records`, recordsRouter);
app.use(`${API_PREFIX}/dashboard`, dashboardRouter);

// ─── Health & Readiness ──────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  void (async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        db: 'connected',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env.NODE_ENV,
      });
    } catch {
      res.status(503).json({ status: 'error', db: 'disconnected' });
    }
  })();
});

app.get('/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

// Root → docs redirect
app.get('/', (_req: Request, res: Response) => res.redirect('/api/docs'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server Startup with Graceful Shutdown ───────────────────────────────────
if (require.main === module) {
  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        docs: `http://localhost:${env.PORT}/api/docs`,
        api: `http://localhost:${env.PORT}${API_PREFIX}`,
      },
      '🚀 Zorvyn Finance API is running'
    );
  });

  // ── Graceful Shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received — closing gracefully');

    server.close(() => {
      void (async () => {
        logger.info('HTTP server closed');
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
        } catch (err) {
          logger.error({ err }, 'Error disconnecting from database');
        }
        logger.info('Shutdown complete');
        process.exit(0);
      })();
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => { shutdown('SIGTERM'); });
  process.on('SIGINT', () => { shutdown('SIGINT'); });

  // Catch unhandled errors to prevent silent crashes
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

export default app;
