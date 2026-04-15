// Wave 0 RED tests — server/src/routes/templates.ts does not exist yet.
// All tests will fail with 404 errors (route not registered) until Wave 1
// creates server/src/routes/templates.ts and registers it in app.ts.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

let tmpDir: string;
let app: FastifyInstance;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-templates-test-'));
  app = await buildApp({ rootDir: tmpDir, enableWatcher: false });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/templates', () => {
  it('returns 200 with { templates: [] } when .marky/templates/ dir is empty', async () => {
    await fs.mkdir(path.join(tmpDir, '.marky', 'templates'), { recursive: true });
    const res = await app.inject({ method: 'GET', url: '/api/templates' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('templates');
    expect(body.templates).toEqual([]);
  });

  it('returns 200 even when .marky/templates/ dir does not exist yet (auto-creates)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/templates' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('templates');
    expect(Array.isArray(body.templates)).toBe(true);
  });
});

describe('POST /api/templates', () => {
  it('creates template file and returns 201 { name: "my-tmpl" }', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: { name: 'my-tmpl', content: '# Hello' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body).toEqual({ name: 'my-tmpl' });
    // File should exist on disk
    await expect(
      fs.access(path.join(tmpDir, '.marky', 'templates', 'my-tmpl.md'))
    ).resolves.toBeUndefined();
  });

  it('returns 400 { error: "Invalid name" } when name is blank', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: { name: '', content: '# Hello' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('error', 'Invalid name');
  });
});

describe('GET /api/templates after POST', () => {
  it('returns the saved template in the list', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: { name: 'my-tmpl', content: '# Hello' },
    });
    const res = await app.inject({ method: 'GET', url: '/api/templates' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'my-tmpl', content: '# Hello' }),
      ])
    );
  });
});
