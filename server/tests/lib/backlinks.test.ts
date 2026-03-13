// Wave 0 RED tests — server/src/lib/backlinks.ts does not exist yet.
// All tests will fail with import errors until Wave 1 creates BacklinkService.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { BacklinkService } from '../../src/lib/backlinks.js';

let tmpDir: string;
let service: BacklinkService;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-backlinks-test-'));
  service = new BacklinkService();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('BacklinkService._extractTargets (via updateDoc)', () => {
  it('wikilink [[My Note]] → my note.md (lowercase)', async () => {
    await fs.writeFile(path.join(tmpDir, 'source.md'), '# Source\n\n[[My Note]]');
    await service.updateDoc(tmpDir, 'source.md');
    expect(service.getBacklinks('my note.md')).toContain('source.md');
  });

  it('wikilink [[Wiki Link With Spaces]] → wiki link with spaces.md (spaces preserved, lowercase)', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'source.md'),
      '# Source\n\n[[Wiki Link With Spaces]]',
    );
    await service.updateDoc(tmpDir, 'source.md');
    expect(service.getBacklinks('wiki link with spaces.md')).toContain('source.md');
  });

  it('wikilink [[Note|Alias]] → note.md (alias stripped)', async () => {
    await fs.writeFile(path.join(tmpDir, 'source.md'), '# Source\n\n[[Note|Alias]]');
    await service.updateDoc(tmpDir, 'source.md');
    expect(service.getBacklinks('note.md')).toContain('source.md');
  });

  it('wikilink [[Note.md]] → note.md (no double extension)', async () => {
    await fs.writeFile(path.join(tmpDir, 'source.md'), '# Source\n\n[[Note.md]]');
    await service.updateDoc(tmpDir, 'source.md');
    expect(service.getBacklinks('note.md')).toContain('source.md');
  });

  it('standard md link [label](./other.md) → rootDir-relative lowercased path', async () => {
    await fs.writeFile(path.join(tmpDir, 'source.md'), '# Source\n\n[See this](./other.md)');
    await service.updateDoc(tmpDir, 'source.md');
    expect(service.getBacklinks('other.md')).toContain('source.md');
  });

  it('ignores content inside YAML frontmatter (gray-matter strips it)', async () => {
    const content = `---
title: Source
see_also: "[[FrontmatterTarget]]"
---

# Source

No wikilinks in body.
`;
    await fs.writeFile(path.join(tmpDir, 'source.md'), content);
    await service.updateDoc(tmpDir, 'source.md');
    expect(service.getBacklinks('frontmattertarget.md')).toEqual([]);
  });
});

describe('BacklinkService.updateDoc — stale-entry removal', () => {
  it('file previously linked to A now links to B → A.getBacklinks() returns []', async () => {
    // First: source.md links to target-a.md
    await fs.writeFile(path.join(tmpDir, 'source.md'), '# Source\n\n[[target-a]]');
    await service.updateDoc(tmpDir, 'source.md');
    expect(service.getBacklinks('target-a.md')).toContain('source.md');

    // Then: source.md is updated to link to target-b.md instead
    await fs.writeFile(path.join(tmpDir, 'source.md'), '# Source\n\n[[target-b]]');
    await service.updateDoc(tmpDir, 'source.md');

    // A should no longer have source.md as a backlink
    expect(service.getBacklinks('target-a.md')).toEqual([]);
    // B should now have source.md as a backlink
    expect(service.getBacklinks('target-b.md')).toContain('source.md');
  });
});

describe('BacklinkService.getBacklinks', () => {
  it('case-insensitive — index keyed lowercase, query lowercased', async () => {
    await fs.writeFile(path.join(tmpDir, 'source.md'), '# Source\n\n[[MyNote]]');
    await service.updateDoc(tmpDir, 'source.md');
    // Query with original case — should still find it
    expect(service.getBacklinks('MyNote.md')).toContain('source.md');
  });

  it('returns [] for unknown path (not throws)', () => {
    expect(service.getBacklinks('does-not-exist.md')).toEqual([]);
  });
});
