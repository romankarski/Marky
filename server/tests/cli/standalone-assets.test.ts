// Wave 0 RED tests — server/src/start-server.ts does not exist yet.
// These tests lock packaged static asset serving and API co-existence.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { attachStaticUi } from '../../src/start-server.js';

let rootDir: string;
let staticDir: string;
let app: FastifyInstance | null = null;

beforeEach(async () => {
  rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-cli-root-'));
  staticDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-cli-static-'));
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = null;
  }
  await fs.rm(rootDir, { recursive: true, force: true });
  await fs.rm(staticDir, { recursive: true, force: true });
});

describe('startMarkyServer static serving', () => {
  it('serves index.html from the provided staticDir', async () => {
    await fs.writeFile(path.join(staticDir, 'index.html'), '<html><head><title>Marky</title></head><body>ok</body></html>');

    app = await buildApp({ rootDir, logger: false });
    await attachStaticUi(app, staticDir);

    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('<title>Marky</title>');
  });

  it('keeps API routes working while static serving is enabled', async () => {
    await fs.writeFile(path.join(rootDir, 'note.md'), '# Hello');
    await fs.writeFile(path.join(staticDir, 'index.html'), '<html><body>Marky</body></html>');

    app = await buildApp({ rootDir, logger: false });
    await attachStaticUi(app, staticDir);

    const response = await app.inject({
      method: 'GET',
      url: '/api/files',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({ name: 'note.md' }),
      ]),
    });
  });

  it('fails with a clear client/dist error when staticDir does not exist', async () => {
    app = await buildApp({ rootDir, logger: false });

    await expect(
      attachStaticUi(app, path.join(staticDir, 'missing-client-dist'))
    ).rejects.toThrow(/client\/dist/i);
  });
});
