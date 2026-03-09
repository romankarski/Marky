import { FastifyPluginAsync } from 'fastify';

const watchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/watch', async (req, reply) => {
    const res = reply.raw;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const unsubscribe = fastify.fileWatcher.subscribe((event) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify({ path: event.path })}\n\n`);
    });

    await new Promise<void>((resolve) => req.raw.on('close', resolve));

    unsubscribe();
  });
};

export default watchRoutes;
