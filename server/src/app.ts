import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import filesRoutes from './routes/files.js';
import watchRoutes from './routes/watch.js';
import searchRoutes from './routes/search.js';
import { imagesRoutes } from './routes/images.js';
import templatesRoutes from './routes/templates.js';
import backlinksRoutes from './routes/backlinks.js';
import { FileWatcherService } from './lib/watcher.js';
import { SearchService } from './lib/search.js';
import { BacklinkService } from './lib/backlinks.js';

declare module 'fastify' {
  interface FastifyInstance {
    fileWatcher: FileWatcherService;
    rootDir: string;
    backlinkService: BacklinkService;
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
  const backlinkService = new BacklinkService();
  fastify.decorate('backlinkService', backlinkService);
  backlinkService.buildFromDir(opts.rootDir).catch((err) => {
    fastify.log.error({ err }, 'BacklinkService.buildFromDir failed');
  });
  watcher.subscribe((event) => {
    if (event.type === 'unlink') {
      searchService.removeDoc(event.path);
      backlinkService.removeDoc(event.path);
    } else {
      searchService.updateDoc(opts.rootDir, event.path).catch(() => {});
      backlinkService.updateDoc(opts.rootDir, event.path).catch(() => {});
    }
  });
  await fastify.register(filesRoutes);
  await fastify.register(watchRoutes);
  await fastify.register(searchRoutes);
  await fastify.register(imagesRoutes);
  await fastify.register(templatesRoutes);
  await fastify.register(backlinksRoutes);
  return fastify;
}
