import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Will be imported once Plan 02 creates server entrypoint
// import { buildApp } from '../../src/app.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/files', () => {
  it('returns recursive tree JSON with items array', async () => {
    // TODO: implement once buildApp exists
    // const app = await buildApp({ rootDir: tmpDir });
    // const response = await app.inject({ method: 'GET', url: '/api/files' });
    // expect(response.statusCode).toBe(200);
    // const body = JSON.parse(response.body);
    // expect(body).toHaveProperty('items');
    // expect(Array.isArray(body.items)).toBe(true);
    expect(true).toBe(true); // placeholder
  });
});

describe('GET /api/files/*', () => {
  it('returns file content for a markdown file', async () => {
    expect(true).toBe(true); // placeholder
  });
});

describe('POST /api/files/*', () => {
  it('creates a new file and returns 201', async () => {
    expect(true).toBe(true); // placeholder
  });
});

describe('PUT /api/files/* (rename)', () => {
  it('renames a file and returns updated path', async () => {
    expect(true).toBe(true); // placeholder
  });
});

describe('DELETE /api/files/*', () => {
  it('deletes a file and returns 204', async () => {
    expect(true).toBe(true); // placeholder
  });
});
