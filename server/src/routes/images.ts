import { FastifyPluginAsync } from 'fastify';
import { resolveSafePath } from '../lib/pathSecurity.js';
import fs from 'fs/promises';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// Prefixes that identify an absolute OS path (not root-relative markdown path).
// Any path starting with these is passed as-is to resolveSafePath.
// Paths starting with '/' but NOT in this list are treated as root-relative
// markdown paths and have the leading '/' stripped before resolution.
const OS_ROOT_PREFIXES = [
  '/Users/',
  '/home/',
  '/root/',
  '/var/',
  '/private/',
  '/tmp/',
  '/etc/',
  '/opt/',
  '/usr/',
  '/sys/',
  '/proc/',
  '/dev/',
  '/mnt/',
  '/media/',
  '/run/',
  '/srv/',
];

export const imagesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: { path?: string } }>(
    '/api/image',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { path: { type: 'string' } },
        },
      },
    },
    async (req, reply) => {
      const rawPath = req.query.path;

      if (!rawPath || rawPath.trim() === '') {
        reply.code(400);
        return { error: 'Missing path query parameter', code: 'MISSING_PATH' };
      }

      // Root-relative path handling: if path starts with '/' but is NOT an absolute
      // OS path (e.g. /Users/..., /home/..., /private/...), strip the leading '/'
      // so resolveSafePath resolves it relative to rootDir.
      let resolvedRaw = rawPath;
      if (
        rawPath.startsWith('/') &&
        !OS_ROOT_PREFIXES.some((prefix) => rawPath.startsWith(prefix))
      ) {
        resolvedRaw = rawPath.slice(1);
      }

      let safePath: string;
      try {
        safePath = await resolveSafePath(resolvedRaw, fastify.rootDir);
      } catch {
        reply.code(403);
        return { error: 'Access denied', code: 'FORBIDDEN' };
      }

      const ext = path.extname(safePath).toLowerCase();
      const mimeType = MIME_MAP[ext];
      if (!mimeType) {
        reply.code(415);
        return { error: 'Unsupported image type', code: 'UNSUPPORTED_TYPE' };
      }

      let fileBytes: Buffer;
      try {
        fileBytes = await fs.readFile(safePath);
      } catch (err: unknown) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr.code === 'ENOENT') {
          reply.code(404);
          return { error: 'File not found', code: 'NOT_FOUND' };
        }
        reply.code(500);
        return { error: 'Internal server error', code: 'INTERNAL_ERROR' };
      }

      reply.header('Content-Type', mimeType);
      return reply.send(fileBytes);
    }
  );
};
