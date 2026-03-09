import { FastifyPluginAsync } from 'fastify';
import { resolveSafePath } from '../lib/pathSecurity.js';
import { buildTree } from '../lib/fsTree.js';
import fs from 'fs/promises';
import path from 'path';
import { ListResponse, FileContentResponse } from '@marky/shared';

declare module 'fastify' {
  interface FastifyInstance {
    rootDir: string;
  }
}

const filesRoutes: FastifyPluginAsync = async (fastify) => {
  const getRoot = () => fastify.rootDir;

  // LIST ROOT — exact route registered FIRST (before wildcard)
  fastify.get('/api/files', async (req, reply) => {
    const items = await buildTree(getRoot(), getRoot());
    return { items } satisfies ListResponse;
  });

  // READ FILE or LIST SUBDIRECTORY
  fastify.get<{ Params: { '*': string } }>('/api/files/*', async (req, reply) => {
    const safe = await resolveSafePath(req.params['*'], getRoot()).catch(() => {
      reply.code(400);
      return null;
    });
    if (!safe) return;
    const stat = await fs.stat(safe).catch(() => null);
    if (!stat) { reply.code(404); return { error: 'Not found', code: 'NOT_FOUND' }; }
    if (stat.isDirectory()) {
      const items = await buildTree(safe, getRoot());
      return { items } satisfies ListResponse;
    }
    const content = await fs.readFile(safe, 'utf-8');
    return { content } satisfies FileContentResponse;
  });

  // CREATE FILE — 'wx' flag fails if file already exists (409)
  fastify.post<{ Params: { '*': string }; Body: { content?: string } }>(
    '/api/files/*', async (req, reply) => {
      const safe = await resolveSafePath(req.params['*'], getRoot()).catch(() => {
        reply.code(400); return null;
      });
      if (!safe) return;
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(safe), { recursive: true });
      await fs.writeFile(safe, req.body?.content ?? '', { flag: 'wx' }).catch((err) => {
        if (err.code === 'EEXIST') { reply.code(409); throw err; }
        throw err;
      });
      reply.code(201);
      return { path: req.params['*'] };
    }
  );

  // WRITE CONTENT or RENAME FILE
  fastify.put<{ Params: { '*': string }; Body: { content?: string; newPath?: string } }>(
    '/api/files/*', async (req, reply) => {
      const safe = await resolveSafePath(req.params['*'], getRoot()).catch(() => {
        reply.code(400); return null;
      });
      if (!safe) return;
      if (req.body?.newPath) {
        const safeDest = await resolveSafePath(req.body.newPath, getRoot()).catch(() => {
          reply.code(400); return null;
        });
        if (!safeDest) return;
        await fs.rename(safe, safeDest);
        return { path: req.body.newPath };
      }
      fastify.fileWatcher.lock(req.params['*']);
      await fs.writeFile(safe, req.body?.content ?? '');
      return { path: req.params['*'] };
    }
  );

  // DELETE FILE (refuse directory deletes)
  fastify.delete<{ Params: { '*': string } }>('/api/files/*', async (req, reply) => {
    const safe = await resolveSafePath(req.params['*'], getRoot()).catch(() => {
      reply.code(400); return null;
    });
    if (!safe) return;
    const stat = await fs.stat(safe).catch(() => null);
    if (!stat) { reply.code(404); return { error: 'Not found', code: 'NOT_FOUND' }; }
    if (stat.isDirectory()) { reply.code(400); return { error: 'Cannot delete directory', code: 'IS_DIRECTORY' }; }
    await fs.rm(safe, { recursive: false });
    reply.code(204);
  });
};

export default filesRoutes;
