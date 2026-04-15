// Wave 0 stub — RED state intentional. Passes after Plan 03 creates SearchService + search routes.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

let tmpDir: string;
let app: FastifyInstance;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-search-route-test-'));

  // Create fixture directory structure
  await fs.mkdir(path.join(tmpDir, 'notes'), { recursive: true });

  // notes/hello.md with frontmatter and body
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'hello.md'),
    '---\ntags: [search, test]\n---\nhello world',
  );

  // notes/other.md with string variant tags
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'other.md'),
    '---\ntags: search\n---\ncompletely different content',
  );

  app = await buildApp({ rootDir: tmpDir, enableWatcher: false });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/search/index', () => {
  it('SRCH-01 — returns 200 with index object, tags array, and tagMap object', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/search/index',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('index');
    expect(typeof body.index).toBe('object');
    expect(Array.isArray(body.tags)).toBe(true);
    expect(typeof body.tagMap).toBe('object');
  });
});

describe('PATCH /api/files/*/tags', () => {
  it('TAG-03 — PATCH tags returns 200 with updated tags', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/files/notes/hello.md/tags',
      payload: { tags: ['updated', 'tag'] },
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.tags).toEqual(['updated', 'tag']);
  });

  it('TAG-03 — PATCH tags updates frontmatter on disk and preserves body', async () => {
    await app.inject({
      method: 'PATCH',
      url: '/api/files/notes/hello.md/tags',
      payload: { tags: ['updated', 'tag'] },
    });

    const content = await fs.readFile(
      path.join(tmpDir, 'notes', 'hello.md'),
      'utf-8',
    );

    // Updated tags appear in frontmatter
    expect(content).toContain('updated');
    expect(content).toContain('tag');
    // Body content is preserved
    expect(content).toContain('hello world');
  });

  it('TAG-03 edge — PATCH tags on file with no frontmatter adds frontmatter without corrupting body', async () => {
    // Write a file with no frontmatter
    await fs.writeFile(
      path.join(tmpDir, 'notes', 'plain.md'),
      'just plain content with no frontmatter',
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/files/notes/plain.md/tags',
      payload: { tags: ['newtag'] },
    });

    expect(response.statusCode).toBe(200);

    const content = await fs.readFile(
      path.join(tmpDir, 'notes', 'plain.md'),
      'utf-8',
    );

    expect(content).toContain('newtag');
    // Body content preserved
    expect(content).toContain('just plain content with no frontmatter');
  });

  it('SRCH-01 via route — after PATCH tags, GET /api/search/index returns updated tagMap', async () => {
    // Update tags on hello.md
    await app.inject({
      method: 'PATCH',
      url: '/api/files/notes/hello.md/tags',
      payload: { tags: ['updated', 'tag'] },
    });

    // Fetch updated index
    const indexResponse = await app.inject({
      method: 'GET',
      url: '/api/search/index',
    });

    expect(indexResponse.statusCode).toBe(200);

    const body = JSON.parse(indexResponse.payload);
    expect(body.tagMap['updated']).toBeDefined();
    expect(body.tagMap['updated']).toContain('notes/hello.md');
  });
});
