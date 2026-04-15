// Wave 0 RED tests — /api/backlinks/* route not registered yet.
// Tests will return 404 until Wave 1 registers backlinksRoutes in app.ts.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

let tmpDir: string;
let app: FastifyInstance;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-backlinks-route-test-'));
  app = await buildApp({ rootDir: tmpDir, enableWatcher: false });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/backlinks/*', () => {
  it('returns 200 { backlinks: [] } when no files link to the target', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/backlinks/some-note.md' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('backlinks');
    expect(Array.isArray(body.backlinks)).toBe(true);
    expect(body.backlinks).toEqual([]);
  });

  it('returns 200 { backlinks: string[] } for path with slash in it', async () => {
    // Write two fixture files: source.md links to knowledge/decisions.md
    await fs.mkdir(path.join(tmpDir, 'knowledge'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, 'source.md'),
      '# Source\n\n[Decisions](./knowledge/decisions.md)',
    );
    await fs.writeFile(
      path.join(tmpDir, 'knowledge', 'decisions.md'),
      '# Decisions',
    );
    // Allow backlink service to index (it runs buildFromDir at startup — but here we rely on the
    // service returning [] gracefully since it hasn't indexed yet; main contract is 200 + shape)
    const res = await app.inject({
      method: 'GET',
      url: '/api/backlinks/knowledge/decisions.md',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('backlinks');
    expect(Array.isArray(body.backlinks)).toBe(true);
  });

  it('returns 200 { backlinks: [] } for nonexistent file (not 404)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/backlinks/nonexistent.md',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('backlinks');
    expect(body.backlinks).toEqual([]);
  });

  it('response always has shape { backlinks: string[] }', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/backlinks/any.md' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body).toBe('object');
    expect(body).toHaveProperty('backlinks');
    expect(Array.isArray(body.backlinks)).toBe(true);
    for (const item of body.backlinks) {
      expect(typeof item).toBe('string');
    }
  });
});
