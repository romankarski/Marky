import fs from 'node:fs/promises';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

export interface StartMarkyServerOptions {
  rootDir: string;
  port: number;
  host?: string;
  staticDir?: string | null;
  logger?: boolean;
}

async function registerStaticUi(app: FastifyInstance, staticDir: string): Promise<void> {
  try {
    const stats = await fs.stat(staticDir);
    if (!stats.isDirectory()) {
      throw new Error('not a directory');
    }
  } catch {
    throw new Error(`Missing client/dist static assets: ${staticDir}`);
  }

  await app.register(fastifyStatic, {
    root: staticDir,
  });

  app.setNotFoundHandler((req, reply) => {
    if (req.method === 'GET' && !req.url.startsWith('/api')) {
      return reply.sendFile('index.html');
    }
    return reply.code(404).send({ error: 'Not found' });
  });
}

export async function attachStaticUi(app: FastifyInstance, staticDir: string): Promise<void> {
  await registerStaticUi(app, staticDir);
}

export async function startMarkyServer(opts: StartMarkyServerOptions): Promise<FastifyInstance> {
  const app = await buildApp({
    rootDir: opts.rootDir,
    logger: opts.logger,
  });

  if (opts.staticDir) {
    await attachStaticUi(app, opts.staticDir);
  }

  await app.listen({
    port: opts.port,
    host: opts.host ?? '127.0.0.1',
  });

  return app;
}
