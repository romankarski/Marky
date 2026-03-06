import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

let tmpDir: string;
let app: FastifyInstance;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-api-test-'));
  app = await buildApp({ rootDir: tmpDir });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/files', () => {
  it('returns recursive tree JSON with items array', async () => {
    await fs.writeFile(path.join(tmpDir, 'readme.md'), '# Hello');
    const res = await app.inject({ method: 'GET', url: '/api/files' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.some((f: any) => f.name === 'readme.md')).toBe(true);
  });
});

describe('GET /api/files/*', () => {
  it('returns file content for a markdown file', async () => {
    await fs.writeFile(path.join(tmpDir, 'note.md'), '# Note\nHello world');
    const res = await app.inject({ method: 'GET', url: '/api/files/note.md' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.content).toContain('Hello world');
  });
});

describe('POST /api/files/*', () => {
  it('creates a new file and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/files/new-note.md',
      payload: { content: '# New Note' },
    });
    expect(res.statusCode).toBe(201);
    const exists = await fs.stat(path.join(tmpDir, 'new-note.md')).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});

describe('PUT /api/files/* (rename)', () => {
  it('renames a file and returns updated path', async () => {
    await fs.writeFile(path.join(tmpDir, 'old.md'), '# Old');
    const res = await app.inject({
      method: 'PUT',
      url: '/api/files/old.md',
      payload: { newPath: 'renamed.md' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.path).toBe('renamed.md');
    const renamedExists = await fs.stat(path.join(tmpDir, 'renamed.md')).then(() => true).catch(() => false);
    expect(renamedExists).toBe(true);
  });
});

describe('DELETE /api/files/*', () => {
  it('deletes a file and returns 204', async () => {
    await fs.writeFile(path.join(tmpDir, 'to-delete.md'), '# Delete me');
    const res = await app.inject({ method: 'DELETE', url: '/api/files/to-delete.md' });
    expect(res.statusCode).toBe(204);
    const exists = await fs.stat(path.join(tmpDir, 'to-delete.md')).then(() => true).catch(() => false);
    expect(exists).toBe(false);
  });
});
