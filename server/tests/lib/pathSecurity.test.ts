import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { resolveSafePath } from '../../src/lib/pathSecurity.js';

let tmpRoot: string;

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'marky-sec-test-'));
  // Create a real file so realpath() can resolve it
  await fs.writeFile(path.join(tmpRoot, 'existing.md'), '# hello');
});

afterAll(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe('resolveSafePath', () => {
  it('resolves a valid relative path to an absolute path within ROOT_DIR', async () => {
    const result = await resolveSafePath('existing.md', tmpRoot);
    const realRoot = await fs.realpath(tmpRoot);
    expect(result.startsWith(realRoot) || result.startsWith(tmpRoot)).toBe(true);
  });

  it('throws on path traversal attempt ../../etc/passwd', async () => {
    await expect(resolveSafePath('../../etc/passwd', tmpRoot)).rejects.toThrow();
  });

  it('throws on URL-encoded traversal %2e%2e%2fetc%2fpasswd', async () => {
    await expect(resolveSafePath('%2e%2e%2fetc%2fpasswd', tmpRoot)).rejects.toThrow();
  });

  it('resolves empty string to root itself (no traversal)', async () => {
    const result = await resolveSafePath('', tmpRoot);
    expect(result).toBe(tmpRoot);
  });
});
