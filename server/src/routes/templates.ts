import { FastifyPluginAsync } from 'fastify';
import fs from 'fs/promises';
import path from 'path';

const TMPL_SUBDIR = '.marky/templates';

const templatesRoutes: FastifyPluginAsync = async (fastify) => {
  const tmplDir = () => path.join(fastify.rootDir, TMPL_SUBDIR);

  fastify.get('/api/templates', async (_req, _reply) => {
    await fs.mkdir(tmplDir(), { recursive: true });
    const files = await fs.readdir(tmplDir());
    const entries = await Promise.all(
      files
        .filter((f) => f.endsWith('.md'))
        .map(async (f) => ({
          name: f.replace(/\.md$/, ''),
          content: await fs.readFile(path.join(tmplDir(), f), 'utf-8'),
        }))
    );
    return { templates: entries };
  });

  fastify.post<{ Body: { name: string; content: string } }>(
    '/api/templates',
    async (req, reply) => {
      const safeName = req.body.name.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim();
      if (!safeName) {
        reply.code(400);
        return { error: 'Invalid name' };
      }
      await fs.mkdir(tmplDir(), { recursive: true });
      await fs.writeFile(path.join(tmplDir(), `${safeName}.md`), req.body.content, { flag: 'w' });
      reply.code(201);
      return { name: safeName };
    }
  );
};

export default templatesRoutes;
