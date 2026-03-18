import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export default async function uploadImageRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB max
    },
  });

  fastify.post('/api/upload-image', async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    const imagesDir = path.join(fastify.rootDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // Sanitize filename: keep only alphanumeric, dots, hyphens, underscores
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;
    const dest = path.join(imagesDir, filename);

    const buffer = await data.toBuffer();
    await fs.writeFile(dest, buffer);

    return { path: `/images/${filename}` };
  });
}
