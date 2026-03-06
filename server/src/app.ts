import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import filesRoutes from './routes/files.js';

export interface AppOptions {
  rootDir: string;
  logger?: boolean;
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: opts.logger ?? false });
  await fastify.register(cors, { origin: true });
  // Pass rootDir to routes via decoration
  fastify.decorate('rootDir', opts.rootDir);
  await fastify.register(filesRoutes);
  return fastify;
}
