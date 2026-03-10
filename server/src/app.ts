import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import filesRoutes from './routes/files.js';
import watchRoutes from './routes/watch.js';
import searchRoutes from './routes/search.js';
import { FileWatcherService } from './lib/watcher.js';
import { SearchService } from './lib/search.js';

declare module 'fastify' {
  interface FastifyInstance {
    fileWatcher: FileWatcherService;
  }
}

export interface AppOptions { rootDir: string; logger?: boolean; }

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: opts.logger ?? false });
  await fastify.register(cors, { origin: true });
  fastify.decorate('rootDir', opts.rootDir);
  const watcher = new FileWatcherService(opts.rootDir);
  fastify.decorate('fileWatcher', watcher);
  fastify.addHook('onClose', async () => { await watcher.close(); });
  const searchService = new SearchService();
  fastify.decorate('searchService', searchService);
  searchService.buildFromDir(opts.rootDir).catch((err) => {
    fastify.log.error({ err }, 'SearchService.buildFromDir failed');
  });
  watcher.subscribe((event) => {
    if (event.type === 'unlink') {
      searchService.removeDoc(event.path);
    } else {
      searchService.updateDoc(opts.rootDir, event.path).catch(() => {});
    }
  });
  await fastify.register(filesRoutes);
  await fastify.register(watchRoutes);
  await fastify.register(searchRoutes);
  return fastify;
}
