import 'dotenv/config';
import { buildApp } from './app.js';
import fastifyStatic from '@fastify/static';
import path from 'path';

const ROOT_DIR = process.env.ROOT_DIR;
if (!ROOT_DIR) throw new Error('ROOT_DIR environment variable is required. Set it in .env');

const app = await buildApp({ rootDir: ROOT_DIR, logger: true });

// Production: serve React build from client/dist/
if (process.env.NODE_ENV === 'production') {
  await app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), '../../client/dist'),
  });
  app.setNotFoundHandler((req, reply) => {
    reply.sendFile('index.html');
  });
}

await app.listen({ port: 3001, host: '127.0.0.1' });
