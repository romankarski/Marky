import { FastifyPluginAsync } from 'fastify';
import { SearchService } from '../lib/search.js';

declare module 'fastify' {
  interface FastifyInstance {
    searchService: SearchService;
  }
}

const graphRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/graph/tags', async () => fastify.searchService.getTagGraphPayload());
};

export default graphRoutes;
