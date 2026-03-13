import { FastifyPluginAsync } from 'fastify';
import { BacklinkService } from '../lib/backlinks.js';

declare module 'fastify' {
  interface FastifyInstance {
    backlinkService: BacklinkService;
  }
}

const backlinksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { '*': string } }>('/api/backlinks/*', async (req, _reply) => {
    const filePath = req.params['*'];
    const backlinks = fastify.backlinkService.getBacklinks(filePath);
    return { backlinks };
  });
};

export default backlinksRoutes;
