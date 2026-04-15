import { FastifyPluginAsync } from 'fastify';
import { SearchService } from '../lib/search.js';
import { BacklinkService } from '../lib/backlinks.js';

declare module 'fastify' {
  interface FastifyInstance {
    searchService: SearchService;
    backlinkService: BacklinkService;
  }
}

const graphRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/graph/tags', async (request) => {
    const includeLinks = (request.query as { includeLinks?: string } | undefined)?.includeLinks === 'true';
    return fastify.searchService.getTagGraphPayload(
      includeLinks ? fastify.backlinkService : undefined,
    );
  });
};

export default graphRoutes;
