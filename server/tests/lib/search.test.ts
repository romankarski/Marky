// Wave 0 stub — RED state intentional. Passes after Plan 03 creates SearchService.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import MiniSearch from 'minisearch';
import { SearchService } from '../../src/lib/search.js';

let tmpDir: string;
let service: SearchService;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-search-test-'));

  // Create fixture directory structure
  await fs.mkdir(path.join(tmpDir, 'notes'), { recursive: true });

  // notes/hello.md — tags as array in frontmatter
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'hello.md'),
    '---\ntags: [search, test]\n---\nhello world',
  );

  // notes/other.md — tags as string variant in frontmatter
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'other.md'),
    '---\ntags: search\n---\ncompletely different content',
  );

  // notes/empty.md — no frontmatter
  await fs.writeFile(
    path.join(tmpDir, 'notes', 'empty.md'),
    'no tags here',
  );

  service = new SearchService();
  await service.buildFromDir(tmpDir);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('SearchService.buildFromDir', () => {
  it('SRCH-01 — search returns result with path matching the indexed file', () => {
    // Deserialize the index via MiniSearch.loadJSON to verify search works
    const miniSearch = MiniSearch.loadJSON(JSON.stringify(service.getIndexJSON()), {
      fields: ['name', 'text'],
      storeFields: ['name', 'path', 'text', 'tags'],
    });

    const results = miniSearch.search('hello');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.path === 'notes/hello.md')).toBe(true);
  });

  it('SRCH-02 — search result includes name, path, text fields; text is snippet (<=500 chars)', () => {
    const miniSearch = MiniSearch.loadJSON(JSON.stringify(service.getIndexJSON()), {
      fields: ['name', 'text'],
      storeFields: ['name', 'path', 'text', 'tags'],
    });

    const results = miniSearch.search('hello');
    expect(results.length).toBeGreaterThan(0);

    const result = results[0];
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('text');
    expect(typeof result.name).toBe('string');
    expect(typeof result.path).toBe('string');
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeLessThanOrEqual(500);
  });

  it('TAG-01 array variant — notes/hello.md has tags [search, test]', () => {
    const tagMap = service.getTagMap();
    expect(tagMap['search']).toBeDefined();
    expect(tagMap['test']).toBeDefined();
    expect(tagMap['search'].sort()).toContain('notes/hello.md');
    expect(tagMap['test'].sort()).toContain('notes/hello.md');
  });

  it('TAG-01 string variant — notes/other.md has tags [search]', () => {
    const tagMap = service.getTagMap();
    expect(tagMap['search']).toBeDefined();
    expect(tagMap['search'].sort()).toContain('notes/other.md');
  });

  it('TAG-01 no frontmatter — notes/empty.md has tags []', () => {
    const tagMap = service.getTagMap();
    // empty.md should not appear in any tag bucket
    const allTaggedPaths = Object.values(tagMap).flat();
    expect(allTaggedPaths).not.toContain('notes/empty.md');
  });

  it('SRCH-01 + TAG-01 — getAllTags() returns sorted deduplicated union of all tags', () => {
    const tags = service.getAllTags();
    expect(tags).toEqual(['search', 'test']);
  });

  it('TAG-01 — getTagMap() returns correct mapping of tags to file paths', () => {
    const tagMap = service.getTagMap();
    expect(tagMap['search'].sort()).toEqual(['notes/hello.md', 'notes/other.md'].sort());
    expect(tagMap['test'].sort()).toEqual(['notes/hello.md'].sort());
  });

  it('updateDoc — replaces existing doc without throwing', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'notes', 'hello.md'),
      '---\ntags: [search, test]\n---\nupdated hello content',
    );
    await expect(service.updateDoc(tmpDir, 'notes/hello.md')).resolves.not.toThrow();
  });

  it('removeDoc — removes doc without throwing; subsequent search does not return that file', async () => {
    expect(() => service.removeDoc('notes/hello.md')).not.toThrow();

    const miniSearch = MiniSearch.loadJSON(JSON.stringify(service.getIndexJSON()), {
      fields: ['name', 'text'],
      storeFields: ['name', 'path', 'text', 'tags'],
    });
    const results = miniSearch.search('hello');
    const found = results.some((r) => r.path === 'notes/hello.md');
    expect(found).toBe(false);
  });
});
