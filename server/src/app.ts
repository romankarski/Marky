import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import filesRoutes from './routes/files.js';
import watchRoutes from './routes/watch.js';
import { FileWatcherService } from './lib/watcher.js';

declare module 'fastify' {
  interface FastifyInstance {
    fileWatcher: FileWatcherService;
  }
}

export interface AppOptions {
  rootDir: string;
  logger?: boolean;
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: opts.logger ?? false });
  await fastify.register(cors, { origin: true });
  // Pass rootDir to routes via decoration
  fastify.decorate('rootDir', opts.rootDir);
  // Create singleton file watcher and decorate
  const watcher = new FileWatcherService(opts.rootDir);
  fastify.decorate('fileWatcher', watcher);
  fastify.addHook('onClose', async () => {
    await watcher.close();
  });
  await fastify.register(filesRoutes);
  await fastify.register(watchRoutes);
  return fastify;
}
