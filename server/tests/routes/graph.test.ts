// Wave 0 RED tests — /api/graph/tags route not registered yet.
// These tests should return 404 until Wave 1 adds the graph route.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import type { SearchService } from '../../src/lib/search.js';
import type { BacklinkService } from '../../src/lib/backlinks.js';

let tmpDir: string;
let app: FastifyInstance;

async function waitForSearchIndex(
  instance: FastifyInstance & { searchService: SearchService },
): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (instance.searchService.getAllTags().length > 0) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  throw new Error('SearchService did not finish indexing graph fixtures');
}

async function waitForBacklinks(
  instance: FastifyInstance & { backlinkService: BacklinkService },
): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (instance.backlinkService.getAllForwardLinks().length > 0) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  throw new Error('BacklinkService did not finish indexing graph fixtures');
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-graph-route-test-'));
  await fs.mkdir(path.join(tmpDir, 'notes'), { recursive: true });

  await fs.writeFile(
    path.join(tmpDir, 'notes', 'alpha.md'),
    '---\ntags: [shared, overlap]\n---\nAlpha note',
  );
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'beta.md'),
    '---\ntags: [shared, overlap]\n---\nBeta note',
  );
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'gamma.md'),
    '---\ntags: [shared]\n---\nGamma note',
  );
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'delta.md'),
    '# Delta\n\nNo frontmatter tags here.',
  );
  // Extra file with a wikilink to alpha — used by the fileLinks test.
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'linker.md'),
    'See [[alpha]] for context.',
  );

  app = await buildApp({ rootDir: tmpDir, enableWatcher: false });
  await waitForSearchIndex(app as FastifyInstance & { searchService: SearchService });
  await waitForBacklinks(app as FastifyInstance & { backlinkService: BacklinkService });
});

afterEach(async () => {
  await app.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('GET /api/graph/tags', () => {
  it('GRPH-01 — returns every markdown file as a node, including untagged isolated files', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/graph/tags',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body).toEqual({
      nodes: expect.any(Array),
      links: expect.any(Array),
    });
    expect(body.nodes).toHaveLength(5);

    expect(body.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'notes/alpha.md',
          path: 'notes/alpha.md',
          label: 'alpha',
          tags: ['shared', 'overlap'],
          tagCount: 2,
        }),
        expect.objectContaining({
          id: 'notes/beta.md',
          path: 'notes/beta.md',
          label: 'beta',
          tags: ['shared', 'overlap'],
          tagCount: 2,
        }),
        expect.objectContaining({
          id: 'notes/gamma.md',
          path: 'notes/gamma.md',
          label: 'gamma',
          tags: ['shared'],
          tagCount: 1,
        }),
        expect.objectContaining({
          id: 'notes/delta.md',
          path: 'notes/delta.md',
          label: 'delta',
          tags: [],
          tagCount: 0,
        }),
        expect.objectContaining({
          id: 'notes/linker.md',
          path: 'notes/linker.md',
          label: 'linker',
          tags: [],
          tagCount: 0,
        }),
      ]),
    );
  });

  it('GRPH-01 — collapses shared-tag pairs into weighted links with sharedTags metadata', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/graph/tags',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'notes/alpha.md',
          target: 'notes/beta.md',
          sharedTags: ['shared', 'overlap'],
          weight: 2,
        }),
        expect.objectContaining({
          source: 'notes/alpha.md',
          target: 'notes/gamma.md',
          sharedTags: ['shared'],
          weight: 1,
        }),
        expect.objectContaining({
          source: 'notes/beta.md',
          target: 'notes/gamma.md',
          sharedTags: ['shared'],
          weight: 1,
        }),
      ]),
    );

    const alphaBetaLinks = body.links.filter(
      (link: { source: string; target: string }) =>
        (link.source === 'notes/alpha.md' && link.target === 'notes/beta.md') ||
        (link.source === 'notes/beta.md' && link.target === 'notes/alpha.md'),
    );

    expect(alphaBetaLinks).toHaveLength(1);
    expect(body.links.every((link: { weight: unknown }) => typeof link.weight === 'number')).toBe(true);
    expect(
      body.links.some(
        (link: { source: string; target: string }) =>
          link.source === 'notes/delta.md' || link.target === 'notes/delta.md',
      ),
    ).toBe(false);
    // linker has no tags so it should not participate in tag-based links
    expect(
      body.links.some(
        (link: { source: string; target: string }) =>
          link.source === 'notes/linker.md' || link.target === 'notes/linker.md',
      ),
    ).toBe(false);
  });

  it('omits fileLinks when includeLinks is not set', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/graph/tags' });
    const body = JSON.parse(response.payload);
    expect(body.fileLinks).toBeUndefined();
  });

  it('includes file-to-file edges from wiki/markdown links when includeLinks=true', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/graph/tags?includeLinks=true',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);

    expect(Array.isArray(body.fileLinks)).toBe(true);
    expect(body.fileLinks).toEqual(
      expect.arrayContaining([
        { source: 'notes/linker.md', target: 'notes/alpha.md' },
      ]),
    );
    // tag-based links remain present alongside file links
    expect(body.links.length).toBeGreaterThan(0);
  });
});
