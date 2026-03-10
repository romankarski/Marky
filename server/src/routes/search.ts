import { FastifyPluginAsync } from 'fastify';
import matter from 'gray-matter';
import fs from 'fs/promises';
import { SearchService, SearchIndexPayload } from '../lib/search.js';
import { resolveSafePath } from '../lib/pathSecurity.js';

declare module 'fastify' {
  interface FastifyInstance {
    searchService: SearchService;
  }
}

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/search/index — return full serialized search index payload
  fastify.get('/api/search/index', async (_req, _reply) => {
    const payload: SearchIndexPayload = {
      index: fastify.searchService.getIndexJSON(),
      tags: fastify.searchService.getAllTags(),
      tagMap: fastify.searchService.getTagMap(),
    };
    return payload;
  });

  // PATCH /api/files/* (handles /api/files/<path>/tags) — update tags in file frontmatter
  // Fastify 5 does not support wildcards in the middle of routes (e.g. /api/files/*/tags).
  // The wildcard captures everything including "/tags" suffix, which we strip here.
  fastify.patch<{ Params: { '*': string }; Body: { tags: string[] } }>(
    '/api/files/*',
    async (req, reply) => {
      const rawParam = req.params['*'];
      // Strip trailing /tags suffix to get the actual file path
      const filePath = rawParam.endsWith('/tags')
        ? rawParam.slice(0, -'/tags'.length)
        : rawParam;
      const safe = await resolveSafePath(filePath, fastify.rootDir).catch(() => {
        reply.code(400);
        return null;
      });
      if (!safe) return;

      const raw = await fs.readFile(safe, 'utf-8');
      const parsed = matter(raw);
      parsed.data.tags = req.body.tags;

      // Lock watcher to prevent SSE bounce after write
      fastify.fileWatcher.lock(filePath);

      // Write back using matter.stringify(content, data) — NOT matter.stringify(rawString, data)
      const updated = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(safe, updated, 'utf-8');

      // Update search index incrementally
      await fastify.searchService.updateDoc(fastify.rootDir, filePath);

      return { tags: req.body.tags };
    },
  );
};

export default searchRoutes;
